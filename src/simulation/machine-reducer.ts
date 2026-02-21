import { 
    compactPagetables, 
    setProcessControlBlocks, 
    setFreeList,
    writePageTable, 
    writeProcessPages, 
    writeByteAtVirtualAddress } from "./writers";
import { 
    getProcessControlBlocks, 
    getProcessControlBlock, 
    getFreeList, 
    getPageTable,
    getByteAtVirtualAddress, 
    getPfnFromVirtualAddress} from "./selectors";
import { MAX_PAGES_ALLOCATABLE, START_OF_PCBS, BYTES_PER_PCB } from "./constants";
import type { MachineAction, MachineState, CpuState, MmuState } from "./types";
import { IDLE_CPU_STATE } from "./types";
import { OPCODE_NAMES } from "./isa";

export function machineReducer(state: MachineState, action: MachineAction): MachineState {
    const memory = state.memory;
    const cpu: CpuState = state.cpu;
    const mmu: MmuState = state.mmu;

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

            // don't need to write to memory is idle. This is because cpu doesn't 
            // have any state to save onto the PCB.
            if (cpu.kind === "idle") {
                return { ...state, cpu: newCpu };
            }

            let newMemory = [...memory];

            const firstPcbByte = (cpu.pageTableBase << 5) + (cpu.programCounter << 1) + 1;
            const secondPcbByte = cpu.accumulator;

            newMemory[START_OF_PCBS + cpu.runningPid * BYTES_PER_PCB] = firstPcbByte;
            newMemory[START_OF_PCBS + cpu.runningPid * BYTES_PER_PCB + 1] = secondPcbByte;

            return { memory: newMemory, cpu: newCpu, mmu: mmu};

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
                // Keep page-table slots contiguous after process deletion.
                newMemory = compactPagetables(newMemory).newMemory;

                const newCpu: CpuState =
                    cpu.kind === "running" && cpu.runningPid === action.payload.processID
                        ? IDLE_CPU_STATE
                        : cpu;
                return { memory: newMemory, cpu: newCpu, mmu: mmu};
            })();
        case "FETCH_INSTRUCTION":
            if (cpu.kind === "idle") {
                return state;
            }

            const newCurrentInstructionRaw = getByteAtVirtualAddress(memory, cpu.runningPid, action.payload.newProgramCounter);
            const newPfn = getPfnFromVirtualAddress(memory, cpu.runningPid, action.payload.newProgramCounter);
            const newOffset = action.payload.newProgramCounter % 8;
            const newVirtualPageNumber = Math.floor(action.payload.newProgramCounter / 8);

            return { ...state, cpu: { 
                ...cpu, 
                programCounter: action.payload.newProgramCounter,
                currentInstructionRaw: newCurrentInstructionRaw
            }, mmu: { ...mmu, 
                virtualPageNumber: newVirtualPageNumber, 
                pageFrameNumber: newPfn,
                offset: newOffset}};
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
                case "lb":{
                    const virtualAddress = action.payload.operand;
                    const byte = getByteAtVirtualAddress(memory, cpu.runningPid, virtualAddress);
                    return {
                        ...state,
                        cpu: { ...cpu, accumulator: byte },
                    };
                }
                case "sb":
                {
                    const virtualAddress = action.payload.operand;
                    const newMemory = writeByteAtVirtualAddress(memory, cpu.runningPid, virtualAddress, cpu.accumulator);
                    return { ...state, 
                        memory: newMemory, cpu: { ...cpu} };
                }
                case "add": {
                    const virtualAddress = action.payload.operand;
                    const valueFromVirtualAddress = getByteAtVirtualAddress(memory, cpu.runningPid, virtualAddress);
                    
                    return { ...state, 
                        cpu: { ...cpu, accumulator: cpu.accumulator + valueFromVirtualAddress} };
                }
                case "addi": {
                    const immediateValue = action.payload.operand;
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator + immediateValue } };
                }

                case "sub": {
                    const virtualAddress = action.payload.operand;
                    const valueFromVirtualAddress = getByteAtVirtualAddress(memory, cpu.runningPid, virtualAddress);
                    
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator - valueFromVirtualAddress } };
                }
                case "subi": {
                    const immediateValue = action.payload.operand;
                    return { ...state, cpu: { ...cpu, accumulator: cpu.accumulator - immediateValue } };
                }

                case "branch": {
                    if (cpu.accumulator === 0) {
                        const branchAddress = action.payload.operand;
                        const newCurrentInstructionRaw = getByteAtVirtualAddress(memory, cpu.runningPid, branchAddress);
                        return { ...state, cpu: {
                                ...cpu, 
                                programCounter: branchAddress, 
                                currentInstructionRaw: newCurrentInstructionRaw 
                            }
                        };
                    }
                    return { ...state, cpu: { ...cpu} };
                }
                case "jump": {
                    const jumpVirtualAddress = action.payload.operand;
                    const newCurrentInstructionRaw = getByteAtVirtualAddress(memory, cpu.runningPid, jumpVirtualAddress);

                    return { ...state, cpu: { 
                        ...cpu, 
                        programCounter: jumpVirtualAddress,
                        currentInstructionRaw: newCurrentInstructionRaw
                    }};
                }
                default:
                    throw new Error(`Invalid opcode: ${action.payload.opcode}`);
            }
        default:
            return state;
    }
}