import { createContext } from "react";
import { compactPagetables, setProcessControlBlocks, setFreeList, writePageTable, writeProcessPages } from "./writers";
import { getProcessControlBlocks, getActivePageTablesBases, getFreeList, getPageTable } from "./selectors";
import { START_OF_PAGE_TABLES, MAX_PAGES_ALLOCATABLE } from "./constants";
import type { CurRunningPIDContextType, MemoryAction } from "./types";

export const curRunningPIDContext = createContext<CurRunningPIDContextType | null>(null);

// Re-export for App.tsx
export { FREE_LIST_ADDRESS } from "./constants";



// the memory byte array contains 4 crucial pieces of data:
//  - page table base list - list of bytes, each byte is an entry mapping a process to the 
//    base address of their corresponding page table.
//  - free list - a single byte containing info on which pages are free
//  - page tables - maps the VPNs to the PFNs along with showing control bits. 
//  - process memory - the memory used by processes. 

export function machineReducer(memory: number[], action: MemoryAction) {
    switch (action.type) {
        case "COMPACT_PAGE_TABLES":
            return compactPagetables(memory).newMemory;

        case "CREATE_PROCESS_RANDOM":
            return (() => {
                const numPages = 2; // always 2 with PCB architecture
                const freeList = getFreeList(memory);

                if (freeList.length < numPages) {
                    console.log(`Cannot allocate ${numPages} pages. Only ${freeList.length} free.`)
                    return memory;
                }

                // Inline: select random free pages
                const shuffled = [...freeList];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
                }
                const newAllocatedPagesPFN = shuffled.slice(0, numPages);
                
                const existingPCBs = getProcessControlBlocks(memory);
                let newProcessID: number | undefined;
                for (let i = 0; i < 4; i++) { // 4 PCB slots (addresses 8,10,12,14) but only 3 can be active
                    if (!existingPCBs.some(pcb => pcb.processID === i)) {
                        newProcessID = i;
                        break;
                    }
                }
                if (newProcessID === undefined) {
                    throw new Error("No available process ID.");
                }

                // Find free slot for page table (offset 0-6, step 2)
                let newPageTableBase: number | null = null;
                const tables = existingPCBs
                    .map(p => ({ start: p.pageTableBase, end: p.pageTableBase + 2 }))
                    .sort((a, b) => a.start - b.start);
                
                let cursor = 0;
                for (const t of tables) {
                    if (cursor + numPages <= t.start) {
                        newPageTableBase = cursor;
                        break;
                    }
                    cursor = t.end;
                }
                if (newPageTableBase === null && cursor + numPages <= MAX_PAGES_ALLOCATABLE) {
                    newPageTableBase = cursor;
                }

                let newMemory: number[] = [...memory];
                if (newPageTableBase === null) {
                    const result = compactPagetables(newMemory);
                    newMemory = result.newMemory;
                    newPageTableBase = result.cursor;
                }

                const newPCB = {
                    processID: newProcessID,
                    pageTableBase: newPageTableBase,
                    programCounter: 0,
                    validBit: 1,
                    accumulator: 0,
                };

                newMemory = setProcessControlBlocks([...existingPCBs, newPCB], newMemory);
                newMemory = writePageTable(newAllocatedPagesPFN, newPageTableBase, newMemory);

                const remainingFreePages = freeList.filter(page => !newAllocatedPagesPFN.includes(page));
                newMemory = setFreeList(remainingFreePages, newMemory);
                newMemory = writeProcessPages(newAllocatedPagesPFN, newMemory);
                return newMemory;
            })();

        case "DELETE_PROCESS":
            return (() => {
                const processControlBlocks = getProcessControlBlocks(memory);
                const pcbToDelete = processControlBlocks.find(pcb => pcb.processID === action.payload.processID);
            
                if (!pcbToDelete) {
                    throw new Error(`Process ID ${action.payload.processID} not found.`);
                }

                const remainingPCBs = processControlBlocks.filter(pcb => pcb.processID !== action.payload.processID);
                let newMemory = setProcessControlBlocks(remainingPCBs, [...memory]);

                const pageTable = getPageTable(memory, action.payload.processID);
                const newlyFreedPages = pageTable
                    .filter(pte => pte.valid)
                    .map(pte => pte.pfn);

                const freeList = getFreeList(memory);
                newMemory = setFreeList([...freeList, ...newlyFreedPages], newMemory);

                return newMemory;
            })();
        default:
            return memory;
    }
}