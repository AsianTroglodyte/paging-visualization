import { MinusIcon, PlusIcon } from "lucide-react"
import { Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"    
import { Field} from "./ui/field"
import { Input } from "./ui/input"
import { useState } from "react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "./ui/pagination"
import { OPCODE_NAMES } from "@/simulation/isa";
import type { CpuState } from "@/simulation/types";
import { decodeInstruction, getByteAtVirtualAddress } from "@/simulation/selectors"


export function CpuCard({ cpu }: { cpu: CpuState }) {

    const [lbImmediateValue, setLbImmediateValue] = useState(21);
    const idle = cpu.kind === "idle";


    // if (cpu.kind === "running") {
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 0));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 1));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 2));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 3));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 4));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 5));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 6));
    //     console.log("currentInstructionRaw: ", getByteAtVirtualAddress(memory, cpu.runningPid, 7));

    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 0)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 1)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 2)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 3)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 4)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 5)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 6)));
    //     console.log("decodeInstruction: ", decodeInstruction(getByteAtVirtualAddress(memory, cpu.runningPid, 7)));
    // }

    return (
        <Card size="default" className="w-75">
            <CardHeader>
                <CardTitle >
                    <h1 className="text-4xl font-semibold">CPU</h1>
                </CardTitle>
                <CardDescription >
                    <h2 className="text-lg">Running instructions 
                        <span> </span>
                    </h2>
                </CardDescription>
                {/* Registers */}
                <div className="rounded-md border bg-muted/50 p-3">
                    <ul className="text-sm font-mono list-disc list-inside space-y-0.5">
                        <li>runningPid: {idle ? "—" : cpu.runningPid}</li>
                        <li>PC: {idle ? "—" : cpu.programCounter}</li>
                        <li>pageTableBase: {idle ? "—" : cpu.pageTableBase}</li>
                        <li>accumulator: {idle ? "—" : cpu.accumulator}</li>
                        <li>currentInstructionRaw: {idle ? "—" : cpu.currentInstructionRaw}</li>
                    </ul>
                    {idle && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                            CPU idle — Select a process from the sidebar
                        </p>
                    )}
                </div>

            </CardHeader>
            <CardContent >
                <Field orientation="horizontal" className="flex flex-shrink-1  font-semibold">
                    <span className="text-lg whitespace-nowrap ">
                        {idle ? "—" : OPCODE_NAMES[cpu.currentInstructionRaw >> 5]}
                    </span>
                    <ButtonGroup className="flex">
                        <Input 
                            type="number" 
                            value={lbImmediateValue}
                            // inputMode="numeric"
                            // pattern="[0-9]"
                            onChange={(e) => setLbImmediateValue(Number(e.target.value))}
                            className="w-12 flex-none text-center font-semibold
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                        />
                        <Button variant="outline" size="icon" 
                        onMouseDown={() => setLbImmediateValue(currentValue => currentValue + 1)}>
                            <PlusIcon />
                        </Button>
                        <Button variant="outline" size="icon" 
                        onMouseDown={() => setLbImmediateValue(currentValue => currentValue - 1)}>
                            <MinusIcon />
                        </Button>
                    </ButtonGroup>
                </Field>
                <Button disabled={idle}>Execute</Button>
            </CardContent>
            <CardFooter className="mt-4"> 
            </CardFooter>
        </Card>
    )
}

export default CpuCard