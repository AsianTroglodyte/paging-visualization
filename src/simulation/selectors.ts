// The functions below provide convenient views into the memory data structure. 
// it takes in the memory bitmap array and (usually) returns a nice object to work with.
// this is used to more easily build writers, parts of our reducer, other selectors/
// and is used to build data structures that more cleanly to our UI. Think of them as
// essentially the building blocks of advanced queries or views into our memory


import {
    FREE_LIST_ADDRESS,
    START_OF_PAGE_TABLES,
    START_OF_PCBS,
    BYTES_PER_PCB,
    PCB_VALID_BIT_MASK,
    PCB_PROGRAM_COUNTER_MASK,
    PCB_PAGE_TABLE_BASE_MASK,
    PROCESS_COLOR_CLASSES,
} from "./constants";
import { OPCODE_NAMES } from "./isa";
import type { Pages, PageTable, VirtualPage, ProcessControlBlock, ProcessControlBlocks, CpuState } from "./types";

export function getFreeList(mem: number[]): number[] {
    const bitmap = mem[FREE_LIST_ADDRESS];
    const numPages = 8;
    const freePFNList: number[] = [];

    for (let page = 0; page < numPages; page++) {
        if ((bitmap & (1 << page)) !== 0) {
            freePFNList.push(page);
        }
    }

    // list of PFNs that are free
    return freePFNList;
}

export function getProcessControlBlock(mem: number[], processID: number): ProcessControlBlock | null {
    const addr = START_OF_PCBS + processID * BYTES_PER_PCB;
    const byte0 = mem[addr];
    const validBit = byte0 & PCB_VALID_BIT_MASK;
    if (validBit === 0) return null;

    const pageTableBase = (byte0 >> 5) & PCB_PAGE_TABLE_BASE_MASK;
    const programCounter = (byte0 >> 1) & PCB_PROGRAM_COUNTER_MASK;
    const accumulator = mem[addr + 1];

    return {
        processID,
        pageTableBase,
        programCounter,
        validBit,
        accumulator,
    };
}

export function getProcessControlBlocks(mem: number[]): ProcessControlBlocks {
    const blocks: ProcessControlBlocks = [];
    for (let i = 0; i < 4; i++) {
        const pcb = getProcessControlBlock(mem, i);
        if (pcb !== null) blocks.push(pcb);
    }
    return blocks;
}

export function getAllPageTables(memory: number[]): {processID: number, pageTable: PageTable}[] {
    const processControlBlocks = getProcessControlBlocks(memory);
    return processControlBlocks.map(pcb => ({
        processID: pcb.processID,
        pageTable: getPageTable(memory, pcb.processID)
    }));
}


export function getAllProcessPages(memory: number[]): Pages {

    const pages: Pages = [];
    const processControlBlocks = getProcessControlBlocks(memory);

    for (let pageFrameNumber = 2; pageFrameNumber < 8; pageFrameNumber++) {
        const ownerPid = processControlBlocks.find(pcb => {
                const pageTable = getPageTable(memory, pcb.processID);
                return pageTable.some(pte => pte.pfn === pageFrameNumber);
            })?.processID ?? null;
    
        const vpn = ownerPid !== null ? getPageTable(memory, ownerPid).findIndex(pte => pte.pfn === pageFrameNumber) : null;
        
        const bytes = memory.slice(pageFrameNumber * 8, (pageFrameNumber + 1) * 8);

        pages.push({
            pfn: pageFrameNumber,
            ownerPid: ownerPid,
            vpn: vpn,
            isFree: ownerPid === null,
            bytes: bytes,
        });
    }
    return pages;
}


export function getPageTable(memory: number[], processID: number): PageTable {
    const pcb = getProcessControlBlock(memory, processID);
    if (pcb === null) {
        throw new Error(`Process ID ${processID} not found.`);
    }

    const baseAddr = START_OF_PAGE_TABLES + pcb.pageTableBase;
    const numPages = 2;
    return memory.slice(baseAddr, baseAddr + numPages).map(
        (entryByte) => {
            return {
                pfn: (entryByte >> 5),
                valid: ((entryByte & 0b00010000) !== 0),
                present: ((entryByte & 0b00001000) !== 0),
                referenced: ((entryByte & 0b00000100) !== 0),
                dirty: ((entryByte & 0b00000010) !== 0),
                writable: ((entryByte & 0b00000001) !== 0),
            }
        }
    );
}


export function getProcessVirtualAddressSpace(memory: number[], processID: number): VirtualPage[] {
    // console.log("getProcessVirtualAddressSpace: ");
    const processPagetable = getPageTable(memory, processID);

    // since indexes are used to encode the VPNs we can be sure that the pfns
    // will be in the right order
    const pfns = processPagetable.map((pte) => pte.pfn);
    
    const virtualAddressSpace: VirtualPage[] = pfns.map((pfn, index) => {
        const pfnAddressSpace = memory.slice(pfn * 8, pfn * 8 + 8);
        return {
            vpn: index,
            ownerPid: processID,
            pfn: pfn,
            bytes: pfnAddressSpace,
        }
    });    

    return virtualAddressSpace;
}

export function getPage(memory: number[], pfn: number): number[] {
    return memory.slice(pfn * 8, pfn * 8 + 8);
}

export function getProcessVirtualMemory(memory: number[], processID: number): VirtualPage[] {

    const processVirtualAddressSpace = getProcessVirtualAddressSpace(memory, processID);

    const processVirtualMemory = processVirtualAddressSpace.map((virtualPage) => {
        return {
            pfn: virtualPage.pfn,
            bytes: virtualPage.bytes,
        }
    });

    return processVirtualMemory;
}

export function getAllProcessVirtualMemory(memory: number[]): VirtualPage[][] {
    const processControlBlocks = getProcessControlBlocks(memory);
    return processControlBlocks.map(pcb => getProcessVirtualMemory(memory, pcb.processID));
}


/** Fetches the byte at a virtual address for a process. */
export function getByteAtVirtualAddress(
    memory: number[],
    processID: number,
    virtualAddress: number
  ): number {
    if (virtualAddress < 0 || virtualAddress >= 16) {
        throw new Error(`Virtual address ${virtualAddress} is out of bounds. Must be between 0 and 15.`);
    }

    console.log("virtualAddress: ", virtualAddress);

    const pageTable = getPageTable(memory, processID);
    // index of PTE = vpn
    const vpn = Math.floor(virtualAddress / 8);
    const offset = virtualAddress % 8;

    console.log("pageTable: ", pageTable);
    console.log("vpn: ", vpn);
    console.log("offset: ", offset);

    const pfn = pageTable[vpn].pfn; 
    return memory[pfn * 8 + offset];
  }

export function decodeInstruction(instruction: number): { opcode: string, operand: number } {
    const opcode = (instruction & 0b11100000) >> 5;
    const operand = instruction & 0b00011111;
    return { opcode: OPCODE_NAMES[opcode], operand: operand};
}


export function getProcessColorClasses(pid: number | null) {
    if (pid === null) return null;
    return PROCESS_COLOR_CLASSES[Math.abs(pid) % PROCESS_COLOR_CLASSES.length];
}

