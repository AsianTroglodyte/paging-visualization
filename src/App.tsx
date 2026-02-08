import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useState, createContext, useReducer} from "react";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";


type ActivePageTablesBases = {
    processID: number,
    pageTableBase:  number, // 4 most significant bits contain page table base
    // technically numpages would more accurately be 2 | 4, but this is easier to work with
    numPages: 2 | 4, // 3 bits for num pages, but we only use 2 values so it's easier to just have it as a union type
    valid: boolean,
}[]


type PageTableEntry = {
    pfn: number,
    valid: boolean,
    present: boolean,
    referenced: boolean,
    dirty: boolean,
    writable: boolean
}

type PageTable = PageTableEntry[];

type Page = {
    pfn: number,
    ownerPid: number | null,
    vpn: number | null,
    isFree: boolean,
    bytes: number[],
}

type Pages = Page[];


type CurRunningPIDContextType = {
  curRunningPID: number | null;
  setCurRunningPID: (pid: number | null) => void;
};

export const curRunningPIDContext = createContext<CurRunningPIDContextType | null>(null);

const FREE_LIST_ADDRESS = 15; // address where free list byte is stored
const MAX_PROCESSES = 3;
const MAX_PAGES_ALLOCATABLE = 6; // maximum space for page tables in bytes
const START_OF_PROCESS_MEMORY = 15; // address where process memory starts
const START_OF_PAGE_TABLES = 8; // address where process memory starts

type MemoryAction =
  | {
      type: "COMPACT_PAGE_TABLES";
      payload?: never;
    }
  | {
      type: "CREATE_PROCESS_RANDOM";
      payload: { numPages: 2 | 4 };
    }
  | {
      type: "DELETE_PROCESS";
      payload: { processID: number };
    };

function memoryReducer(memory: number[], action: MemoryAction) {
    switch (action.type) {
        case "COMPACT_PAGE_TABLES":
            return compactPagetables(memory).newMemory;

        case "CREATE_PROCESS_RANDOM":
            return (() => {
                const freeList = getFreeList(memory);

                if (freeList.length < action.payload.numPages) {
                    throw new Error(`Cannot allocate ${action.payload.numPages} pages. Only ${freeList.length} free.`);
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

function getFreeList(mem: number[]): number[] {
    const bitmap = mem[FREE_LIST_ADDRESS];
    const numPages = 8;
    const free: number[] = [];

    for (let page = 0; page < numPages; page++) {
        if ((bitmap & (1 << page)) !== 0) {
            free.push(page);
        }
    }

    return free;
}

function getActivePageTablesBases(mem: number[]): ActivePageTablesBases {
    const active: ActivePageTablesBases = [];

    
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

function getAllPageTables(memory: number[]): {processID: number, pageTable: PageTable}[] {

    const activePageTablesBases = getActivePageTablesBases(memory);
    
    const allPageTables = activePageTablesBases.map(entry => {
        return {
            processID: entry.processID,
            pageTable: getPageTable(memory, entry.processID)
        }
    });
    return allPageTables;
}

function getAllProcessPages(memory: number[]): Pages {

    const pages: Pages = [];
    for (let pageFrameNumber = 2; pageFrameNumber < 8; pageFrameNumber++) {

        const activePageTablesBases = getActivePageTablesBases(memory);
        
        const ownerPid = activePageTablesBases.find(entry => {
                const pageTable = getPageTable(memory, entry.processID);
                return pageTable.some(pte => pte.pfn === pageFrameNumber);
            })?.processID ?? null;
    
        const vpn = ownerPid !== null ? getPageTable(memory, ownerPid).findIndex(pte => pte.pfn === pageFrameNumber) : null;
        
        const bytes = memory.slice(START_OF_PROCESS_MEMORY + pageFrameNumber * 8, START_OF_PROCESS_MEMORY + (pageFrameNumber + 1) * 8);

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

// Everything below are regular functions that operate on the memory byte array 
// this also includes functions that generate some specialized views such as getPageTable that 
// don't fit the views  above

function writeProcessPages(newAllocatedPages: number[], memory: number[]): number[] {
    // const allAllocatedPages = [...freeList, ...allocatedPages];
    const newMemory = [...memory];

    for (let pageFrameNumber = 2; pageFrameNumber < 8; pageFrameNumber++) {
        if (newAllocatedPages.includes(pageFrameNumber)) {
            // write some dummy data to allocated pages
            for (let i = 0; i < 8; i++) {
                newMemory[pageFrameNumber * 8 + i] = Math.floor(Math.random() * 256);
            }
        }
    }

    return newMemory
}

function setActivePageTablesBases(activePageTablesBases: ActivePageTablesBases, memory: number[]): number[] {

    if (activePageTablesBases.some(entry => entry.numPages !== 2 && entry.numPages !== 4)) {
        throw new Error(`number of pages for processes' must be either2 or 4.`);
    }

    const newMemory: number[] = [...memory];
    
    // Set all possible process entries
    for (let i = 0; i < MAX_PROCESSES; i++) {
        const entry = activePageTablesBases.find(e => e.processID === i);
        
        if (entry) {
            // Process exists in new list - write valid entry
            newMemory[i] = (entry.pageTableBase << 4) | (entry.numPages << 1) | 0b00000001; // set valid bit
        } else {
            // Process doesn't exist - mark as invalid by clearing the valid bit
            newMemory[i] = 0b00000000;
        }
    }
    
    return newMemory;

}

function getPageTable(memory: number[], processID: number): PageTable {
    const activePageTablesBases = getActivePageTablesBases(memory);

    const pageTableEntry = activePageTablesBases.find(entry => entry.processID === processID);
    if (!pageTableEntry) {
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

function setFreeList(newFreePages: number[], memory: number[]): number[] {
    const bitmap = newFreePages.reduce(
        (accumulator, pageFrameNumber) => accumulator | (1 << pageFrameNumber),
        0
    );

    const newMemory: number[] = [...memory];

    newMemory[FREE_LIST_ADDRESS] = bitmap;
    return newMemory;
}


function writePageTable(AllocatedPagesPFN: number[], pageTableBase: number, memory: number[]): number[] {
    const newMemory: number[] = [...memory];
    AllocatedPagesPFN.forEach((_, index) => {
        // create page table entry
        // PFN (3 bit) | valid (1 bit) | Present (1 bit) | Referenced (1 bit) | Dirty (1 bit) | Writable (1 bit) 
            // valid = 1; present = 1; referenced = 0; dirty = 0; writable = random 0/1;

            // I want to make sure that there is always at least one unwritable page
            let writable = 0;
            const activePageTablesBases = getActivePageTablesBases(memory);
            if (activePageTablesBases.length > 0) writable = Math.random() < 0.8 ? 1 : 0;

            const pageTableEntry = (AllocatedPagesPFN[index] << 5) | 0b00011001 | (writable); // set valid bit and writable bit
            newMemory[pageTableBase + index] = pageTableEntry;
        })
    return newMemory;
}

function compactPagetables(memory: number[]) : {newMemory: number[], cursor: number} {
    const activePageTablesBases = getActivePageTablesBases(memory);
    
    const sortedActivePageTablesBases = [...activePageTablesBases].sort((a, b) => a.pageTableBase - b.pageTableBase);

    let cursor = START_OF_PAGE_TABLES;
    const moveOperations: Array<{oldBase: number, newBase: number, numPages: number}> = [];
    const compactedEntries: ActivePageTablesBases = [];

    // Plan the compaction without mutating
    for (const entry of sortedActivePageTablesBases) {
        moveOperations.push({
            oldBase: entry.pageTableBase,
            newBase: cursor,
            numPages: entry.numPages
        });
        compactedEntries.push({
            ...entry,
            pageTableBase: cursor
        });
        cursor += entry.numPages;
    }

    // Update memory with the planned moves

    let newMemory = [...memory];
    
    for (const op of moveOperations) {
        for (let i = 0; i < op.numPages; i++) {
            newMemory[op.newBase + i] = memory[op.oldBase + i];
        }
    }

    newMemory = setActivePageTablesBases(compactedEntries, newMemory);

    return {cursor, newMemory};
}

export function App() {
    // grid grid-cols-3 grid-rows-2 
    // the memory byte array contains 4 crucial pieces of data:
    //  - page table base list - list of bytes, each byte is an entry mapping a process to the 
    //    base address of their corresponding page table.
    //  - free list - a single byte containing info on which pages are free
    //  - page tables - maps the VPNs to the PFNs along with showing control bits. 
    //  - process memory - the memory used by processes. 
    // Yes, I could have seperated these into multiple useStates, and that would have probably been an
    // easier more maintainable approach, but simulating a proper single piece of memory seemed more fun
    // and a bit more extensible

    const [curRunningPID, setCurRunningPID] = useState<number | null>(null);



    const [memory, memoryDispatch] = useReducer(
        memoryReducer,
        null,
        () => {
            const initialMemory = new Array(64).fill(0);

            initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

            return initialMemory;
        }
    );


    // derived memory view used for more convenient parsing of data and for the UI view
    const freeList = useMemo(() => {
        return getFreeList(memory);
    }, [memory]);

    const activePageTablesBases = useMemo(() => {
        return getActivePageTablesBases(memory);
    }, [memory]);

    const allPageTables = useMemo(() => {
        return getAllPageTables(memory);
    }, [memory]);

    const allProcessPages = useMemo(() => {
        // console.log("current allProcessPages:", allProcessPages);
        return getAllProcessPages(memory);
    }, [memory]);





    return (
    <curRunningPIDContext.Provider value={{curRunningPID, setCurRunningPID}}>
        <SidebarProvider>
            <AppSidebar 
                memoryDispatch={memoryDispatch}
                activePageTablesBases={activePageTablesBases}
            />
            <SidebarTrigger className="" size="lg" />

            <div className="py-10  pl-1 w-full h-full 
            flex flex-3 flex items-start gap-4">

                <CpuCard></CpuCard>
                <MmuCard></MmuCard>
                <MemoryCard className="row-span-2" 
                activePageTablesBases={activePageTablesBases} 
                allProcessPages={allProcessPages} 
                getPageTable={getPageTable}
                memory={memory}></MemoryCard>
            </div>
        </SidebarProvider>
    </curRunningPIDContext.Provider>
    )
}

export default App;