import { BYTES_PER_PCB, MAX_PAGES_ALLOCATABLE, START_OF_PCBS } from "./constants";
import { getRawFreeList, getProcessControlBlocks, getByteAtVirtualAddress, getProcessControlBlock } from "./selectors";
import { IDLE_CPU_STATE, type CpuState, type MachineAction, type MachineState, type MmuState} from "./types";
import { compactPagetables, setFreeList, setProcessControlBlocks, writePageTable, writeProcessPages } from "./writers";



/** takes in a machine state and then adds process with next 2 available pages */
export function makeMachineWithProcess(state: MachineState): MachineState {
    const memory = state.memory;
    const numPages = 2; // always 2 with PCB architecture
    const freeList = getRawFreeList(memory);
    
    if (freeList.length < numPages) {
        return {...state, error: {
            kind: "no_space_for_process",
            message: "Not enough free pages to create a new process.",
        }};
    }
        
    const newAllocatedPagesPFN = freeList.slice(0, numPages).map((pfn, index) => ({pfn: pfn, vpn: index}));

    // return newAllocatedPagesPFN;

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
}


export function contextSwitch(state: MachineState, action: MachineAction): MachineState{
    const cpu: CpuState = state.cpu;
    const memory: number[] = state.memory;
    const mmu: MmuState = state.mmu;

    if (action.type !== "CONTEXT_SWITCH") {
        return state;
    }

    if (action.payload.processID === null) {
        return { ...state, cpu: IDLE_CPU_STATE };
    }

    const pcb = getProcessControlBlock(memory, action.payload.processID);
    if (!pcb) {
        return { ...state, cpu: IDLE_CPU_STATE };
    }

    const currentInstructionRaw = getByteAtVirtualAddress(memory, action.payload.processID, pcb.programCounter);
    
    const newCpu: CpuState = {
        kind: "running",
        runningPid: action.payload.processID,
        programCounter: pcb.programCounter,
        pageTableBase: pcb.pageTableBase,
        accumulator: pcb.accumulator,
        currentInstructionRaw: currentInstructionRaw,
    };

    // don't need to write to memory is idle. This is because cpu doesn't 
    // have any state to save onto the PCB.
    if (cpu.kind === "idle") {
        return { ...state, cpu: newCpu };
    }

    const newMemory = [...memory];

    const firstPcbByte = (cpu.pageTableBase << 5) + (cpu.programCounter << 1) + 1;
    const secondPcbByte = cpu.accumulator;

    newMemory[START_OF_PCBS + cpu.runningPid * BYTES_PER_PCB] = firstPcbByte;
    newMemory[START_OF_PCBS + cpu.runningPid * BYTES_PER_PCB + 1] = secondPcbByte;

    return { ...state, memory: newMemory, cpu: newCpu, mmu: mmu };
}

