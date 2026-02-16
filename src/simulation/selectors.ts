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
} from "./constants";
import type { PageTablesBases, Pages, PageTable, VirtualPage, ProcessControlBlock, ProcessControlBlocks } from "./types";

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

export function getActivePageTablesBases(mem: number[]): PageTablesBases {
    const pcbs = getProcessControlBlocks(mem);
    return pcbs.map(pcb => ({
        processID: pcb.processID,
        pageTableBase: pcb.pageTableBase,
        numPages: 2 as const,
        valid: true,
    }));
}


export function getAllPageTables(memory: number[]): {processID: number, pageTable: PageTable}[] {

    const activePageTablesBases = getActivePageTablesBases(memory);
    
    const allPageTables = activePageTablesBases.map(entry => {
        return {
            processID: entry.processID,
            pageTable: getPageTable(memory, entry.processID)
        }
    });
    return allPageTables;
}


export function getAllProcessPages(memory: number[]): Pages {

    const pages: Pages = [];
    for (let pageFrameNumber = 2; pageFrameNumber < 8; pageFrameNumber++) {

        const activePageTablesBases = getActivePageTablesBases(memory);
        
        const ownerPid = activePageTablesBases.find(entry => {
                const pageTable = getPageTable(memory, entry.processID);
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
    const activePageTablesBases = getActivePageTablesBases(memory);

    // console.log("activePageTablesBases: ", activePageTablesBases);


    const pageTableEntry = activePageTablesBases.find(entry => entry.processID === processID);


    if (pageTableEntry === undefined) {
        throw new Error(`Process ID ${processID} not found in active page table bases.`);
    }

    const pageTableBase = pageTableEntry.pageTableBase;
    const numPages = pageTableEntry.numPages;
    const baseAddr = START_OF_PAGE_TABLES + pageTableBase;
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

    console.log("virtualAddressSpace: ", virtualAddressSpace)

    return virtualAddressSpace;
}

export function getPage(memory: number[], pfn: number): number[] {
    return memory.slice(pfn * 8, pfn * 8 + 8);
}