import { getProcessVirtualAddressSpace, getProcessColorClasses } from "@/simulation/selectors";
import { OPCODE_NAMES } from "@/simulation/isa";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { ByteHoverContent } from "./hover-content";
import type { ProcessControlBlocks, VirtualPage, CpuState } from "@/simulation/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function VirtualMemory(
{
    memory, 
    processControlBlocks,
    selectedVirtualAddress,
    setSelectedVirtualAddress,
    cpu,
} : {
    memory: number[],
    processControlBlocks: ProcessControlBlocks,
    selectedVirtualAddress: number | null,
    setSelectedVirtualAddress: React.Dispatch<React.SetStateAction<number | null>>,
    cpu: CpuState,
}) {

    const allVirtualMemory: VirtualPage[][] = processControlBlocks.map(pcb =>
        getProcessVirtualAddressSpace(memory, pcb.processID)
    );

    const currentProcessVirtualMemory: VirtualPage[] =
        cpu.kind === "running"
            ? (allVirtualMemory.find(processVirtualMemory => processVirtualMemory[0].ownerPid === cpu.runningPid) ?? [])
            : [];
    const processColorClasses = getProcessColorClasses(cpu.kind === "running" ? cpu.runningPid : null);
    const isRunning = cpu.kind === "running" && processColorClasses != null;




    return (
    <Card className="w-74 bg-black">
    <CardHeader>
        <CardTitle>
            <h1 className="text-4xl">Virtual Memory</h1>
        </CardTitle>
    </CardHeader>
    <CardContent>
        <h2 className="text-lg">
            {cpu.kind === "running" ? `Process ${cpu.runningPid}` : "No process selected"}
        </h2>
        <Accordion type="single" collapsible className="w-full">
        {currentProcessVirtualMemory.map(({vpn, pfn, bytes}, index_virtualPageNumber) => (
            <AccordionItem key={vpn} value={`vpn-${vpn}`} >
                <AccordionTrigger className={`hover:no-underline text-sm px-2 
                    ${isRunning && processColorClasses ? `
                    ${processColorClasses.trigger} text-white [&_[data-slot=accordion-trigger-icon]]:text-white` : ""}`}>
                    <div className="flex justify-between w-full pr-4 items-center gap-2">
                        <div className={`font-mono ${isRunning && processColorClasses ? "text-white" : ""}`}>VPN {vpn}</div>
                        <div className={`flex items-center gap-2 ${isRunning && processColorClasses ? "text-white" : (processColorClasses?.accent ?? "text-muted-foreground")}`}>
                        {`PFN ${pfn} ${ vpn === 0 ? "Code" : "Heap"}`}
                        {isRunning && processColorClasses && (
                            <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded text-white bg-white/20">
                                Running
                            </span>
                        )}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm">
                    <Table className={`text-sm w-full table-fixed`}>
                    <TableHeader className={`${processColorClasses?.cellStrong ?? ""}`}>
                        <TableRow>
                            <TableHead className="w-[100px]">Virt. Addr.</TableHead>
                            <TableHead className="text-right">Content</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {bytes.map((byte, index_offset) => {
                        const virtualAddress = (index_virtualPageNumber * 8) + index_offset;
                        const isSelected = selectedVirtualAddress === virtualAddress;
                        const isProgramCounter = cpu.kind === "running" && cpu.programCounter === virtualAddress;
                        return (
                        <TableRow
                        key={index_offset}
                        onMouseDown={() => {
                            if (isProgramCounter) {
                                return;
                            }
                            setSelectedVirtualAddress(virtualAddress);
                        }}
                        className={`border-l-2 ${
                            isSelected
                                ? "bg-primary/30 hover:bg-primary/30"
                                : "border-l-transparent"
                        } ${isProgramCounter && processColorClasses ? processColorClasses.pcRow : isProgramCounter ? "bg-emerald-100/60 hover:bg-emerald-100/70" : "cursor-pointer"}`}>
                        <TableCell className={`font-mono ${processColorClasses?.cell ?? ""}`}>
                            <div className="flex items-center gap-2">
                                <span>{virtualAddress}</span>
                                {isSelected && (
                                    <span className={`text-[10px] uppercase tracking-wide rounded px-1 py-0.5 
                                    ${processColorClasses?.selectedBadge ?? "bg-primary/15 text-primary"}`}>
                                        Selected
                                    </span>
                                )}
                                {isProgramCounter && (
                                    <span className={`text-[10px] uppercase tracking-wide rounded px-1 py-0.5 
                                    ${processColorClasses?.pcBadge ?? "bg-emerald-200 text-emerald-900"}`}>
                                        PC
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className={`font-mono text-right ${processColorClasses?.cell ?? ""}`}>
                        {vpn === 0 && (
                        <>
                            <span className={`ml-2 ${isProgramCounter ? "text-white" : "text-muted-foreground"}`}>
                                {`${OPCODE_NAMES[(byte & 0b11100000) >> 5]} ${byte & 0b00011111}`}
                            </span>
                            <span className={`ml-2 ${isProgramCounter ? "text-white" : "text-muted-foreground"}`}></span>
                            <span className={isProgramCounter ? "text-white" : ""}>{byte.toString(2).padStart(8, "0")}</span>
                        </>
                        )}
                        {vpn === 1 && (
                        <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <span className="cursor-default underline decoration-dotted underline-offset-2">
                                    {byte.toString(2).padStart(8, "0")}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent side={"right"} className="w-38">
                                <ByteHoverContent byte={byte} />
                            </HoverCardContent>
                        </HoverCard>
                        )}
                        </TableCell>
                    </TableRow>
                    )})}
                    </TableBody>
                    </Table>
                </AccordionContent>
            </AccordionItem>
        ))}
        </Accordion>
    </CardContent>
    </Card>
    )
}

export default VirtualMemory;


// {
//     processControlBlocks.map((pcb, index_processID) => (
//         <div key={pcb.processID}>
//         <h2 className="text-lg"> process: {pcb.processID}</h2>
//         <Accordion type="single" collapsible className="w-full">
//         {allVirtualMemory[index_processID].map(({pfn, ownerPid, bytes}, index_virtualPageNumber) => (
//             <AccordionItem key={pfn} value={`pfn-${pfn}`}>
//                 <AccordionTrigger className="hover:no-underline">
//                     <div className="flex justify-between w-full pr-4">
//                         <div className="font-mono">VPN {index_virtualPageNumber}</div>
//                         <div className="text-muted-foreground">
//                             {`PFN ${pfn}`}
//                         </div>
//                     </div>
//                 </AccordionTrigger>
//                 <AccordionContent>
//                     <Table>
//                     <TableHeader>
//                         <TableRow>
//                             <TableHead>Virtual Address</TableHead>
//                             <TableHead className="text-right">Content</TableHead>
//                         </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                         {bytes.map((byte, index_offset) => (
//                             <TableRow key={index_offset}>
//                             <TableCell className="font-mono">
//                                 {/* virtual page number and offset determined by  */}
//                                 {(index_virtualPageNumber * 8) + index_offset}
//                             </TableCell>
//                             <TableCell className="font-mono text-right">
//                             {byte.toString(2).padStart(8, "0")}
//                             </TableCell>
//                         </TableRow>
//                         ))}
//                     </TableBody>
//                     </Table>
//                 </AccordionContent>
//             </AccordionItem>
//         ))}
//         </Accordion>
//         </div>
//     ))
//     }
// </CardContent>

 