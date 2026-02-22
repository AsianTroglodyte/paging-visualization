import { MinusIcon, PlusIcon } from "lucide-react"
import { Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"    
import { Field} from "./ui/field"
import { Input } from "./ui/input"
import { useState } from "react"
import { OPCODE_NAMES } from "@/simulation/isa";
import type { CpuState, MemoryAction } from "@/simulation/types";
import { getProcessColorClasses } from "@/simulation/selectors"


export function CpuCard({ cpu, machineStateDispatch, selectedVirtualAddress, setSelectedVirtualAddress }: 
{ 
    cpu: CpuState; 
    machineStateDispatch: React.Dispatch<MemoryAction>; 
    selectedVirtualAddress: number | null ;
    setSelectedVirtualAddress: React.Dispatch<React.SetStateAction<number | null>>;
}) {

    const [operand, setOperand] = useState(12);
    const isIdle = cpu.kind === "idle";
    const processColors = !isIdle ? getProcessColorClasses(cpu.runningPid) : null;

    return (
    <Card size="default" className="w-75 bg-black">
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
            <div className={`rounded-md border p-3 ${processColors ? processColors.trigger : "bg-muted/50"}`}>
                <h2 className="text-base font-semibold">PID {isIdle ? "—" : cpu.runningPid} Registers:</h2>
                <ul className="text-base font-mono list-disc list-inside space-y-0.5">
                    <li>Program Counter: {isIdle ? "-" : cpu.programCounter}</li>
                    <li>Page Table Base: {isIdle ? "-" : cpu.pageTableBase}</li>
                    <li>Accumulator: {isIdle ? "-" : cpu.accumulator}</li>
                    <li>Current Instruction: {isIdle ? "-" : cpu.currentInstructionRaw}</li>
                </ul>
                {isIdle && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                        CPU idle — Select a process from the sidebar
                    </p>
                )}
            </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
            {isIdle ? "" : 
            <>
            <Field orientation="horizontal" className="flex flex-shrink-1 font-semibold ">
                <span className="text-lg whitespace-nowrap ">
                    {OPCODE_NAMES[(cpu.currentInstructionRaw >> 5)]}
                </span>
                
                <ButtonGroup className="flex bg-muted/50">
                    <Input
                        type="number"
                        min={0}
                        max={31}
                        step={1}
                        value={operand}
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            const clamped = Number.isNaN(n) ? 0 : Math.min(31, Math.max(0, Math.floor(n)));
                            setOperand(clamped);
                        }}
                        className="w-12 flex-none text-center font-semibold
                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button variant="outline" size="icon"
                    onMouseDown={() => setOperand((prev) => Math.min(31, prev + 1))}>
                        <PlusIcon />
                    </Button>
                    <Button variant="outline" size="icon"
                    onMouseDown={() => setOperand((prev) => Math.max(0, prev - 1))}>
                        <MinusIcon />
                    </Button>
                </ButtonGroup>
            </Field>

            <p className="text-sm text-muted-foreground italic mt-1">
                Operand must be between 0 and 31. because it is an unsigned 5-bit number.
            </p>

            <ButtonGroup orientation="horizontal" className="flex gap-3">
                <Button
                disabled={isIdle}
                onMouseDown={() => {
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
                <Button
                    disabled={isIdle || selectedVirtualAddress === null}
                    onMouseDown={() => {
                        if (selectedVirtualAddress === null) {
                            throw new Error("Selected virtual address is null");
                        }
                        machineStateDispatch({
                            type: "FETCH_INSTRUCTION",
                            payload: { newProgramCounter: selectedVirtualAddress }
                        });
                        
                        setSelectedVirtualAddress(null);
                    }}>
                    Fetch
                </Button>
            </ButtonGroup>
            </>}
        </CardContent>
        <CardFooter className="mt-4"> 
        </CardFooter>
    </Card>
    )
}

export default CpuCard