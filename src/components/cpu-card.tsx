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
import { computePosition } from "node_modules/@base-ui/react/esm/floating-ui-react"


export function CpuCard({ cpu, machineStateDispatch, selectedVirtualAddress, setSelectedVirtualAddress, className }: 
{ 
    cpu: CpuState; 
    machineStateDispatch: React.Dispatch<MemoryAction>; 
    selectedVirtualAddress: number | null ;
    setSelectedVirtualAddress: React.Dispatch<React.SetStateAction<number | null>>;
    className: string;
}) {


    function handleOperandChange(e: React.ChangeEvent<HTMLInputElement>) {
        const number = Number(e.target.value);
        const clamped = Number.isNaN(number) ? 0 : Math.min(31, Math.max(0, Math.floor(number)));
        
        console.log("clamped: operand =", clamped);

        if (cpu.kind === "idle") {
            throw new Error("Cannot change operand of instruction when CPU is idle.");
        }
        
        machineStateDispatch({
            type: "CHANGE_OPERAND_OF_INSTRUCTION",
            payload: { virtualAddress: cpu.programCounter, processID: cpu.runningPid, operand: clamped }
        });
    }

    function incrementOperand() {
        if (cpu.kind === "idle") {
            throw new Error("Cannot change operand of instruction when CPU is idle.");
        }

        const currentOperand = cpu.currentInstructionRaw & 0b00011111;
        const incrementedOperand =  currentOperand + 1;
        const clampedIncrementedOperand = Math.min(31, incrementedOperand);

        // const finalInstructionRaw = (cpu.currentInstructionRaw & 0b11100000) | clampedIncrementedOperand;

        machineStateDispatch({
            type: "CHANGE_OPERAND_OF_INSTRUCTION",
            payload: { virtualAddress: cpu.programCounter, processID: cpu.runningPid, operand: clampedIncrementedOperand }
        });
    }

    function decrementOperand() {
        if (cpu.kind === "idle") {
            throw new Error("Cannot change operand of instruction when CPU is idle.");
        }

        const currentOperand = cpu.currentInstructionRaw & 0b00011111;
        const incrementedOperand =  currentOperand - 1;
        const clampedIncrementedOperand = Math.max(0, incrementedOperand);

        const finalInstructionRaw = (cpu.currentInstructionRaw & 0b11100000) | clampedIncrementedOperand;

        machineStateDispatch({
            type: "CHANGE_OPERAND_OF_INSTRUCTION",
            payload: { virtualAddress: cpu.programCounter, processID: cpu.runningPid, operand: finalInstructionRaw }
        });
    }


    const isIdle = cpu.kind === "idle";
    const processColors = !isIdle ? getProcessColorClasses(cpu.runningPid) : null;

    return (
    <Card size="default" className={`flex flex-col gap-4 min-w-76 w-110 max-w-110 bg-black ${className}`}>
        <CardHeader>
            <CardTitle >
                <h1 className="text-3xl text-center font-semibold">CPU</h1>
            </CardTitle>

        </CardHeader>

        <CardContent className="flex-[1_1_auto] flex flex-row gap-2 ">
            {/* Registers */}
            <div className={`flex-[52] min-w-0 rounded-md border p-3 ${processColors ? processColors.trigger : " bg-muted/50"}`}>
                <h2 className="text-base font-semibold">PID {isIdle ? "—" : cpu.runningPid} Registers:</h2>
                <ul className="text-base font-mono list-disc list-inside space-y-0.5">
                    <li>Program Counter: {isIdle ? "-" : cpu.programCounter}</li>
                    <li>Page Table Base: {isIdle ? "-" : cpu.pageTableBase}</li>
                    <li>Accumulator: {isIdle ? "-" : cpu.accumulator}</li>
                    <li>Instr. Raw: {isIdle ? "-" : cpu.currentInstructionRaw}</li>
                </ul>
                {isIdle && (
                <p className="text-xs text-muted-foreground italic mt-1">
                    CPU idle — Select process from control bar below
                </p>
                )}
            </div>

            
            {isIdle ? "" : 
            <div className="flex-[48] min-w-0 flex flex-col gap-2 p-2">
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
                        value={(() => {
                            console.log("cpu.currentInstructionRaw:", cpu.currentInstructionRaw);
                            console.log("cpu.currentInstructionRaw & 0b00011111:", cpu.currentInstructionRaw & 0b00011111);
                            return (cpu.currentInstructionRaw & 0b00011111).toString();
                        })()}
                        onChange={handleOperandChange}
                        className="w-12 flex-none text-center font-semibold
                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <Button variant="outline" size="icon" className="cursor-pointer"
                    onMouseDown={incrementOperand}>
                        <PlusIcon />
                    </Button>
                    <Button variant="outline" size="icon" className="cursor-pointer"
                    onMouseDown={decrementOperand}>
                        <MinusIcon />
                    </Button>
                </ButtonGroup>
            </Field>


            <ButtonGroup orientation="horizontal" className="flex gap-3">
                <Button
                disabled={isIdle}
                className="cursor-pointer"
                onMouseDown={() => {
                    if (cpu.kind !== "running") return;
                    // const { operand } = decodeInstruction(cpu.currentInstructionRaw);
                    machineStateDispatch({ 
                        type: "EXECUTE_INSTRUCTION", 
                        payload: { 
                            opcode: cpu.currentInstructionRaw >> 5, 
                            operand: cpu.currentInstructionRaw & 0b00011111 }});
                }}>
                    Execute
                </Button>
                <Button
                    disabled={isIdle || selectedVirtualAddress === null}
                    className="cursor-pointer"
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
            
            <p className="text-xs text-muted-foreground italic mt-1">
                Operands limited to 0-31 and accumulator wraps on overflow and underflow.
            </p>

            </div>}
        </CardContent>
    </Card>
    )
}

export default CpuCard