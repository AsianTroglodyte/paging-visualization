import { compactPagetables, setProcessControlBlocks, setFreeList, writePageTable, writeProcessPages } from "./writers";
import { getProcessControlBlocks, getProcessControlBlock, getFreeList, getPageTable, getByteAtVirtualAddress } from "./selectors";
import { START_OF_PAGE_TABLES, MAX_PAGES_ALLOCATABLE, FREE_LIST_ADDRESS } from "./constants";
import type { MachineAction, MachineState, CpuState } from "./types";
import { IDLE_CPU_STATE } from "./types";
import { OPCODE_NAMES } from "./isa";

export function machineReducer(state: MachineState, action: MachineAction): MachineState {
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
                kind: "running",
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

                const newAllocatedPagesPFN = shuffled.slice(0, numPages).map((pfn, index) => ({pfn: pfn, vpn: index}));
                
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

                // allocatedPFNs is a Set of numbers rather than an object array
                const allocatedPFNs = new Set(newAllocatedPagesPFN.map(alloc => alloc.pfn));
                const remainingFreePages = freeList.filter(page => !allocatedPFNs.has(page));
                newMemory = setFreeList(remainingFreePages, newMemory);

                // writeProcessPages takes an object array of {pfn, vpn}
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

                const newCpu: CpuState =
                    cpu.kind === "running" && cpu.runningPid === action.payload.processID
                        ? IDLE_CPU_STATE
                        : cpu;
                return { memory: newMemory, cpu: newCpu };
            })();
        case "CHANGE_PROGRAM_COUNTER":
            if (cpu.kind === "idle") {
                return state;
            }
            const newCurrentInstructionRaw = getByteAtVirtualAddress(memory, cpu.runningPid, action.payload.newProgramCounter);

            return { ...state, cpu: { 
                ...cpu, 
                programCounter: action.payload.newProgramCounter,
                currentInstructionRaw: newCurrentInstructionRaw
            }};
        case "EXECUTE_INSTRUCTION":
            if (cpu.kind === "idle") {
                throw new Error("Cannot execute instruction when CPU is idle.");
            }

            action.payload ?? (() => {throw new Error("Opcode is required.");})();

            // opcode is a number between 0 and 7
            if (!(action.payload.opcode >=0 && action.payload.opcode < 8)) {
                throw new Error(`Invalid opcode: ${action.payload.opcode}`);
            }

            // [OPCODE_LB]: "lb",
            // [OPCODE_SB]: "sb",
            // [OPCODE_ADD]: "add",
            // [OPCODE_ADDI]: "addi",
            // [OPCODE_SUB]: "sub",
            // [OPCODE_SUBI]: "subi",
            // [OPCODE_BRANCH]: "branch",
            // [OPCODE_JUMP]: "jump",
            
            
            switch (OPCODE_NAMES[action.payload.opcode]) {
                case "lb":
                    {
                        const newCpu: CpuState = {...cpu};
                        newCpu.accumulator = getByteAtVirtualAddress(memory, cpu.runningPid, action.payload.operand);
                        return { ...state, cpu: newCpu };
                    }
                case "sb":
                    return { ...state, cpu: { ...cpu, accumulator: action.payload.operand } };
                case "add":
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator + action.payload.operand } };
                case "addi":
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator + action.payload.operand } };
                case "sub":
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator - action.payload.operand } };
                case "subi":
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator - action.payload.operand } };
                case "branch":
                    return { ...state, cpu: { ...cpu, programCounter: action.payload.operand } };
                case "jump":
                    return { ...state, cpu: { ...cpu, programCounter: action.payload.operand } };
                default:
                    throw new Error(`Invalid opcode: ${action.payload.opcode}`);
            }
        default:
            return state;
    }
}