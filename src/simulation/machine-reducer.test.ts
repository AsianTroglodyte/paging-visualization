import {describe, expect, test} from 'vitest';
import { machineReducer } from "./machine-reducer";
import {type MachineState, type MachineAction,  IDLE_CPU_STATE, NO_ERROR} from "./types";
// type MachineAction, 
import { FREE_LIST_ADDRESS} from './constants';
import { makeMachineWithProcess } from './test-helpers';



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
        const machineStateWith1Process: MachineState = makeMachineWithProcess(initialState);
        const action: MachineAction = {
            type: "CONTEXT_SWITCH",
            payload: { processID: 0},
        };    
        expect(machineReducer({...machineStateWith1Process, }, action))
            .toEqual({...machineStateWith1Process, cpu: {
                kind: "running",
                runningPid: 0,
                programCounter: 0,
                pageTableBase: 0,
                accumulator: 0,
                currentInstructionRaw: 0
        }});
    });
})