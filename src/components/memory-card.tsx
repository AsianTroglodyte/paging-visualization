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

type Page = {
    pfn: number,
    ownerPid: number | null,
    vpn: number | null,
    isFree: boolean,
    bytes: number[],
}

type Pages = Page[];

type PageTableEntry = {
    pfn: number,
    valid: boolean,
    present: boolean,
    referenced: boolean,
    dirty: boolean,
    writable: boolean
}

type PageTable = PageTableEntry[];

interface MemoryCardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
  activePageTablesBases: ActivePageTablesBases;
  allProcessPages: Pages;
  getPageTable: (memory:  number[], processID: number) => PageTable;
  memory: number[];
}

export function MemoryCard({
    className,
    size = "default",
    activePageTablesBases,
    memory,
    allProcessPages,
    getPageTable,
    ...props
    }: MemoryCardProps) {



    const virtualMemoryView = useMemo(() => {
        const activeProcessesIDs = activePageTablesBases.map(entry => entry.processID);

        const activePageTables = activeProcessesIDs.map(activeProcessID => {
            const pageTable = getPageTable(memory, activeProcessID);
            const PFNs = pageTable.map(pte => memory.slice(pte.pfn * 8, pte.pfn * 8 + 8)); // get the bytes corresponding to the PFN in the page table entry. this is the content of the page in physical memory.
            return {
                processID: activeProcessID,
                pageTable: pageTable,
                PFNs: PFNs,
            }
        });


        console.log("activePageTables", activePageTables);

        return activePageTables;
    }, [activePageTablesBases, memory]);


    return (<>
        <Card className={className} {...props} size={size}>
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">Memory</h1>
                </CardTitle>

            </CardHeader>
            <CardContent className="">
                <Table> 
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-lg font-black">PFN</TableHead>
                            <TableHead className="text-lg font-black text-right">Process</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allProcessPages.map(({ pfn, ownerPid, vpn, isFree, bytes}) => (
                            <TableRow key={pfn}>
                                <TableCell className="text-lg">{pfn}</TableCell>
                                <TableCell className="text-lg text-right">
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="text-sm">Process {ownerPid !== null ? ownerPid : "Free"}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableCell>
                            </TableRow>
                        ))}
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


        {/* <Card className={className} {...props} size={size}>
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">Virtual Memory</h1>
                </CardTitle>

            </CardHeader>
            <CardContent className="">
                {virtualMemoryView.map((entry, index) => (
                    <Table key={index} className="mb-4"> 
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-lg font-black">ProcessID {entry.processID}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entry.pageTable.map((pte, index) => 
                                <TableRow key={index}>
                                    <TableCell className="text-lg">VPN: {index}</TableCell>
                                    <TableCell className="text-lg text-right">PFN: {pte.pfn}</TableCell>
                                    <TableCell className="text-sm">
                                        <Table>
                                            <TableBody>
                                                {entry.PFNs[index].map(byte => 
                                            <TableRow>
                                                <TableCell className="text-sm">{byte.toString(2).padStart(8, '0')}</TableCell>
                                            </TableRow>
                                                )}
                                            <TableRow>
                                            </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableCell>
                                </TableRow>    
                            )}
                        </TableBody>
                    </Table>
                ))}
            </CardContent>
        </Card> */}
        </>
    )
}

export default MemoryCard