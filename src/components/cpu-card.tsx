import { MinusIcon, PlusIcon } from "lucide-react"
import { Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"    
import { Field} from "./ui/field"
import { Input } from "./ui/input"
import { useState } from "react"


export function CpuCard() {
    const [immediateValue, setImmediateValue] = useState(21);

    return (
        <Card size="sm">
            <CardHeader>
                <CardTitle >
                    <h1 className="text-4xl font-semibold">CPU</h1>
                </CardTitle>
                <CardDescription >
                    <h2 className="text-lg">Running instruction from 
                        <span> process 1 </span>
                    </h2>
                </CardDescription>
            </CardHeader>
            <CardContent >
                <Field orientation="horizontal" className="flex flex-shrink-1  font-semibold">
                    <span className="text-lg whitespace-nowrap ">lb $s1,</span>
                    <ButtonGroup className="flex">
                        <Input 
                            type="number" 
                            value={immediateValue}
                            // inputMode="numeric"
                            // pattern="[0-9]"
                            onChange={(e) => setImmediateValue(Number(e.target.value))}
                            className="w-12 flex-none text-center font-semibold
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                        />
                        <Button variant="outline" size="icon" 
                        onClick={() => setImmediateValue(currentValue => currentValue + 1)}>
                            <PlusIcon />
                        </Button>
                        <Button variant="outline" size="icon" 
                        onClick={() => setImmediateValue(currentValue => currentValue - 1)}>
                            <MinusIcon />
                        </Button>
                    </ButtonGroup>
                    <span className="text-lg">($zero)</span>
                </Field>
                <Field orientation="horizontal" className="flex flex-shrink-1  font-semibold">
                    <span className="text-lg whitespace-nowrap ">sb $s1,</span>
                    <ButtonGroup className="flex">
                        <Input 
                            type="number" 
                            value={immediateValue}
                            // inputMode="numeric"
                            // pattern="[0-9]"
                            onChange={(e) => setImmediateValue(Number(e.target.value))}
                            className="w-12 flex-none text-center font-semibold
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                        />
                        <Button variant="outline" size="icon" 
                        onClick={() => setImmediateValue(currentValue => currentValue + 1)}>
                            <PlusIcon />
                        </Button>
                        <Button variant="outline" size="icon" 
                        onClick={() => setImmediateValue(currentValue => currentValue - 1)}>
                            <MinusIcon />
                        </Button>
                    </ButtonGroup>
                    <span className="text-lg">($zero)</span>
                </Field>
            </CardContent>
            <CardFooter className="mt-4"> 
                <Button>Execute</Button>
            </CardFooter>
        </Card>
    )
}

export default CpuCard