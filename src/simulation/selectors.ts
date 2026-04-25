/**
 * Selectors are read-only helpers over the simulator's raw memory byte array.
 * They decode low-level bytes into UI-friendly structures (PCBs, page tables,
 * virtual memory views, instruction metadata) so reducers and components can
 * consume meaningful data without repeating bitwise parsing logic.
 */


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
import type { Pages, PageTable, VirtualPage, ProcessControlBlock, ProcessControlBlocks } from "./types";

/** Returns page frame numbers currently marked free in the free-list bitmap. */
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

/** Decodes a single process control block from memory, or null when invalid. */
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

/** Returns all valid process control blocks currently present in memory. */
export function getProcessControlBlocks(mem: number[]): ProcessControlBlocks {
    const blocks: ProcessControlBlocks = [];
    for (let i = 0; i < 4; i++) {
        const pcb = getProcessControlBlock(mem, i);
        if (pcb !== null) blocks.push(pcb);
    }
    return blocks;
}

/** Builds a list of page tables keyed by process id for active processes. */
export function getAllPageTables(memory: number[]): {processID: number, pageTable: PageTable}[] {
    const processControlBlocks = getProcessControlBlocks(memory);
    return processControlBlocks.map(pcb => ({
        processID: pcb.processID,
        pageTable: getPageTable(memory, pcb.processID)
    }));
}


/** Returns a physical-page-centric view showing owner process and mapped VPN. */
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


/** Decodes and returns the page table entries for a specific process id. */
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


/** Returns ordered virtual pages for a process with their backing physical bytes. */
export function getProcessVirtualAddressSpace(memory: number[], processID: number): VirtualPage[] {
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

/** Returns the raw bytes for a physical page frame number. */
export function getPage(memory: number[], pfn: number): number[] {
    return memory.slice(pfn * 8, pfn * 8 + 8);
}


/** Returns virtual address-space views for all currently valid processes. */
export function getAllProcessVirtualMemory(memory: number[]): VirtualPage[][] {
    const processControlBlocks = getProcessControlBlocks(memory);
    return processControlBlocks.map(pcb => getProcessVirtualAddressSpace(memory, pcb.processID));
}

/** Maps virtual address to physical frame number for a process. */
export function getPfnFromVirtualAddress(memory: number[], processID: number, virtualAddress: number): number {
    const pageTable = getPageTable(memory, processID);
    const vpn = Math.floor(virtualAddress / 8);
    return pageTable[vpn].pfn;
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

    const pfn = getPfnFromVirtualAddress(memory, processID, virtualAddress);
    const offset = virtualAddress % 8;
    const physicalAddress = pfn * 8 + offset;
    
    return memory[physicalAddress];
  }

/** Splits an instruction byte into opcode name and operand value. */
export function decodeInstruction(instruction: number): { opcode: string, operand: number } {
    const opcode = (instruction & 0b11100000) >> 5;
    const operand = instruction & 0b00011111;
    return { opcode: OPCODE_NAMES[opcode], operand: operand};
}

/** Computes physical address from virtual address for a specific process. */
export function getPhysicalAddressFromVirtualAddress(virtualAddress: number, memory: number[], processID: number): number {
    const pfn = getPfnFromVirtualAddress(memory, processID, virtualAddress);
    const offset = virtualAddress % 8;
    const physicalAddress = pfn * 8 + offset;
    return physicalAddress;
}


/** Maps a process id to its configured UI color classes. */
export function getProcessColorClasses(pid: number | null) {
    if (pid === null) return null;
    return PROCESS_COLOR_CLASSES[pid];
}


/** Writes a new operand value at the instruction's virtual address. */
export function changeOperandOfInstruction(
    memory: number[], 
    operand: number, 
    virtualAddress: number, 
    processID: number): number[] {

    const newMemory = [...memory];
    const newPhysicalAddress = getPhysicalAddressFromVirtualAddress(virtualAddress, memory, processID);

    newMemory[newPhysicalAddress] = operand;

    return newMemory;
}

