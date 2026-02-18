import { getProcessVirtualAddressSpace } from "@/simulation/selectors";
import { OPCODE_NAMES } from "@/simulation/isa";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { ByteHoverContent } from "./hover-content";
import type { ProcessControlBlocks, VirtualPage, CpuState, MachineAction } from "@/simulation/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function VirtualMemory(
{
    memory, 
    processControlBlocks,
    cpu,
    machineStateDispatch
} : {
    memory: number[],
    processControlBlocks: ProcessControlBlocks,
    cpu: CpuState,
    machineStateDispatch: React.Dispatch<MachineAction>
}) {

    const allVirtualMemory: VirtualPage[][] = processControlBlocks.map(pcb =>
        getProcessVirtualAddressSpace(memory, pcb.processID)
    );

    const currentProcessVirtualMemory: VirtualPage[] =
        cpu.kind === "running"
            ? (allVirtualMemory.find(processVirtualMemory => processVirtualMemory[0].ownerPid === cpu.runningPid) ?? [])
            : [];




    return (
    <Card className="w-70">
    <CardHeader>
        <CardTitle>
            <h1 className="text-4xl">Virtual Memory</h1>
        </CardTitle>
    </CardHeader>
    <CardContent >
        <h2 className="text-lg">
            {cpu.kind === "running" ? `Process ${cpu.runningPid}` : "No process selected"}
        </h2>
        <Accordion type="single" collapsible className="w-full">
        {currentProcessVirtualMemory.map(({vpn, pfn, bytes}, index_virtualPageNumber) => (
            <AccordionItem key={vpn} value={`vpn-${vpn}`}>
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                        <div className="font-mono">VPN {vpn}</div>
                        <div className="text-muted-foreground">
                            {`PFN ${pfn} ${ vpn === 0 ? "Code" : "Heap"}`}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Virt. Addr.</TableHead>
                            <TableHead className="text-right">Content</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {bytes.map((byte, index_offset) => (
                        <TableRow key={index_offset}
                        onMouseDown={() => machineStateDispatch(
                            { type: "CHANGE_PROGRAM_COUNTER", payload: { newProgramCounter: (index_virtualPageNumber * 8) + index_offset } })}
                        className="cursor-pointer">
                        <TableCell className="font-mono">
                            {(index_virtualPageNumber * 8) + index_offset}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                        {vpn === 0 && (
                            <>
                            <span className="text-muted-foreground ml-2">
                                {`${OPCODE_NAMES[(byte & 0b11100000) >> 5]} ${byte & 0b00011111}`}
                            </span>
                            <span className="text-muted-foreground ml-2"></span>
                            {byte.toString(2).padStart(8, "0")}
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
                    ))}
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