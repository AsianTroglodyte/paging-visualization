import { MinusIcon, PlusIcon } from "lucide-react"
import { Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"    
import { Field} from "./ui/field"
import { Input } from "./ui/input"
import { useState } from "react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "./ui/pagination"
import type { CpuState } from "@/simulation/types";
import { isCpuIdle } from "@/simulation/types";


export function CpuCard({ cpu }: { cpu: CpuState }) {

    const [lbImmediateValue, setLbImmediateValue] = useState(21);
    const [sbImmediateValue, setSbImmediateValue] = useState(21);
    const idle = isCpuIdle(cpu);

    return (
        <Card size="sm">
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
                        <li>PC: {cpu.programCounter}</li>
                        <li>pageTableBase: {cpu.pageTableBase}</li>
                        <li>accumulator: {cpu.accumulator}</li>
                        <li>currentInstructionRaw: {cpu.currentInstructionRaw}</li>
                    </ul>
                    {idle && (
                        <p className="text-xs text-muted-foreground italic mt-1">CPU idle — select a process</p>
                    )}
                </div>

            </CardHeader>
            <CardContent >
                <Field orientation="horizontal" className="flex flex-shrink-1  font-semibold">
                    <span className="text-lg whitespace-nowrap ">lb $s1,</span>
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
                    <span className="text-lg">($zero)</span>
                </Field>
                <Button>Execute</Button>
                <Field orientation="horizontal" className="flex flex-shrink-1  font-semibold">
                    <span className="text-lg whitespace-nowrap ">sb $s1,</span>
                    <ButtonGroup className="flex">
                        <Input 
                            type="number" 
                            value={sbImmediateValue}
                            // inputMode="numeric"
                            // pattern="[0-9]"
                            onChange={(e) => setSbImmediateValue(Number(e.target.value))}
                            className="w-12 flex-none text-center font-semibold
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                        />
                        <Button variant="outline" size="icon" 
                        onMouseDown={() => setSbImmediateValue(currentValue => currentValue + 1)}>
                            <PlusIcon />
                        </Button>
                    </ButtonGroup>
                    <span className="text-lg">($zero)</span>
                </Field>
                    <Button>Execute</Button>
            </CardContent>
            <CardFooter className="mt-4"> 
            </CardFooter>
        </Card>
    )
}

export default CpuCard