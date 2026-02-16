import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useReducer} from "react";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { machineReducer, getInitialMachineState } from "./simulation/machine-reducer";
import { getActivePageTablesBases, getAllPageTables, getAllProcessPages, getFreeList } from "./simulation/selectors";
import VirtualMemory from "./components/VirtualMemory";


export function App() {

    const [machineState, machineStateDispatch] = useReducer(
        machineReducer,
        null,
        getInitialMachineState
    );

    const memory = machineState.memory;
    const cpu = machineState.cpu;

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
        return getAllProcessPages(memory);
    }, [memory]);





    return (
        <SidebarProvider>
            <AppSidebar 
                machineStateDispatch={machineStateDispatch}
                activePageTablesBases={activePageTablesBases}
                runningPid={cpu.runningPid}
            />
            <SidebarTrigger className="" size="lg" />

            <div className="py-10  pl-1 w-full h-full flex flex-3 flex items-start gap-4">

                <CpuCard cpu={cpu}></CpuCard>
                <MmuCard></MmuCard>
                <MemoryCard className="row-span-2" 
                activePageTablesBases={activePageTablesBases} 
                allProcessPages={allProcessPages} 
                machineState={memory}></MemoryCard>
                <VirtualMemory machineState={memory} activePageTablesBases={activePageTablesBases}> </VirtualMemory>
            </div>
        </SidebarProvider>
    )
}

export default App;