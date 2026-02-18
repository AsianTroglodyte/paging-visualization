import { MinusIcon, PlusIcon } from "lucide-react"
import { Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"    
import { Field} from "./ui/field"
import { Input } from "./ui/input"
import { useState } from "react"
import { OPCODE_NAMES, OPCODE_LB } from "@/simulation/isa";
import type { CpuState, MemoryAction } from "@/simulation/types";
import { decodeInstruction } from "@/simulation/selectors"


export function CpuCard({ cpu, machineStateDispatch }: { cpu: CpuState; machineStateDispatch: React.Dispatch<MemoryAction> }) {

    const [operand, setOperand] = useState(21);
    const isIdle = cpu.kind === "idle";



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
                        <li>runningPid: {isIdle ? "—" : cpu.runningPid}</li>
                        <li>PC: {isIdle ? "—" : cpu.programCounter}</li>
                        <li>pageTableBase: {isIdle ? "—" : cpu.pageTableBase}</li>
                        <li>accumulator: {isIdle ? "—" : cpu.accumulator}</li>
                        <li>currentInstructionRaw: {isIdle ? "—" : cpu.currentInstructionRaw}</li>
                    </ul>
                    {isIdle && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                            CPU idle — Select a process from the sidebar
                        </p>
                    )}
                </div>

            </CardHeader>
            <CardContent >
                <Field orientation="horizontal" className="flex flex-shrink-1  font-semibold">
                        
                    {isIdle ? "" : 
                    <>
                    <span className="text-lg whitespace-nowrap ">
                        {OPCODE_NAMES[(cpu.currentInstructionRaw >> 5)]}
                    </span>
                    
                    <ButtonGroup className="flex">
                        <Input 
                            type="number" 
                            value={operand}
                            // inputMode="numeric"
                            // pattern="[0-9]"
                            onChange={(e) => setOperand(Number(e.target.value))}
                            className="w-12 flex-none text-center font-semibold
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                            />
                        <Button variant="outline" size="icon" 
                        onMouseDown={() => setOperand(currentValue => currentValue + 1)}>
                            <PlusIcon />
                        </Button>
                        <Button variant="outline" size="icon" 
                        onMouseDown={() => setOperand(currentValue => currentValue - 1)}>
                            <MinusIcon />
                        </Button>
                    </ButtonGroup>
                    <Button
                        disabled={isIdle}
                        onClick={() => {
                            if (cpu.kind !== "running") return;
                            // const { operand } = decodeInstruction(cpu.currentInstructionRaw);
                            machineStateDispatch({ 
                                type: "EXECUTE_INSTRUCTION", 
                                payload: { 
                                    opcode: cpu.currentInstructionRaw >> 5, 
                                    operand: operand }});
                        }}>
                        Execute
                    </Button>
                    </>}
                </Field>
            </CardContent>
            <CardFooter className="mt-4"> 
            </CardFooter>
        </Card>
    )
}

export default CpuCard