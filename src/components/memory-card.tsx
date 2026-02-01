import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"   
import { useMemo, useState} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group";

// type pageView = {
//   pfn: number
//   isFree: boolean
//   ownerPid: number | null
//   vpn: number | null
// }[]

type ActivePageTablesBases = {
    processID: number,
    pageTableBase:  number, // 4 most significant bits contain page table base
    // technically numpages would more accurately be 2 | 4, but this is easier to work with
    numPages: number,
    valid: boolean,
}[]


type PageTableEntry = {
    pfn: number,
    valid: boolean,
    present: boolean,
    referenced: boolean,
    dirty: boolean,
    writable: boolean
}

type PageTable = PageTableEntry[];

type Page = {
    pfn: number,
    ownerPid: number | null,
    vpn: number | null,
    isFree: boolean,
    bytes: number[],
}

type Pages = Page[];

export function MemoryCard({
    className,
    size = "default",
    ...props
    }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {

    
    // the memory byte array contains 4 crucial pieces of data:
    //  - page table base list - list of bytes, each byte is an entry mapping a process to the 
    //    base address of their corresponding page table.
    //  - free list - a single byte containing info on which pages are free
    //  - page tables - maps the VPNs to the PFNs along with showing control bits. 
    //  - process memory - the memory used by processes. 
    // Yes, I could have seperated these into multiple useStates, and that would have probably been an
    // easier more maintainable approach, but simulating a proper single piece of memory seemed more fun
    // 
    const FREE_LIST_ADDRESS = 7;
    const MAX_PROCESSES = 3;
    const MAX_PAGES_ALLOCATABLE = 6; // maximum space for page tables in bytes
    const START_OF_PROCESS_MEMORY = 15; // address where process memory starts
    const START_OF_PAGE_TABLES = 8; // address where process memory starts

    const [memory, setMemory] = useState(() => {
        const initialMemory = new Array(64).fill(0);
        // initialize free list. most significant bit represents free status 
        // of first page in process memory, bit after that represents state of 
        // page in process memory, and so on.
        initialMemory[FREE_LIST_ADDRESS] = 0b11111100;
        // 
        return initialMemory;
    }); 

    // derived memory view used for more convenient parsing of data and for the UI view
    const freeList = useMemo(() => {
        return getFreeList(memory);
    }, [memory]);

    const activePageTableBases = useMemo(() => {
        return getActivePageTablesBases(memory);
    }, [memory]);

    const allPageTables = useMemo(() => {
        return getAllPageTables();
    }, [memory]);

    const allProcessPages = useMemo(() => {
        return getAllProcessPages();
    }, [memory])


    function getFreeList(mem: number[]): number[] {
        const bitmap = mem[FREE_LIST_ADDRESS];
        const numPages = 8;
        const free: number[] = [];

        for (let page = 0; page < numPages; page++) {
            if ((bitmap & (1 << page)) !== 0) {
                free.push(page);
            }
        }

        return free;
    }

    function setFreeList(newFreeList: number[]) {
        const bitmap = newFreeList.reduce(
            (acc, page) => acc | (1 << page),
            0
        );

        setMemory(prev => {
            const next = [...prev];
            next[FREE_LIST_ADDRESS] = bitmap;
            return next;
        });
    }

    function getAllPageTables(): {processID: number, pageTable: PageTable}[] {
        const allPageTables = activePageTableBases.map(entry => {
            return {
                processID: entry.processID,
                pageTable: getPageTable(entry.processID)
            }
        });
        return allPageTables;
    }

    function getAllProcessPages() : Pages {
        const pages: Pages = [];
        for (let pageFrameNumber = 2; pageFrameNumber < 8; pageFrameNumber++) {
            
            const ownerPid =activePageTableBases.find(entry => {
                    const pageTable = getPageTable(entry.processID);
                    return pageTable.some(pte => pte.pfn === pageFrameNumber);
                })?.processID || null;
            
            const vpn = ownerPid !== null ? getPageTable(ownerPid).findIndex(pte => pte.pfn === pageFrameNumber) : null;
            
            const bytes = memory.slice(START_OF_PROCESS_MEMORY + pageFrameNumber * 8, START_OF_PROCESS_MEMORY + (pageFrameNumber + 1) * 8);

            pages.push({
                pfn: pageFrameNumber,
                ownerPid: ownerPid,
                vpn: vpn,
                isFree: ownerPid === null,
                bytes: bytes,
            });
        }
        return pages;
    }

    // Everything below are regular functions that operate on the memory byte array 
    // this also includes functions that generate some specialized views such as getPageTable that 
    // don't fit the views that above

    function setActivePageTablesBases(activePageTablesBases: ActivePageTablesBases) {
        if (activePageTablesBases.some(entry => entry.numPages !== 2 && entry.numPages !== 4)) {
            throw new Error("number of pages for processes' must be either2 or 4.");
        }

        setMemory(prev => {
            const newMemory = [...prev];
            activePageTablesBases.forEach(entry => {
                // raw processID works because the process ID is the index in the page table base list
                newMemory[entry.processID] = 
                (entry.pageTableBase << 4) | (entry.numPages << 1) | 0b00000001; // set valid bit
            });
            return newMemory;
        });
    }

    function getPageTable(processID: number): PageTable {
        const pageTableEntry = activePageTableBases.find(entry => entry.processID === processID);
        if (!pageTableEntry) {
            throw new Error(`Process ID ${processID} not found in active page table bases.`);
        }
        const pageTableBase = pageTableEntry.pageTableBase;
        const numPages = pageTableEntry.numPages;
        return memory.slice(pageTableBase, pageTableBase + numPages).map(
            (entryByte) => {
                return {
                    pfn: (entryByte >> 5),
                    valid: ((entryByte & 0b00010000) !== 0),
                    present: ((entryByte & 0b00001000) !== 0),
                    referenced: ((entryByte & 0b00000100) !== 0),
                    dirty: ((entryByte & 0b00000010) !== 0),
                    writable: ((entryByte & 0b00000001) !== 0),
                }
            }
        );
    }

    
    function setPageTable(AllocatedPagesPFN: number[], pageTableBase: number) {
        setMemory(prev => {
            const newMemory = [...prev];
            AllocatedPagesPFN.forEach((_, index) => {
                // create page table entry
                // PFN (3 bit) | valid (1 bit) | Present (1 bit) | Referenced (1 bit) | Dirty (1 bit) | Writable (1 bit) 
                // valid = 1; present = 1; referenced = 0; dirty = 0; writable = random 0/1;

                // I want to make sure that there is always at least one unwritable page
                let writable = 0;
                if (activePageTableBases.length > 0) writable = Math.random() < 0.8 ? 1 : 0;

                const pageTableEntry = (AllocatedPagesPFN[index] << 5) | 0b00011001 | (writable); // set valid bit and writable bit
                newMemory[pageTableBase + index] = pageTableEntry;
            })
            return newMemory;
        })
    }


    function setProcessPages(numPages: number, freeList: number[]): number[] {
        for (let pageFrameNumber = 2; pageFrameNumber < 8; pageFrameNumber++) {    
            const ownerPid =activePageTableBases.find(entry => {
                    const pageTable = getPageTable(entry.processID);
                    return pageTable.some(pte => pte.pfn === pageFrameNumber);
                })?.processID || null;
        }
    }

    function createProcessRandom(numPages: number) {
        if (freeList.length < numPages) {
            throw new Error(`Cannot allocate ${numPages} pages. Only ${freeList.length} free.`);
        }

        // select random free pages
        const allocatedPagesPFN = selectRandPages(numPages, freeList);
        console.log("AllocatedPagesPFN: ", allocatedPagesPFN);
        
        // determine new process ID
        const newProcessID = createProcessID();

        // find base of free space for page table
        let newPageTableBase = findFreePageTableBase(activePageTableBases, numPages);
        // console.log("newPageTableBase", newPageTableBase);

        // no space found, compact page tables and try again. NOTE we already check if there is enough space 
        // before at the very beginning of this function, so compaction followed by retrying should always work
        if (newPageTableBase === null) {
            newPageTableBase = compactPagetables();
        }


        setActivePageTablesBases([
            ...activePageTableBases,
            {
                processID: newProcessID,
                pageTableBase: newPageTableBase, 
                numPages: numPages,
                valid: true
            }
        ]);


        setPageTable(allocatedPagesPFN, newPageTableBase);


        // TODO: The entire process of creating the process is made up of two stage
        // 1. getting the data to create a process: 
        //    - newProcessID
        //    - newPageTableBase
        //    - allocatedPagesPFN.
        // 2. then using that information to set data using a function associated with the main
        //    - pageTableBaseAddresses
        //    - setPageTable
        //    - freelist - free list is currently modified in the select randpages function and 
        //      and updates the free list based on list of the remaining pages.
        //      ideally it is called here along with setActivePageTablebases and setPagetable
        //      This makes the createProcessRandom function more well structured and it 
        //      makes it easier to understand. Having free list modified covertly by another 
        //      function is very icky and stinky. Having the free list modification here makes it
        //      more explicit about what is happening
        //      Currently it takes remaining pages as an argument. createProcessRandom only 
        //      ever gets access to allocatedPagesPFN. we need to mdify setFreeList to use 
        //      allocatedPagesPFN as input instead

        
        // const newPageTableAddress = freeStart.current;  
        // freeStart.current += numPages;  

        // // update page table directory
        // setPageTableDirectory(prev => [...prev, {processID: newProcessID, pageTableAddress: newPageTableAddress, pageTableLength: numPages}]);

        // // Write PTEs into memory 
        // setMemory(prevMemory => {
        //     const newMemory = [...prevMemory];
        //     AllocatedPagesPFN.forEach((pfn, index) => {
        //         newMemory[newPageTableAddress + index] = pfn;
        //     })
        //     return newMemory;
        // })

        // console.log(`Created process ${newProcessID} with pages: ${AllocatedPagesPFN}`);
        
        // // print entire page table directory
        // console.log("Page Table Directory:");
        // pageTableDirectory.forEach(entry => {
        //     console.log(`Process ${entry.processID}: Pages ${entry.pageTableAddress} - ${entry.pageTableAddress + entry.pageTableLength - 1}`);
        // });
    }
    
    function createProcessID() {
        for (let i = 0; i <= activePageTableBases.length; i += 1) {
            // Check if i is already used as a processID in the pageTable Directory
            // if not, use it as the new process ID
            if (activePageTableBases.length === 0) {
                return i;
            }
            if (activePageTableBases.some(entry => entry.processID === i) === false) {
                return i;
            }
        }
        throw new Error("createProcessID(): Available ID somehow not found.");
    }
       
    function selectRandPages(numPages: number, freeList: number[]): number[] {
        for (let i = freeList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [freeList[i], freeList[j]] = [freeList[j], freeList[i]]
        }
        const allocated = freeList.slice(0, numPages);
        const remaining = freeList.slice(numPages);
        setFreeList(remaining);
        return allocated;
    }

    function findFreePageTableBase(active: ActivePageTablesBases, needed: number): number | null {
        console.log("active: ", active);
        const tables = active
        .map(e => ({
            start: e.pageTableBase,
            end: e.pageTableBase + e.numPages,
        }))
        .sort((a, b) => a.start - b.start);

        let cursor = START_OF_PAGE_TABLES ; // start of page tables

        for (const t of tables) {
            if (cursor + needed <= t.start) {
                return cursor; // found a gap
            }
            cursor = t.end;
        }

        // check space at the end
        if (cursor + needed <= (START_OF_PAGE_TABLES + MAX_PAGES_ALLOCATABLE)) {
            return cursor;
        }

        return null; // no space
    }

    function compactPagetables() {
        const sortedActivePageTableBases = [...activePageTableBases].sort((a, b) => a.pageTableBase - b.pageTableBase);

        let cursor = 0;

        // compacting the data
        for (const entry of sortedActivePageTableBases) {
            entry.pageTableBase = cursor;
            cursor += entry.numPages;
        }

        setActivePageTablesBases(sortedActivePageTableBases);

        return 0; // after compaction, first page table base is always at 0
    }




    return (
        <Card className={className} {...props} size={size}>
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">Memory</h1>
                </CardTitle>

            </CardHeader>
            <CardContent className="">
                <ButtonGroup orientation="vertical">
                    <Button variant="default" onClick={() => createProcessRandom(4)}>Create Process (4)</Button>
                    <Button variant="default" onClick={() => createProcessRandom(2)}>Create Process (2)</Button>
                    {/* <Button variant="default" onClick={createProcessRandom}> Process Random</Button> */}
                </ButtonGroup>
                <Table> 
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-lg font-black">PFN</TableHead>
                            <TableHead className="text-lg font-black text-right">Process</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* {pageView.map(({ pfn, isFree, ownerPid, vpn }) => (
                            <TableRow key={pfn}>
                                <TableCell className="text-lg">{pfn}</TableCell>
                                <TableCell className="text-lg text-right">{ownerPid}</TableCell>
                            </TableRow>
                        ))}
                         */}
                    </TableBody>
                </Table>
                <Table> 
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-sm font-black">address</TableHead>
                            <TableHead className="text-sm font-black text-right">mem content</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {memory.map(
                            (_, index) => (index % 8 === 0)).map((_, index) => (
                            <TableRow key={index}>
                                {/* (index).toString(2).padStart(6, "0") */}
                                <TableCell className="text-sm">{index}</TableCell>
                                <TableCell className="text-sm text-right">
                                    {memory[index].toString(2).padStart(8, '0')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default MemoryCard