import { getProcessVirtualAddressSpace, getProcessVirtualMemory } from "@/simulation/selectors";
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
    memory, 
    activePageTablesBases
} : {
    memory: number[], 
    activePageTablesBases : PageTablesBases
}) {

    const currentProcess = 0;
    const processIDs = activePageTablesBases.map((process: PageTablesBase) => (process.processID))

    const allVirtualMemory: VirtualPage[][] = [];

    if (processIDs.length !== 0) {
        for (const processID of processIDs) {
            const newVirtualPage = getProcessVirtualAddressSpace(memory, processID);
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
            <CardContent>
                {
                allVirtualMemory.map((processVirtualPages) => (
                    <>
                    
                    <h1 className="text-lg"> process: {processVirtualPages[0].ownerPid}</h1>
                    <Accordion type="single" collapsible className="w-full">
                    {processVirtualPages.map(({pfn, ownerPid, bytes}) => (
                        <AccordionItem key={pfn} value={`pfn-${pfn}`}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex justify-between w-full pr-4">
                                <span className="font-mono">PFN {pfn}</span>
                                <span className="text-muted-foreground">
                                    {ownerPid !== null ? `Process ${ownerPid}` : "Free"}
                                </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-right">Content</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bytes.map((byte, index) => (
                                        <TableRow key={index}>
                                        <TableCell className="font-mono">{pfn * 8 + index}</TableCell>
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