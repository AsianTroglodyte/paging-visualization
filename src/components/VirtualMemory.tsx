import { getProcessVirtualAddressSpace } from "@/simulation/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { ProcessControlBlocks, VirtualPage } from "@/simulation/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function VirtualMemory(
{
    machineState, 
    processControlBlocks
} : {
    machineState: number[], 
    processControlBlocks: ProcessControlBlocks
}) {

    const allVirtualMemory: VirtualPage[][] = processControlBlocks.map(pcb =>
        getProcessVirtualAddressSpace(machineState, pcb.processID)
    );

    
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h1 className="text-4xl">Virtual Memory</h1>
                </CardTitle>
            </CardHeader>
            <CardContent className="w-60">
                {
                processControlBlocks.map((pcb, idx) => (
                    <div key={pcb.processID}>
                    <h2 className="text-lg"> process: {pcb.processID}</h2>
                    <Accordion type="single" collapsible className="w-full">
                    {allVirtualMemory[idx].map(({pfn, ownerPid, bytes}, index_virtualPageNumber) => (
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
                    </div>
                ))
                }
            </CardContent>
        </Card>
    )
}

export default VirtualMemory;