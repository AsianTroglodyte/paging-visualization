// Everything below are regular functions that modify on the memory byte array.
// To be Precise they take some memory state and then return a modifed copy of the memory state
// based on the previous state and any information provided. 
// this make use of selector functions that generate some specialized views such as getPageTable

import { FREE_LIST_ADDRESS, MAX_PROCESSES, START_OF_PAGE_TABLES } from "./reducer";
import { getActivePageTablesBases } from "./selectors";
import type { PageTablesBases } from "./types";

export function writeProcessPages(newAllocatedPages: number[], memory: number[]): number[] {
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

export function setActivePageTablesBases(activePageTablesBases: PageTablesBases, memory: number[]): number[] {

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


export function setFreeList(newFreePages: number[], memory: number[]): number[] {
    const bitmap = newFreePages.reduce(
        (accumulator, pageFrameNumber) => accumulator | (1 << pageFrameNumber),
        0
    );

    const newMemory: number[] = [...memory];

    newMemory[FREE_LIST_ADDRESS] = bitmap;
    return newMemory;
}


export function writePageTable(AllocatedPagesPFN: number[], pageTableBase: number, memory: number[]): number[] {
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

export function compactPagetables(memory: number[]) : {newMemory: number[], cursor: number} {
    const activePageTablesBases = getActivePageTablesBases(memory);

    const sortedActivePageTablesBases = [...activePageTablesBases].sort((a, b) => a.pageTableBase - b.pageTableBase);

    let cursor = START_OF_PAGE_TABLES;
    const moveOperations: Array<{oldBase: number, newBase: number, numPages: number}> = [];
    const compactedPageTableBases: PageTablesBases = [];

    // Plan the compaction without mutating
    for (const entry of sortedActivePageTablesBases) {
        moveOperations.push({
            oldBase: entry.pageTableBase,
            newBase: cursor,
            numPages: entry.numPages
        });
        compactedPageTableBases.push({
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

    newMemory = setActivePageTablesBases(compactedPageTableBases, newMemory);

    return {cursor, newMemory};
}