import {describe, expect, test} from 'vitest';
import { machineReducer } from "./machine-reducer";
import {type MachineState, type MachineAction,  IDLE_CPU_STATE, NO_ERROR} from "./types";
// type MachineAction, 
import { FREE_LIST_ADDRESS} from './constants';
import { makeMachineWithProcess } from './test-helpers';
import { getPage, getPageTable, getProcessControlBlock, getProcessControlBlocks, getRawFreeList } from './selectors';
import { PteHoverContent } from '@/components/hover-content';
import { SAMPLE_PROGRAM } from './isa';

// 0, 32, 64,  96, 128, 160, 192, 224,
// 0,   1, 2, 3, 4,  5,  6,   7, 
describe("Create process random", () => {
    const initialMemory = new Array(64).fill(0);
    initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

    const initialState: MachineState = {
        memory: initialMemory,
        cpu: IDLE_CPU_STATE,
        mmu: { kind: "idle" },
        error: NO_ERROR,
    };

    test('', () => {
        const action: MachineAction = {
            type: "CREATE_PROCESS_RANDOM",
            payload: { numPages: 2},
        };
        
        const machineState = machineReducer(initialState, action);
        const memory = machineState.memory;
        
        // work on PCBs
        const pcbs = getProcessControlBlocks(machineState.memory);
        expect(pcbs.length).toBe(1);

        const pcb = getProcessControlBlock(machineState.memory, pcbs[0].processID);
        expect(pcb).toMatchObject({
            processID: 0,
            pageTableBase: expect.any(Number),
            programCounter: 0,
            validBit: 1,
            accumulator: 0
        });

        expect(pcb?.pageTableBase).toBeGreaterThanOrEqual(0);
        expect(pcb?.pageTableBase).toBeLessThanOrEqual(7);

        const pageTable = getPageTable(memory, pcbs[0].processID);
        expect(pageTable.length).toBe(2);        


        // freeList
        const freeList = getRawFreeList(memory);
        // two pages should be taken
        expect(freeList.length).toBe(4); 
        // make sure that the pfns don't include the taken ones
        expect(freeList.every((pfn) =>
            pfn !== pageTable[0].pfn && pfn !== pageTable[1].pfn)).toBe(true);
        // page frames for process pages are always >= 2
        expect(freeList.every((pfn) => pfn >= 2)).toBe(true);


        // page table entries
        pageTable.forEach((pte) => {
            expect(pte.valid).toBe(true);
            expect(pte.present).toBe(true);
            expect(pte.referenced).toBe(false);
            expect(pte.dirty).toBe(false);
            expect(pte.pfn).toBeGreaterThanOrEqual(2);
            expect(pte.pfn).toBeLessThanOrEqual(7);
        });
        // VPN 0 and 1 map to distinct frames
        expect(pageTable[0].pfn).not.toBe(pageTable[1].pfn);

        const pages = pageTable.map((row) => getPage(memory, row.pfn));

        expect(pages[0]).toEqual([
            ...SAMPLE_PROGRAM
        ]);
        expect(pages[1]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
});

describe("Delete process", () => {
    const initialMemory = new Array(64).fill(0);
    initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

    const initialState: MachineState = {
        memory: initialMemory,
        cpu: IDLE_CPU_STATE,
        mmu: { kind: "idle" },
        error: NO_ERROR,
    };

    test('Successfully deletes a process', () => {
        const stateWith1Process = makeMachineWithProcess(initialState);
        const prevFreeList = getRawFreeList(stateWith1Process.memory);
        const prevPagetable = getPageTable(stateWith1Process.memory, 0);        

        const action: MachineAction = {
            type: "DELETE_PROCESS",
            payload: { processID: 0 },
        };

        const newMachineState = machineReducer(stateWith1Process, action);
        const newMemory = newMachineState.memory;
        const newFreeList = getRawFreeList(newMemory);


        const allocated = new Set(prevPagetable.map(page => page.pfn));

        // the only things that really change are the PCB and the freeList everything 
        // else is left as-is to be overwritten later
        expect(getProcessControlBlock(newMachineState.memory, 0)).toBeNull();

        expect(newFreeList).toEqual(expect.arrayContaining([...allocated]));
        expect(prevFreeList.length).toEqual(4);
        expect(newFreeList.length).toEqual(6);
    });
});

describe("Fetch instruction", () => {
    const initialMemory = new Array(64).fill(0);
    initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

    const initialState: MachineState = {
        memory: initialMemory,
        cpu: IDLE_CPU_STATE,
        mmu: { kind: "idle" },
        error: NO_ERROR,
    };

    test('Fetch when no CPU idle', () => {
        const action: MachineAction = {
            type: "FETCH_INSTRUCTION",
            payload: {newProgramCounter: 4}
        }
        const newState = machineReducer(initialState, action);
        expect(initialState).toEqual(newState);
    });
});

describe('Context Switch', () => {
    const initialMemory = new Array(64).fill(0);
    initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

    const initialState: MachineState = {
        memory: initialMemory,
        cpu: IDLE_CPU_STATE,
        mmu: { kind: "idle" },
        error: NO_ERROR,
    };

    test('Context switch to no process.', () => {
        const action: MachineAction = {
            type: "CONTEXT_SWITCH",
            payload: { processID: null },
        };
        // from null processID to null
        expect(machineReducer(initialState, action))
            .toEqual({...initialState, cpu: IDLE_CPU_STATE});
        // from non-null cpuState to null
        const nonNullProcessID: MachineState  = {...initialState, cpu: {
            kind: "running",
            runningPid: 1,
            programCounter: 0,
            pageTableBase: 0,
            accumulator: 0,
            currentInstructionRaw: 0,
          }};
        expect(machineReducer(nonNullProcessID, action))
            .toEqual({...initialState, cpu: IDLE_CPU_STATE});
    });
    
    test('Context switch to non-existent process', () => {
        const action: MachineAction = {
            type: "CONTEXT_SWITCH",
            payload: { processID: 0},
        };
        expect(machineReducer({...initialState, }, action))
            .toEqual({...initialState, cpu: IDLE_CPU_STATE});
    });

    test('Context switch to existing process', () => {
        const stateWith1Process: MachineState = makeMachineWithProcess(initialState);
        // console.log(stateWith1Process);
        const action: MachineAction = {
            type: "CONTEXT_SWITCH",
            payload: { processID: 0},
        };  

        expect(machineReducer({...stateWith1Process, }, action))
            .toEqual({...stateWith1Process, cpu: {
                kind: "running",
                runningPid: 0,
                programCounter: 0,
                pageTableBase: 0,
                accumulator: 0,
                currentInstructionRaw: 0
        }});
    });

    test('Context switch between processes', () => {
        const stateWith2Process: MachineState = 
            makeMachineWithProcess(makeMachineWithProcess(initialState));

        const action1: MachineAction = {
            type: "CONTEXT_SWITCH",
            payload: { processID: 0},
        };

        const stateSwitchedToProcess0 = machineReducer({...stateWith2Process}, action1);
        expect(stateSwitchedToProcess0)
            .toEqual({...stateWith2Process, cpu: {
                kind: "running",
                runningPid: 0,
                programCounter: 0,
                pageTableBase: 0,
                accumulator: 0,
                currentInstructionRaw: 0
        }});

        const action2: MachineAction = {
            type: "CONTEXT_SWITCH",
            payload: { processID: 1},
        };

        const stateSwitchedToProcess1 = machineReducer({...stateWith2Process}, action2);

        expect(stateSwitchedToProcess1)
            .toEqual({...stateWith2Process, cpu: {
                kind: "running",
                runningPid: 1,
                programCounter: 0,
                pageTableBase: 2,
                accumulator: 0,
                currentInstructionRaw: 0
        }});
    });
})