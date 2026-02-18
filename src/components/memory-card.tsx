import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"   
import { useMemo} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getPageTable } from "@/simulation/selectors";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { ByteHoverContent, PteHoverContent, PcbByte0HoverContent, PcbByte1HoverContent } from "./hover-content";

import type { ProcessControlBlocks, Pages } from "@/simulation/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface MemoryCardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
  processControlBlocks: ProcessControlBlocks;
  allProcessPages: Pages;
  memory: number[];
}

export function MemoryCard({
    processControlBlocks,
    memory,
    allProcessPages,
    }: MemoryCardProps) {
        
    const codePagePFNs = useMemo(() =>
        new Set(allProcessPages.filter(p => p.vpn === 0).map(p => p.pfn)),
        [allProcessPages]
    );
    const virtualMemoryView = useMemo(() => {
        const activeProcessesIDs = processControlBlocks.map(pcb => pcb.processID);
        
        const activePageTables = activeProcessesIDs.map(activeProcessID => {
            const pageTable = getPageTable(memory, activeProcessID);
            const PFNs = pageTable.map(pte => memory.slice(pte.pfn * 8, pte.pfn * 8 + 8)); // get the bytes corresponding to the PFN in the page table entry. this is the content of the page in physical memory.
            return {
                processID: activeProcessID,
                pageTable: pageTable,
                PFNs: PFNs,
            }
        });
                
        return activePageTables;
    }, [processControlBlocks, memory]);
        
    return (
    <Card size="sm">
        <CardHeader>
            <CardTitle>
                <h1 className="text-4xl"> Memory </h1>
            </CardTitle>
            <CardDescription>

            </CardDescription>
        </CardHeader>
        <CardContent className="w-70">

            <Accordion type="single" collapsible className="w-full">
                {/* OS Pages */}
                <AccordionItem value="pfn-0">
                    <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                        <span className="font-mono">PFN 0</span>
                        <span className="text-muted-foreground">OS: Page Tables</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phys. Addr.</TableHead>
                                    <TableHead className="text-right">Content</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {memory.slice(0, 8).map((byte, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {index}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <HoverCard openDelay={200} closeDelay={100}>
                                            <HoverCardTrigger asChild>
                                                <span className="cursor-default underline decoration-dotted underline-offset-2">
                                                    {byte.toString(2).padStart(8, "0")}
                                                </span>
                                            </HoverCardTrigger>
                                            <HoverCardContent side="right" className="w-73">
                                                <PteHoverContent byte={byte} />
                                            </HoverCardContent>
                                        </HoverCard>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pfn-1">
                    <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                        <span className="font-mono">PFN 1</span>
                        <span className="text-muted-foreground text-xs">OS: PCBs + Free List</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent>
                    {/* Byte table here */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phys. Addr.</TableHead>
                                    <TableHead className="text-right">Content</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {memory.slice(8, 16).map((byte, index) => {
                                const slotIndex = Math.floor(index / 2);
                                const isByte0 = index % 2 === 0;
                                return (
                                <TableRow key={index}>
                                    <TableCell className="font-mono">
                                        {8 + index}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <HoverCard openDelay={200} closeDelay={100}>
                                            <HoverCardTrigger asChild>
                                                <span className="cursor-default underline decoration-dotted underline-offset-2 font-mono">
                                                    {byte.toString(2).padStart(8, "0")}
                                                </span>
                                            </HoverCardTrigger>
                                            <HoverCardContent side="right" className="w-56">
                                                {isByte0 ? (
                                                    <PcbByte0HoverContent byte={byte} slotIndex={slotIndex} />
                                                ) : (
                                                    <PcbByte1HoverContent byte={byte} slotIndex={slotIndex} />
                                                )}
                                            </HoverCardContent>
                                        </HoverCard>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            
                {allProcessPages.map(({ pfn, ownerPid, vpn, bytes }) => (
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
                                <TableHead>Phys. Addr.</TableHead>
                                <TableHead className="text-right">Content</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bytes.map((byte, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-mono">{pfn * 8 + index}</TableCell>
                                <TableCell className="font-mono text-right">
                                <HoverCard openDelay={100} closeDelay={100}>
                                    <HoverCardTrigger asChild>
                                        <span className="cursor-default underline decoration-dotted underline-offset-2">
                                            {byte.toString(2).padStart(8, "0")}
                                        </span>
                                    </HoverCardTrigger>
                                    <HoverCardContent side="right" className="w-38">
                                        <ByteHoverContent byte={byte} />
                                    </HoverCardContent>
                                </HoverCard>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Phys. Addr.</TableHead>
                    <TableHead>Content</TableHead>
                </TableRow>
                </TableHeader>

                <TableBody>
                {memory.map((byte, index) => {
                    return (
                    <TableRow key={index}>
                        <TableCell className="font-mono">
                            {index}
                        </TableCell>

                        <TableCell className="font-mono text-muted-foreground">
                            {byte.toString(2).padStart(8, "0")}
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
    )
}

export default MemoryCard