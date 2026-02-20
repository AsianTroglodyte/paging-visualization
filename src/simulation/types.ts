export type PageTablesBases = PageTablesBase[];

export type PageTablesBase = {
    processID: number,
    pageTableBase:  number, // physical address pointing to page table (3 bits)
    numPages: 2 | 4, // always 2 with PCB architecture
    valid: boolean,
}

// Process Control Block - replaces activePageTableBases, stored in page 1
export type ProcessControlBlock = {
    processID: number,
    pageTableBase: number,  // 3 bits - physical address of page table in page 0
    programCounter: number, // 4 bits
    validBit: number,       // 1 bit
    accumulator: number,    // 8 bits - second byte of PCB
};

export type ProcessControlBlocks = ProcessControlBlock[];


export type PageTableEntry = {
    pfn: number,
    valid: boolean,
    present: boolean,
    referenced: boolean,
    dirty: boolean,
    writable: boolean
}

export type PageTable = PageTableEntry[];

export type Page = {
    pfn: number,
    ownerPid: number | null,
    vpn: number | null,
    isFree: boolean,
    bytes: number[],
}

export type Pages = Page[];

export type VirtualPage = {
    vpn: number;
    ownerPid: number | null;
    pfn: number;
    bytes: number[];
};


/** Tagged union: CPU is either idle or running a process. */
export type CpuState =
  | { kind: "idle" }
  | {
      kind: "running";
      runningPid: number;
      programCounter: number;
      pageTableBase: number;
      accumulator: number;
      currentInstructionRaw: number;
    };

export const IDLE_CPU_STATE: CpuState = { kind: "idle" };

export type MachineState = {
  memory: number[];
  cpu: CpuState;
};

export type MachineAction =
  | {
      type: "COMPACT_PAGE_TABLES";
      payload?: never;
    }
  | {
      type: "CREATE_PROCESS_RANDOM";
      payload?: { numPages?: 2 }; // numPages always 2 with PCB architecture
    }
  | {
      type: "DELETE_PROCESS";
      payload: { processID: number };
    }
  | {
      type: "CONTEXT_SWITCH";
      payload: { processID: number | null };
    }
  | {
    type: "EXECUTE_INSTRUCTION";
    payload?: never;
  } 
  | {
    type: "FETCH_INSTRUCTION";
    payload: { virtualAddress: number };
  } 
  |{
    type: "CHANGE_PROGRAM_COUNTER";
    payload: { newProgramCounter: number };
  }
  | {
    type: "EXECUTE_INSTRUCTION";
    payload: { opcode: number, operand: number };
  }

export type MemoryAction = MachineAction;

