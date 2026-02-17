
// Memory layout constants
// Memory: 64 bytes = 8 pages × 8 bytes
// Page 0 (0-7):   Page tables (3 × 2 bytes at 0-5) + free list at byte 7. Byte 6 unused.
// Page 1 (8-15):  PCBs (4 × 2 bytes: 8,10,12,14)
// Pages 2-7:      Process memory
// Note: Free list at 7 to avoid overlapping with PCB3's accumulator at byte 15.
//       Page tables use 6 bytes (3 processes max) so byte 7 is available.

export const PAGE_SIZE = 8;
export const NUM_PAGES = 8;
export const MEMORY_SIZE = NUM_PAGES * PAGE_SIZE;

export const BYTES_PER_PCB = 2;

export const START_OF_PAGE_TABLES = 0;
export const START_OF_PCBS = 8;
export const START_OF_PROCESS_MEMORY = 16;
export const FREE_LIST_ADDRESS = 15;

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