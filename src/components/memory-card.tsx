import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"   
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getProcessColorClasses, getProcessControlBlock } from "@/simulation/selectors";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { ByteHoverContent, PteHoverContent, PcbByte0HoverContent, PcbByte1HoverContent, FreeListHoverContent } from "./hover-content";
import { MemoryAccordionContent } from "./ui/memory-accordion-content";

import type { ProcessControlBlocks, Pages, MmuState, CpuState } from "@/simulation/types";
import { Accordion, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface MemoryCardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
  processControlBlocks: ProcessControlBlocks;
  allProcessPages: Pages;
  memory: number[];
  runningPid?: number | null;
  className: string;
  mmu: MmuState;
  cpu: CpuState;
}

export function MemoryCard({
    processControlBlocks,
    memory,
    allProcessPages,
    runningPid = null,
    className,
    mmu,
    cpu,
}: MemoryCardProps) {

    return (
    <Card className={`w-80 min-w-80 bg-black ${className}`} id="memory-card">
        <CardHeader>
            <CardTitle>
                <h1 className="text-3xl text-center"> Memory </h1>
            </CardTitle>
            <CardDescription>

            </CardDescription>
        </CardHeader>

        <CardContent>
            <Accordion type="single" collapsible className="w-full">

                {/* The OS, pages 0-1: */}
                {osPage0Accordion(memory, processControlBlocks, mmu, cpu)}

                {osPage1Accordion(memory)}

                {/* The processes, pages 2-7: */}

                <span id="process-mem">
                {allProcessPages.map(({ pfn, ownerPid, vpn: vpn, bytes }) => {
                    const isRunning = runningPid !== null && ownerPid === runningPid;
                const processColors = getProcessColorClasses(ownerPid);
                return (
                    <AccordionItem
                    id={isRunning ? `physical-memory-${vpn}` : undefined}
                    key={pfn}
                    value={`pfn-${pfn}`}
                    className={`${isRunning && processColors ? ` ${processColors.ring}` : ""}`}>
                    <AccordionTrigger
                        className={`hover:no-underline text-base font-mono px-2 cursor-pointer 
                        ${isRunning && processColors ? `${processColors.trigger} 
                            text-white [&_[data-slot=accordion-trigger-icon]]:text-white` 
                            : (processColors?.cellStrong ?? processColors?.cell ?? "")}
                        ${isRunning && processColors ? ` ${processColors.ring}` : ""}`
                        }>
                    
                        <div className="flex justify-between w-full pr-4 items-center gap-2">
                            <span className={isRunning && processColors ? "text-white" : ""}>PFN {pfn}{isRunning ? `; VPN ${vpn}` : ""}</span>

                            <span className={`flex items-center gap-2 ${isRunning && processColors ? "text-white" : (processColors?.accent ?? "text-muted-foreground")}`}>
                                {ownerPid !== null ? `PID ${ownerPid}` : "Free"}
                                {isRunning && processColors && (
                                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded text-white bg-white/20">
                                        Running
                                    </span>
                                )}
                            </span>
                        </div>
                    </AccordionTrigger>
                    <MemoryAccordionContent className="text-sm ">
                        <Table
                            className={`text-sm w-full`}
                            >
                        <TableHeader className={`${processColors?.cellStrong ?? ""}`}>
                            <TableRow>
                                <TableHead className="w-[100px]">Phys. Addr.</TableHead>
                                <TableHead className="text-right">Content</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {bytes.map((byte, index) => {
                            const isOwned = ownerPid !== null;
                            const processColorClasses = getProcessColorClasses(ownerPid);
                            return (
                                <TableRow key={index}>
                                <TableCell className={`font-mono ${processColorClasses?.cell ?? ""}`}>{pfn * 8 + index}</TableCell>
                                <TableCell className={`font-mono text-right ${processColorClasses?.cell ?? ""}`}>
                                <HoverCard openDelay={100} closeDelay={100}>
                                    <HoverCardTrigger asChild>
                                        <span
                                            className={`inline-block leading-4 cursor-default font-mono ${
                                                isOwned ? "underline decoration-dotted underline-offset-2" : ""
                                            }`}>
                                            {byte.toString(2).padStart(8, "0")}
                                        </span>
                                    </HoverCardTrigger>
                                    <HoverCardContent side="right" className="w-44">
                                        <ByteHoverContent byte={byte} />
                                    </HoverCardContent>
                                </HoverCard>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                        </TableBody>
                        </Table>
                    </MemoryAccordionContent>
                </AccordionItem>
                    );
                })}
                </span>
            </Accordion>

            {/* <Table className="text-base">
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
            </Table> */}
        </CardContent>
    </Card>
    )
}

export default MemoryCard



function osPage0Accordion(memory: number[], processControlBlocks: ProcessControlBlocks, mmu: MmuState, cpu: CpuState) {
    

    const pteIndicesInUse = new Set(
        processControlBlocks.flatMap(pcb => [pcb.pageTableBase, pcb.pageTableBase + 1])
    );
    // Map each byte index (0-5) to the process that owns that PTE, if any
    const pteOwnerByIndex = (index: number): number | null => {
        if (index >= 6) return null;
        const pcb = processControlBlocks.find(
            p => index >= p.pageTableBase && index < p.pageTableBase + 2
        );
        return pcb?.processID ?? null;
    };

    return (
    <AccordionItem value="pfn-0" id={ mmu.kind === "idle" ? "page-table" : undefined }>
        <AccordionTrigger 
        id={mmu.kind === "translated" ? "page-table" : undefined}
        className="hover:no-underline font-mono text-base px-2 cursor-pointer bg-primary [&_[data-slot=accordion-trigger-icon]]:text-white">
        <div className="flex justify-between w-full pr-4 items-center gap-2">
            <span >PFN 0</span>
            <span >OS: PTs + Free List</span>
        </div>
        </AccordionTrigger>
        <MemoryAccordionContent className="text-sm">
            <Table className="text-sm w-full">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Phys. Addr.</TableHead>
                    <TableHead className="text-right">Content</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody >
            {memory.slice(0, 8).map((byte, index) => {
                const isFreeListByte = index === 7;
                const isPteInUse = index < 6 && pteIndicesInUse.has(index); // byte 6 is not used for active PT entries
                const isOwned = isFreeListByte || isPteInUse;
                const pteOwnerPid = pteOwnerByIndex(index);
                let processCellClass = getProcessColorClasses(pteOwnerPid)?.cell ?? "";
                if (isFreeListByte) {
                    processCellClass = "bg-primary/30";
                }
                return (
                <TableRow key={index} 
                id={ 
                    (() => {
                        if (mmu.kind === "idle") return undefined;
                        if (cpu.kind === "idle") return undefined;
                        if (index === cpu.pageTableBase) return "page-table";
                        else return undefined;
                    })()}>
                    <TableCell className={`font-mono ${processCellClass}`}>
                        {index}
                    </TableCell>
                    <TableCell className={`font-mono text-right ${processCellClass}`}>
                    {isFreeListByte && (
                        <span className="text-muted-foreground mr-2">Free List</span>
                    )}
                    {pteOwnerPid != null && (
                        <span className="text-muted-foreground mr-2">Process {pteOwnerPid}</span>
                    )}
                    <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                            <span
                                className={`inline-block leading-4 cursor-default font-mono ${
                                    isOwned ? "underline decoration-dotted underline-offset-2" : ""
                                }`}>
                                {byte.toString(2).padStart(8, "0")}
                            </span>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" className="w-73">
                            {isFreeListByte ? (
                                <FreeListHoverContent byte={byte} />
                            ) : isPteInUse ? (
                                <PteHoverContent byte={byte} processID={pteOwnerPid} />
                            ) : (
                                <ByteHoverContent byte={byte} />
                            )}
                        </HoverCardContent>
                    </HoverCard>
                    </TableCell>
                </TableRow>
                );
                })}
                </TableBody>
            </Table>
        </MemoryAccordionContent>
    </AccordionItem>
    )
}

function osPage1Accordion(memory: number[]) {
    return (
    <AccordionItem value="pfn-1">
        <AccordionTrigger className="hover:no-underline text-base font-mono px-2 cursor-pointer bg-primary [&_[data-slot=accordion-trigger-icon]]:text-white">
        <div className="flex justify-between w-full pr-4 items-center gap-2">
            <span>PFN 1</span>
            <span className="text-white">OS: PCBs</span>
        </div>
        </AccordionTrigger>
        <MemoryAccordionContent className="text-sm">
            <Table className="text-sm w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Phys. Addr.</TableHead>
                        <TableHead className="text-right">Content</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {memory.slice(8, 16).map((byte, index) => {
                    const slotIndex = Math.floor(index / 2);
                    const isByte0 = index % 2 === 0;
                    const pcb = getProcessControlBlock(memory, slotIndex);
                    const isPcbValid = pcb !== null;
                    const processCellClass = getProcessColorClasses(isPcbValid ? slotIndex : null)?.cell ?? "";
                    return (
                    <TableRow key={index}>
                        <TableCell className={`font-mono ${processCellClass}`}>
                            {8 + index}
                        </TableCell>
                        <TableCell className={`font-mono text-right ${processCellClass}`}>
                        {isPcbValid && (
                            <span className="text-muted-foreground mr-2">Process {slotIndex}</span>
                        )}
                        <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <span
                                    className={`inline-block leading-4 cursor-default font-mono ${
                                        isPcbValid ? "underline decoration-dotted underline-offset-2" : ""
                                    }`}
                                >
                                    {byte.toString(2).padStart(8, "0")}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-65">
                                {isPcbValid ? (
                                    isByte0 ? (
                                        <PcbByte0HoverContent byte={byte} slotIndex={slotIndex} />
                                    ) : (
                                        <PcbByte1HoverContent byte={byte} slotIndex={slotIndex} />
                                    )
                                ) : (
                                    <ByteHoverContent byte={byte} />
                                )}
                            </HoverCardContent>
                        </HoverCard>
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
        </MemoryAccordionContent>
    </AccordionItem>
    )
}

