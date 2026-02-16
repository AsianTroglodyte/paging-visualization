import { getProcessVirtualAddressSpace } from "@/simulation/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type {PageTablesBases, PageTablesBase, PageTable, VirtualPage} from "@/simulation/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

// interface VirtualMemoryCardProps extends React.ComponentProps<"div"> {
//   size?: "default" | "sm";
//   activePageTablesBases: PageTablesBases;
//   allProcessPages: Pages;
//   memory: number[];
// }

export function VirtualMemory(
{
    machineState, 
    activePageTablesBases
} : {
    machineState: number[], 
    activePageTablesBases : PageTablesBases
}) {

    const currentProcess = 0;
    const processIDs = activePageTablesBases.map((process: PageTablesBase) => (process.processID))

    const allVirtualMemory: VirtualPage[][] = [];

    if (processIDs.length !== 0) {
        for (const processID of processIDs) {
            const newVirtualPage = getProcessVirtualAddressSpace(machineState, processID);
            allVirtualMemory.push(newVirtualPage);
        }
    }

// export type VirtualPage = {
//     vpn: number,
//     ownerPid: number | null,
//     pfn: number,
//     bytes: number[],
// }

    
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h1 className="text-4xl">Virtual Memory</h1>
                </CardTitle>
            </CardHeader>
            <CardContent className="w-60">
                {
                allVirtualMemory.map((processVirtualPages) => (
                    <>
                    <h2 className="text-lg"> process: {processVirtualPages[0].ownerPid}</h2>
                    <Accordion type="single" collapsible className="w-full">
                    {processVirtualPages.map(({pfn, ownerPid, bytes}, index_virtualPageNumber) => (
                        <AccordionItem key={pfn} value={`pfn-${pfn}`}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex justify-between w-full pr-4">
                                    <div className="font-mono">PFN {pfn}</div>
                                    <div className="text-muted-foreground">
                                        {ownerPid !== null ? `Process ${ownerPid}` : "Free"}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Virtual Address</TableHead>
                                        <TableHead className="text-right">Content</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bytes.map((byte, index_offset) => (
                                        <TableRow key={index_offset}>
                                        <TableCell className="font-mono">
                                            {/* virtual page number and offset determined by  */}
                                            {(index_virtualPageNumber * 8) + index_offset}
                                        </TableCell>
                                        <TableCell className="font-mono text-right">
                                        {byte.toString(2).padStart(8, "0")}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                    </>
                    )
                )}
            </CardContent>
        </Card>
    )
}

export default VirtualMemory;