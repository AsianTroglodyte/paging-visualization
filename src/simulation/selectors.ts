// The functions below provide convenient views into the memory data structure. 
// it takes in the memory bitmap array and (usually) returns a nice object to work with.
// this is used to more easily build writers, parts of our reducer, other selectors/
// and is used to build data structures that more cleanly to our UI. Think of them as
// essentially the building blocks of advanced queries or views into our memory


import { FREE_LIST_ADDRESS, MAX_PROCESSES} from "./machine-reducer";
import type { PageTablesBases, Pages, PageTable, VirtualPage } from "./types";

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

export function getActivePageTablesBases(mem: number[]): PageTablesBases {
    const active: PageTablesBases = [];

    
    for (let i = 0; i < MAX_PROCESSES; i++) {
        const entry = mem[i];
        if ((entry & 0b00000001) === 1) { // check valid bit

            // check if numPages is valid (either 2 or 4). this is a sanity check to make sure that the memory isn't corrupted, since if numPages is invalid, it could cause out of bounds errors when trying to read page tables
            const numPages = (entry >> 1) & 0b00000111; // extract numPages (3 bits)
            if (numPages !== 2 && numPages !== 4) {
                throw new Error(`Invalid numPages value ${numPages} for process ${i}. Must be 2 or 4.`);
            }

            active.push({
                processID: i,
                pageTableBase: (entry >> 4),
                numPages: numPages,
                valid: true
            });
        }
    }
    return active;
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
    return memory.slice(pageTableBase, pageTableBase + numPages).map(
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