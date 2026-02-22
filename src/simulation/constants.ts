
// Memory layout constants
// Memory: 64 bytes = 8 pages × 8 bytes
// Page 0 (0-7):   Page tables (3 × 2 bytes at 0-5), byte 6 unused, free list at byte 7.
// Page 1 (8-15):  PCBs (4 × 2 bytes: 8,10,12,14)
// Pages 2-7:      Process memory

export const PAGE_SIZE = 8;
export const NUM_PAGES = 8;
export const MEMORY_SIZE = NUM_PAGES * PAGE_SIZE;

export const BYTES_PER_PCB = 2;

export const START_OF_PAGE_TABLES = 0;
export const START_OF_PCBS = 8;
export const START_OF_PROCESS_MEMORY = 16;
export const FREE_LIST_ADDRESS = 7;

export const MAX_PROCESSES = 3; // limited by page table space (6 bytes) + free list at 7
export const MAX_PAGES_ALLOCATABLE = 6; // 3 processes × 2 bytes (byte 7 is free list)

export const BYTES_PER_PAGE_TABLE = 2;
export const NUM_PAGES_PER_PROCESS = 2;

export const FIRST_PROCESS_PFN = 2;
export const LAST_PROCESS_PFN = NUM_PAGES - 1;

export const PROGRAM_COUNTER_MAX = 15;
export const ACCUMULATOR_MAX = 255;

export const INITIAL_FREE_LIST_BITMAP = 0b11111100;

// PCB byte 0 layout: [pageTableBase (bits 7-5) | programCounter (bits 4-1) | validBit (bit 0)]
export const PCB_VALID_BIT_MASK = 0b1;
export const PCB_PROGRAM_COUNTER_MASK = 0b1111;
export const PCB_PAGE_TABLE_BASE_MASK = 0b111;
export const PCB_VALID_BIT_CLEAR_MASK = 0b11111110;

export const PCB_BASE = 8;
export const WRITABLE_PAGE_PROBABILITY = 0.5;


export const PROCESS_COLOR_CLASSES = [
    {
        accent: "text-process-0",
        trigger: "bg-process-0",
        cell: "bg-process-0/30",
        cellStrong: "bg-process-0/15",
        ring: "ring-process-0",
        runningBadge: "text-process-0 bg-process-0/15",
        hoverHighlight: "ring-1 ring-process-0/30 bg-process-0/10",
        pcRow: "bg-process-0/20 hover:bg-process-0/25",
        pcBadge: "bg-process-0/30",
        selectedBadge: "bg-primary/25",
    },
    {
        accent: "text-process-1",
        trigger: "bg-process-1",
        cell: "bg-process-1/30",
        cellStrong: "bg-process-1/15",
        ring: "ring-process-1",
        runningBadge: "text-process-1 bg-process-1/15",
        hoverHighlight: "ring-1 ring-process-1/30 bg-process-1/10",
        pcRow: "bg-process-1/20 hover:bg-process-1/25",
        pcBadge: "bg-process-1/30",
        selectedBadge: "bg-primary/25",
    },
    {
        accent: "text-process-2",
        trigger: "bg-process-2",
        cell: "bg-process-2/30",
        cellStrong: "bg-process-2/15",
        ring: "ring-process-2",
        runningBadge: "text-process-2 bg-process-2/15",
        hoverHighlight: "ring-1 ring-process-2/30 bg-process-2/10",
        pcRow: "bg-process-2/20 hover:bg-process-2/25",
        pcBadge: "bg-process-2/30",
        selectedBadge: "bg-primary/25",
    },
    {
        accent: "text-process-3",
        trigger: "bg-process-3",
        cell: "bg-process-3/30",
        cellStrong: "bg-process-3/15",
        ring: "ring-process-3",
        runningBadge: "text-process-3 bg-process-3/15",
        hoverHighlight: "ring-1 ring-process-3/30 bg-process-3/10",
        pcRow: "bg-process-3/20 hover:bg-process-3/25",
        pcBadge: "bg-process-3/30 text-process-3",
        selectedBadge: "bg-primary/25",
    },
  ];

