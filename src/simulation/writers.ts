/**
 * Writers are pure memory update helpers for the paging simulator.
 * Each function takes the current memory snapshot and returns a new one after
 * applying a specific state transition (free list updates, PCB writes, page
 * table writes, compaction, or byte-level writes at virtual addresses).
 */

import {
    FREE_LIST_ADDRESS,
    MAX_PROCESSES,
    START_OF_PAGE_TABLES,
    BYTES_PER_PAGE_TABLE,
    PAGE_SIZE,
    BYTES_PER_PCB,
    PROGRAM_COUNTER_MAX,
    ACCUMULATOR_MAX,
    PCB_VALID_BIT_CLEAR_MASK,
    WRITABLE_PAGE_PROBABILITY,
    START_OF_PCBS
} from "./constants";
import { getProcessControlBlocks, getPageTable } from "./selectors";
import type {ProcessControlBlocks } from "./types";
import { SAMPLE_PROGRAM } from "./isa";

/** Writes initial instruction/data contents into newly allocated process pages. */
export function writeProcessPages(newAllocatedPages: {pfn: number, vpn: number}[], memory: number[]): number[] {
    const newMemory = [...memory];

    for (const { pfn, vpn } of newAllocatedPages) {
        const baseAddr = pfn * PAGE_SIZE;
        if (vpn === 0) {
            // First page: write 8 ISA instructions
            for (let i = 0; i < PAGE_SIZE && i < SAMPLE_PROGRAM.length; i++) {
                newMemory[baseAddr + i] = SAMPLE_PROGRAM[i];
            }
        } else {
            // Second page: data area (initial values for load/store visualization)
            for (let i = 0; i < PAGE_SIZE; i++) {
                newMemory[baseAddr + i] = i % 16; // 0-15 for visibility
            }
        }
    }

    return newMemory;
}


/** Writes all PCB slots, encoding active PCBs and clearing inactive valid bits. */
export function setProcessControlBlocks(processControlBlocks: ProcessControlBlocks, memory: number[]): number[] {
    const newMemory: number[] = [...memory];    
    // Set all possible process entries
    for (let processID = 0; processID < MAX_PROCESSES; processID++) {

        const processControlBlock = processControlBlocks.find((pcb) => pcb.processID === processID);

        if (processControlBlock !== undefined) {

            // I know, I know I already check if it exists 

            if (processControlBlock.programCounter < 0 || processControlBlock.programCounter > PROGRAM_COUNTER_MAX) {
                throw new Error(`Invalid programCounter value ${processControlBlock.programCounter}. Must be 0-${PROGRAM_COUNTER_MAX} inclusive.`);
            }

            if (processControlBlock.accumulator < 0 || processControlBlock.accumulator > ACCUMULATOR_MAX) {
                throw new Error(`Invalid accumulator value ${processControlBlock.accumulator}. Must be 0-${ACCUMULATOR_MAX} inclusive.`);
            }

            const pcbAddr = START_OF_PCBS + processID * BYTES_PER_PCB;
            newMemory[pcbAddr] = processControlBlock.pageTableBase << 5 
                | processControlBlock.programCounter << 1
                | processControlBlock.validBit;
            newMemory[pcbAddr + 1] = processControlBlock.accumulator;
        }
        else {
            const pcbAddr = START_OF_PCBS + processID * BYTES_PER_PCB;
            newMemory[pcbAddr] = newMemory[pcbAddr] & PCB_VALID_BIT_CLEAR_MASK;
        }


    }
    
    return newMemory;
}


/** Encodes free page frame numbers back into the free-list bitmap byte. */
export function setFreeList(newFreePages: number[], memory: number[]): number[] {
    const bitmap = newFreePages.reduce(
        (accumulator, pageFrameNumber) => accumulator | (1 << pageFrameNumber),
        0
    );

    const newMemory: number[] = [...memory];

    newMemory[FREE_LIST_ADDRESS] = bitmap;
    return newMemory;
}


/** Writes page table entries for allocated VPN->PFN mappings at a table base. */
export function writePageTable(AllocatedPagesPFN: {pfn: number, vpn: number}[], pageTableBase: number, memory: number[]): number[] {
    const newMemory: number[] = [...memory];

    AllocatedPagesPFN.forEach(({pfn, vpn}) => {
        // create page table entry
        // PFN (3 bit) | valid (1 bit) | Present (1 bit) | Referenced (1 bit) | Dirty (1 bit) | Writable (1 bit) 
            // valid = 1; present = 1; referenced = 0; dirty = 0; writable = random 0/1;

            // I want to make sure that there is always at least one unwritable page
            let writable = 0;
            const processControlBlocks = getProcessControlBlocks(memory);
            if (processControlBlocks.length > 0) writable = Math.random() < WRITABLE_PAGE_PROBABILITY ? 1 : 0;

            const pageTableEntry = (pfn << 5) | 0b00011001 | (writable); // set valid bit and writable bit
            newMemory[START_OF_PAGE_TABLES + pageTableBase + vpn] = pageTableEntry;
        })
    return newMemory;
}

/** Compacts active page tables into a contiguous region and rewrites PCB bases. */
export function compactPagetables(memory: number[]) : {newMemory: number[], cursor: number} {
    const processControlBlocks = getProcessControlBlocks(memory);

    const sortedProcessControlBlocks = [...processControlBlocks].sort((a, b) => a.pageTableBase - b.pageTableBase);

    let cursor = START_OF_PAGE_TABLES;
    const tableSize = BYTES_PER_PAGE_TABLE;
    const moveOperations: Array<{oldOffset: number, newOffset: number}> = [];
    const compactedPageTableBases: ProcessControlBlocks = [];

    // Plan the compaction without mutating
    // pageTableBase in PCB is byte offset within page table region
    for (const entry of sortedProcessControlBlocks) {
        const newOffset = cursor - START_OF_PAGE_TABLES;
        moveOperations.push({
            oldOffset: entry.pageTableBase,
            newOffset,
        });
        compactedPageTableBases.push({
            ...entry,
            pageTableBase: newOffset as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
        });
        cursor += tableSize;
    }

    // Update memory with the planned moves
    let newMemory = [...memory];
    
    for (const op of moveOperations) {
        for (let i = 0; i < tableSize; i++) {
            const srcAddr = START_OF_PAGE_TABLES + op.oldOffset + i;
            const dstAddr = START_OF_PAGE_TABLES + op.newOffset + i;
            newMemory[dstAddr] = memory[srcAddr];
        }
    }

    newMemory = setProcessControlBlocks(compactedPageTableBases, newMemory);

    return {cursor, newMemory};
}

/** Writes a byte through virtual addressing for a process and returns new memory. */
export function writeByteAtVirtualAddress(memory: number[], processID: number, virtualAddress: number, value: number): number[] {
    const newMemory = [...memory];
    const pageTable = getPageTable(memory, processID);
    // index of PTE = vpn
    const vpn = Math.floor(virtualAddress / 8);
    const offset = virtualAddress % 8;
    const pfn = pageTable[vpn].pfn; 
    newMemory[pfn * PAGE_SIZE + offset] = value;
    return newMemory;
}
