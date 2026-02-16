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


export type CpuState = {
  /** null when no process is running; register values are dormant/meaningless when idle */
  runningPid: number | null;
  programCounter: number;
  pageTableBase: number;
  accumulator: number;
  currentInstructionRaw: number;
};

/** Dormant CPU state when no process is running. Register values are placeholders. */
export const IDLE_CPU_STATE: CpuState = {
  runningPid: null,
  programCounter: 0,
  pageTableBase: 0,
  accumulator: 0,
  currentInstructionRaw: 0,
};

export function isCpuIdle(cpu: CpuState): boolean {
  return cpu.runningPid === null;
}

export type MachineState = {
  memory: number[];
  cpu: CpuState;
};

export type MemoryAction =
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
    };