import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"   
import { useState} from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {Button} from "./ui/button"
import { ButtonGroup } from "./ui/button-group";

export function MemoryCard({
    className,
    size = "default",
    ...props
    }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
    
    const [memory, setMemory] = useState(new Array(64).fill(0)); // Example memory addresses 64 items 
    const pageTableDirectory: {pageID: number, pageTableAddress: number []}[] = [];
    let freeList: number[] = [0, 8, 16, 24, 32, 40, 48, 56];

    function createProcess(numPages: number = 4) {
        if (freeList.length < numPages) {
            throw new Error(`Cannot allocate ${numPages} pages. Only ${freeList.length} free.`);
        }

        const newProcessID = createProcessID();
        const AllocatedPages = allocatePages(numPages); // For simplicity, allocate 4 pages per process
        pageTableDirectory.push({pageID: newProcessID, pageTableAddress: AllocatedPages});
        console.log(`Created process ${newProcessID} with pages: ${AllocatedPages.toString()}`);
    }

    function createProcessID() {
        // let i = 1;
        for (let i = 0; i <= pageTableDirectory.length; i += 1) {
            // Check if i is already used as a pageID in the pageTable Directory
            // if not, use it as the new process ID
            if (pageTableDirectory.length === 0) {
                return i;
            }
            if (pageTableDirectory.some(entry => entry.pageID === i) === false) {
                return i;
            }
        }
        throw new Error("createProcessID(): Available ID somehow not found.");
    }

    function allocatePages(numPages: number): number[] {
        // maybe we can have a global list of page addresses
        // or maybe just calculate them on the fly from the memory size
        const allocated = freeList.slice(0, numPages)
        const remaining = freeList.slice(numPages)
        freeList = remaining;

        return allocated;
    }

    function createProcessRandom() {
        const newProcessID = createProcessID();
        const AllocatedPages = randAllocatePages(4); // For simplicity, allocate 4 pages per process
        pageTableDirectory.push({pageID: newProcessID, pageTableAddress: AllocatedPages});
        console.log(`Created process ${newProcessID} with pages: ${AllocatedPages}`);
    }


    function randAllocatePages(numPages: number): number[] {
        for (let i = freeList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[freeList[i], freeList[j]] = [freeList[j], freeList[i]]
        }
        const allocated = freeList.slice(0, numPages)
        const remaining = freeList.slice(numPages)
        freeList = remaining;
        return allocated;
    }


    return (
        <Card className={className} {...props} size={size}>
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">Memory</h1>
                </CardTitle>

            </CardHeader>
            <CardContent className="">
                <ButtonGroup orientation="vertical">
                    <Button onClick={() => createProcess(4)}>Create Process</Button>
                    <Button onClick={createProcessRandom}>Create Process Random</Button>
                </ButtonGroup>
                <Table> 
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-lg font-black">PFN</TableHead>
                            <TableHead className="text-lg font-black text-right">Process</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {memory.filter(
                            (_, index) => ((index + 1)% 8 === 0)).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-lg">{index}</TableCell>
                                <TableCell className="text-lg text-right">{`Process ${Math.floor(Math.random() * 3) + 1}`}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Table> 
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-sm font-black">address</TableHead>
                            <TableHead className="text-sm font-black text-right">mem content</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {memory.map(
                            (_, index) => (index % 8 === 0)).map((_, index) => (
                            <TableRow key={index}>
                                {/* (index).toString(2).padStart(6, "0") */}
                                <TableCell className="text-sm">{index}</TableCell>
                                <TableCell className="text-sm text-right">{`${memory[index]}`}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default MemoryCard