import { createContext } from "react";
import { compactPagetables, setActivePageTablesBases, setFreeList, writePageTable, writeProcessPages } from "./writers";
import { getActivePageTablesBases, getFreeList, getPageTable } from "./selectors";
import type { CurRunningPIDContextType, MemoryAction } from "./types";

export const curRunningPIDContext = createContext<CurRunningPIDContextType | null>(null);

export const FREE_LIST_ADDRESS = 15; // address where free list byte is stored
export const MAX_PROCESSES = 3;
export const MAX_PAGES_ALLOCATABLE = 6; // maximum space for page tables in bytes
export const START_OF_PROCESS_MEMORY = 16; // address where process memory starts
export const START_OF_PAGE_TABLES = 8; // address where process memory starts



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
                const freeList = getFreeList(memory);

                if (freeList.length < action.payload.numPages) {
                    console.log(`Cannot allocate ${action.payload.numPages} pages. Only ${freeList.length} free.`)
                    return memory;
                    // throw new Error(`Cannot allocate ${action.payload.numPages} pages. Only ${freeList.length} free.`);
                }

                // Inline: select random free pages
                const shuffled = [...freeList];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
                }
                const newAllocatedPagesPFN = shuffled.slice(0, action.payload.numPages);
                console.log("AllocatedPagesPFN: ", newAllocatedPagesPFN);
                
                // Inline: determine new process ID
                let newProcessID: number | undefined;

                const activePageTablesBases = getActivePageTablesBases(memory);

                for (let i = 0; i <= activePageTablesBases.length; i += 1) {
                    if (activePageTablesBases.length === 0) {
                        newProcessID = i;
                        break;
                    }
                    if (activePageTablesBases.some(entry => entry.processID === i) === false) {
                        newProcessID = i;
                        break;
                    }
                }
                if (newProcessID === undefined) {
                    throw new Error("createProcessID(): Available ID somehow not found.");
                }

                // Inline: find base of free space for page table
                let newPageTableBase: number | null = null;
                const tables = activePageTablesBases
                    .map(e => ({
                        start: e.pageTableBase,
                        end: e.pageTableBase + e.numPages,
                    }))
                    .sort((a, b) => a.start - b.start);
                
                let cursor = START_OF_PAGE_TABLES;
                for (const t of tables) {
                    if (cursor + action.payload.numPages <= t.start) {
                        newPageTableBase = cursor;
                        break;
                    }
                    cursor = t.end;
                }

                if (newPageTableBase === null && cursor + action.payload.numPages <= (START_OF_PAGE_TABLES + MAX_PAGES_ALLOCATABLE)) {
                    newPageTableBase = cursor;
                }

                // no space found, compact page tables and try again. guaranteed to work because 
                // we checked whether there were enough free pages earlier
                let newMemory: number[] = [...memory];
                if (newPageTableBase === null) {
                    const result = compactPagetables(newMemory);
                    cursor = result.cursor;
                    newMemory = result.newMemory;
                }

                if (action.payload.numPages !== 2 && action.payload.numPages !== 4) {
                    throw new Error(`numPages must be either 2 or 4. Received ${action.payload.numPages}`);
                }

                if (newPageTableBase === null) {
                    throw new Error("newPagetablebase is null GET OVER HERE PRONTO");
                }

                newMemory = setActivePageTablesBases([
                    ...activePageTablesBases,
                    {
                        processID: newProcessID,
                        pageTableBase: newPageTableBase, 
                        numPages: action.payload.numPages,
                        valid: true
                    }
                ], newMemory);

                newMemory = writePageTable(newAllocatedPagesPFN, newPageTableBase, newMemory);

                const remainingFreePages = freeList.filter(page => !newAllocatedPagesPFN.includes(page));
                newMemory = setFreeList(remainingFreePages, newMemory);

                newMemory = writeProcessPages(newAllocatedPagesPFN, newMemory);
                return newMemory;
            })();

        case "DELETE_PROCESS":
            return (() => {

                const activePageTablesBases = getActivePageTablesBases(memory);

                const pageTableEntry = activePageTablesBases.find(entry => entry.processID === action.payload.processID);
            
                if (!pageTableEntry) {
                    throw new Error(`Process ID ${action.payload.processID} not found in active page table bases.`);
                }

                let newMemory = [...memory];

                newMemory = setActivePageTablesBases(
                    [...activePageTablesBases].filter(entry => entry.processID !== action.payload.processID),
                    newMemory
                );

                // free up allocated pages
                const pageTable = getPageTable(memory, action.payload.processID);
                const newlyFreedPages = pageTable
                    .filter(pte => pte.valid)
                    .map(pte => pte.pfn);

                const freeList = getFreeList(memory);

                // combination of old free list 
                newMemory = setFreeList([...freeList, ...newlyFreedPages], newMemory);

                return newMemory;
            })();
        default:
            return memory;
    }
}