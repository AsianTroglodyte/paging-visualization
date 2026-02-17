import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useReducer} from "react";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { machineReducer } from "./simulation/machine-reducer";
import { getProcessControlBlocks, getAllPageTables, getAllProcessPages, getFreeList } from "./simulation/selectors";
import VirtualMemory from "./components/VirtualMemory";
import { FREE_LIST_ADDRESS } from "./simulation/constants";
import { IDLE_CPU_STATE } from "./simulation/types";


export function App() {

    const [machineState, machineStateDispatch] = useReducer(machineReducer, undefined, () => {
        const initialMemory = new Array(64).fill(0);
        initialMemory[FREE_LIST_ADDRESS] = 0b11111100;
        return {
            memory: initialMemory,
            cpu: IDLE_CPU_STATE,
        };
    });


    const memory = machineState.memory;
    const cpu = machineState.cpu;

    // derived memory view used for more convenient parsing of data and for the UI view
    const freeList = useMemo(() => {
        return getFreeList(memory);
    }, [memory]);

    const processControlBlocks = useMemo(() => {
        return getProcessControlBlocks(memory);
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
                processControlBlocks={processControlBlocks}
                runningPid={cpu.kind === "running" ? cpu.runningPid : null}
            />
            <SidebarTrigger className="" size="lg" />

            <div className="py-10  pl-1 w-full h-full flex flex-3 flex items-start gap-4">

                <CpuCard cpu={cpu} machineStateDispatch={machineStateDispatch}></CpuCard>
                <MmuCard></MmuCard>
                <MemoryCard className="row-span-2" 
                processControlBlocks={processControlBlocks} 
                allProcessPages={allProcessPages} 
                memory={memory}></MemoryCard>
                <VirtualMemory 
                memory={memory} 
                processControlBlocks={processControlBlocks} 
                cpu={cpu} 
                machineStateDispatch={machineStateDispatch} />
            </div>
        </SidebarProvider>
    )
}

export default App;