import { compactPagetables, setProcessControlBlocks, setFreeList, writePageTable, writeProcessPages } from "./writers";
import { getProcessControlBlocks, getProcessControlBlock, getFreeList, getPageTable } from "./selectors";
import { START_OF_PAGE_TABLES, MAX_PAGES_ALLOCATABLE, FREE_LIST_ADDRESS } from "./constants";
import type { MemoryAction, MachineState, CpuState } from "./types";
import { IDLE_CPU_STATE } from "./types";

function createInitialMachineState(): MachineState {
    const initialMemory = new Array(64).fill(0);
    initialMemory[FREE_LIST_ADDRESS] = 0b11111100;
    return {
        memory: initialMemory,
        cpu: IDLE_CPU_STATE,
    };
}

export function getInitialMachineState(): MachineState {
    return createInitialMachineState();
}

export function machineReducer(state: MachineState, action: MemoryAction): MachineState {
    const memory = state.memory;
    const cpu = state.cpu;

    switch (action.type) {
        case "COMPACT_PAGE_TABLES":
            return { ...state, memory: compactPagetables(memory).newMemory };

        case "CONTEXT_SWITCH":
            if (action.payload.processID === null) {
                return { ...state, cpu: IDLE_CPU_STATE };
            }
            const pcb = getProcessControlBlock(memory, action.payload.processID);
            if (!pcb) {
                return { ...state, cpu: IDLE_CPU_STATE };
            }
            const newCpu: CpuState = {
                runningPid: action.payload.processID,
                programCounter: pcb.programCounter,
                pageTableBase: pcb.pageTableBase,
                accumulator: pcb.accumulator,
                currentInstructionRaw: 0, // TODO: load from memory at PC
            };
            return { ...state, cpu: newCpu };

        case "CREATE_PROCESS_RANDOM":
            return (() => {
                const numPages = 2; // always 2 with PCB architecture
                const freeList = getFreeList(memory);

                if (freeList.length < numPages) {
                    console.log(`Cannot allocate ${numPages} pages. Only ${freeList.length} free.`)
                    return state;
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
                return { ...state, memory: newMemory };
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

                const newCpu = cpu.runningPid === action.payload.processID ? IDLE_CPU_STATE : cpu;
                return { memory: newMemory, cpu: newCpu };
            })();
        default:
            return state;
    }
}