import { MinusIcon, PlusIcon } from "lucide-react"
import { Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"    
import { Field} from "./ui/field"
import { Input } from "./ui/input"
import { OPCODE_NAMES } from "@/simulation/isa";
import type { CpuState, MemoryAction } from "@/simulation/types";
import { getProcessColorClasses } from "@/simulation/selectors"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { PcHoverContent, PtbHoverContent, AccHoverContent, IrHoverContent } from "./cpu-hover-card";

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

        // input validation
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

        // input validation
        const currentOperand = cpu.currentInstructionRaw & 0b00011111;
        const decrementedOperand =  currentOperand - 1;
        const clampedDecrementedOperand = Math.max(0, decrementedOperand);

        // const finalInstructionRaw = (cpu.currentInstructionRaw & 0b11100000) | clampedDecrementedOperand;

        machineStateDispatch({
            type: "CHANGE_OPERAND_OF_INSTRUCTION",
            payload: { virtualAddress: cpu.programCounter, processID: cpu.runningPid, operand: clampedDecrementedOperand }
        });
    }


    const isIdle = cpu.kind === "idle";
    const processColors = !isIdle ? getProcessColorClasses(cpu.runningPid) : null;

    return (
    <Card size="default" className={`flex flex-col gap-4 w-90 bg-black ${className} relative `}>

        <CardHeader>
            <CardTitle >
                <h1 className="text-3xl text-center font-semibold">CPU: PID {isIdle ? "—" : cpu.runningPid} </h1>
            </CardTitle>

        </CardHeader>

        <CardContent className="flex-[1_1_auto] flex flex-row gap-2 ">
            {/* Registers */}
            <div className={`flex-[38] min-w-0 rounded-md border p-3 ${processColors ? processColors.trigger : " bg-muted/50"}`}>
                <h2 className="text-base font-semibold">Registers:</h2>
                <ul className="text-base list-disc list-inside space-y-0.5">
                    <li>
                        <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <span className="cursor-default underline underline-offset-2">
                                    PC: {isIdle ? "-" : cpu.programCounter}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-64">
                                <PcHoverContent />
                            </HoverCardContent>
                        </HoverCard>
                    </li>
                    <li>
                        <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <span className="cursor-default underline underline-offset-2">
                                    PTBR: {isIdle ? "-" : cpu.pageTableBase}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-64">
                                <PtbHoverContent />
                            </HoverCardContent>
                        </HoverCard>
                    </li>
                    <li>
                        <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <span className="cursor-default underline underline-offset-2">
                                    Acc: {isIdle ? "-" : cpu.accumulator}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-64">
                                <AccHoverContent />
                            </HoverCardContent>
                        </HoverCard>
                    </li>
                    <li>
                        <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <span className="cursor-default underline underline-offset-2">
                                    IR: {isIdle ? "-" : cpu.currentInstructionRaw}
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" className="w-64">
                                <IrHoverContent />
                            </HoverCardContent>
                        </HoverCard>
                    </li>
                </ul>
                {isIdle && (
                <p className="text-xs text-muted-foreground italic mt-1">
                    CPU idle — Select process from control bar below
                </p>
                )}
            </div>

            
            {isIdle ? "" : 
            <div className="flex-[62] min-w-0 flex flex-col gap-2 p-2">
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