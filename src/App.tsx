import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useState, useReducer} from "react";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { curRunningPIDContext, FREE_LIST_ADDRESS, memoryReducer } from "./simulation/reducer";
import { getActivePageTablesBases, getAllPageTables, getAllProcessPages, getFreeList } from "./simulation/selectors";
import VirtualMemory from "./components/VirtualMemory";


export function App() {


    const [curRunningPID, setCurRunningPID] = useState<number | null>(null);


    // the memory byte array contains 4 crucial pieces of data:
    //  - page table base list - list of bytes, each byte is an entry mapping a process to the 
    //    base address of their corresponding page table.
    //  - free list - a single byte containing info on which pages are free
    //  - page tables - maps the VPNs to the PFNs along with showing control bits. 
    //  - process memory - the memory used by processes. 

    const [memory, memoryDispatch] = useReducer(
        memoryReducer,
        null,
        () => {
            const initialMemory = new Array(64).fill(0);

            initialMemory[FREE_LIST_ADDRESS] = 0b11111100;

            return initialMemory;
        }
    );


    // derived memory view used for more convenient parsing of data and for the UI view
    const freeList = useMemo(() => {
        return getFreeList(memory);
    }, [memory]);

    const activePageTablesBases = useMemo(() => {
        return getActivePageTablesBases(memory);
    }, [memory]);

    const allPageTables = useMemo(() => {
        return getAllPageTables(memory);
    }, [memory]);

    const allProcessPages = useMemo(() => {
        // console.log("current allProcessPages:", allProcessPages);
        return getAllProcessPages(memory);
    }, [memory]);





    return (
    <curRunningPIDContext.Provider value={{curRunningPID, setCurRunningPID}}>
        <SidebarProvider>
            <AppSidebar 
                memoryDispatch={memoryDispatch}
                activePageTablesBases={activePageTablesBases}
            />
            <SidebarTrigger className="" size="lg" />

            <div className="py-10  pl-1 w-full h-full 
            flex flex-3 flex items-start gap-4">

                <CpuCard></CpuCard>
                <MmuCard></MmuCard>
                <MemoryCard className="row-span-2" 
                activePageTablesBases={activePageTablesBases} 
                allProcessPages={allProcessPages} 
                memory={memory}></MemoryCard>
                <VirtualMemory memory={memory} activePageTablesBases={activePageTablesBases}> </VirtualMemory>
            </div>
        </SidebarProvider>
    </curRunningPIDContext.Provider>
    )
}

export default App;