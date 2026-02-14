export type PageTablesBases = PageTablesBase[];

export type PageTablesBase = {
    processID: number,
    pageTableBase:  number, // 4 most significant bits contain page table base
    // technically numpages would more accurately be 2 | 4, but this is easier to work with
    numPages: 2 | 4, // 3 bits for num pages, but we only use 2 values so it's easier to just have it as a union type
    valid: boolean,
}


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


export type CurRunningPIDContextType = {
  curRunningPID: number | null;
  setCurRunningPID: (pid: number | null) => void;
};

export type MemoryAction =
  | {
      type: "COMPACT_PAGE_TABLES";
      payload?: never;
    }
  | {
      type: "CREATE_PROCESS_RANDOM";
      payload: { numPages: 2 | 4 };
    }
  | {
      type: "DELETE_PROCESS";
      payload: { processID: number };
    };