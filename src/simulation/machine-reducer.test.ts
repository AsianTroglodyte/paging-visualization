import {describe, expect, test} from 'vitest';
import { machineReducer } from "./machine-reducer";
import {type MachineState, type MachineAction,  IDLE_CPU_STATE, NO_ERROR} from "./types";
// type MachineAction, 
import { FREE_LIST_ADDRESS} from './constants';



describe('Context Switch', () => {
    const initialMemory = new Array(64).fill(0);
    initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

    const initialState: MachineState = {
        memory: initialMemory,
        cpu: IDLE_CPU_STATE,
        mmu: { kind: "idle" },
        error: NO_ERROR,
    };

    // console.log(initialState);
    // type: "CONTEXT_SWITCH";
    // payload: { processID: number | null };
    let action: MachineAction = {
        type: "CONTEXT_SWITCH",
        payload: { processID: null },
    };

    test('', () => {
        // from null processID to null
        // machineReducer(initialState, action)
        expect(initialState).toEqual({...initialState, cpu: IDLE_CPU_STATE});
        // from non-null cpuState to null
        const nonNullProcessID: MachineState  = {...initialState, cpu: {
            kind: "running",
            runningPid: 1,
            programCounter: 0,
            pageTableBase: 0,
            accumulator: 0,
            currentInstructionRaw: 0,
          }};
        expect(machineReducer(nonNullProcessID, action)).toEqual({...initialState, cpu: IDLE_CPU_STATE});
    });

    action = {
        type: "CONTEXT_SWITCH",
        payload: { processID: null },
    };

    test('Math.sqrt works for perfect squares', () => {
        expect(Math.sqrt(4)).toBe(2);
        expect(Math.sqrt(9)).toBe(3);
    });
})