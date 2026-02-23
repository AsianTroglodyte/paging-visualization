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


export function CpuCard({ cpu, machineStateDispatch, selectedVirtualAddress, setSelectedVirtualAddress, className }: 
{ 
    cpu: CpuState; 
    machineStateDispatch: React.Dispatch<MemoryAction>; 
    selectedVirtualAddress: number | null ;
    setSelectedVirtualAddress: React.Dispatch<React.SetStateAction<number | null>>;
    className: string;
}) {

    const [operand, setOperand] = useState(12);
    const isIdle = cpu.kind === "idle";
    const processColors = !isIdle ? getProcessColorClasses(cpu.runningPid) : null;

    return (
    <Card size="default" className={`flex flex-col gap-4 min-w-76 w-105 max-w-105 bg-black ${className}`}>
        <CardHeader>
            <CardTitle >
                <h1 className="text-3xl text-center font-semibold">CPU</h1>
            </CardTitle>

        </CardHeader>

        <CardContent className="flex-[1_1_auto] flex flex-row gap-2 ">
            {/* Registers */}
            <div className={`flex-[55] min-w-0 rounded-md border p-3 ${processColors ? processColors.trigger : " bg-muted/50"}`}>
                <h2 className="text-base font-semibold">PID {isIdle ? "—" : cpu.runningPid} Registers:</h2>
                <ul className="text-base font-mono list-disc list-inside space-y-0.5">
                    <li>Program Counter: {isIdle ? "-" : cpu.programCounter}</li>
                    <li>Page Table Base: {isIdle ? "-" : cpu.pageTableBase}</li>
                    <li>Accumulator: {isIdle ? "-" : cpu.accumulator}</li>
                    <li>Instruction Raw: {isIdle ? "-" : cpu.currentInstructionRaw}</li>
                </ul>
                {isIdle && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                        CPU idle — Select a process from the sidebar
                    </p>
                )}
            </div>

            
            {isIdle ? "" : 
            <div className="flex-[45] min-w-0 flex flex-col gap-2 p-2">
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
                    <Button variant="outline" size="icon" className="cursor-pointer"
                    onMouseDown={() => setOperand((prev) => Math.min(31, prev + 1))}>
                        <PlusIcon />
                    </Button>
                    <Button variant="outline" size="icon" className="cursor-pointer"
                    onMouseDown={() => setOperand((prev) => Math.max(0, prev - 1))}>
                        <MinusIcon />
                    </Button>
                </ButtonGroup>
            </Field>


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
            
            <p className="text-sm text-muted-foreground italic mt-1">
                Operand must be between 0 and 31. 
            </p>

            </div>}
        </CardContent>
    </Card>
    )
}

export default CpuCard