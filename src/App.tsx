import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useReducer, useState, useEffect, useRef } from "react";
import { zoom, zoomIdentity } from "d3-zoom";
import { select } from "d3-selection";
import { Toaster, toast } from "sonner";
import { SidebarProvider } from "./components/ui/sidebar";
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
            mmu: {
                virtualPageNumber: 0,
                pageFrameNumber: 0,
                offset: 0,
            },
            pageFault: null,
        };
    });


    const memory = machineState.memory;
    const cpu = machineState.cpu;
    const mmu = machineState.mmu;

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


    const [selectedVirtualAddress, setSelectedVirtualAddress] = useState<number | null>(null);
    const zoomContainerRef = useRef<HTMLDivElement>(null);
    const zoomLayerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const container = zoomContainerRef.current;
        const layer = zoomLayerRef.current;
        if (!container || !layer) return;

        let nextTransform = zoomIdentity;

        const applyTransform = () => {
            frameRef.current = null;
            layer.style.transform = `translate(${nextTransform.x}px, ${nextTransform.y}px) scale(${nextTransform.k})`;
        };

        const zoomBehavior = zoom<HTMLDivElement, unknown>()
            .scaleExtent([0.6, 3])
            .on("zoom", (event) => {
                nextTransform = event.transform;
                if (frameRef.current == null) {
                    frameRef.current = requestAnimationFrame(applyTransform);
                }
            });
        const containerSelection = select(container);
        containerSelection.call(zoomBehavior).call(zoomBehavior.transform, zoomIdentity);
        layer.style.transform = "translate(0px, 0px) scale(1)";
        return () => {
            containerSelection.on(".zoom", null);
            if (frameRef.current != null) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const fault = machineState.pageFault;
        if (fault) {
            const detail = fault.virtualAddress != null ? ` (address ${fault.virtualAddress})` : "";
            toast.error(`Page fault${detail}`, { description: fault.message });
            machineStateDispatch({ type: "CLEAR_PAGE_FAULT" });
        }
    }, [machineState.pageFault]);

    return (
        <SidebarProvider>
            <Toaster richColors position="top-center" />
            <AppSidebar 
                machineStateDispatch={machineStateDispatch}
                processControlBlocks={processControlBlocks}
                runningPid={cpu.kind === "running" ? cpu.runningPid : null}
            />
            <div
                ref={zoomContainerRef}
                className="py-10 pl-1 w-full min-h-screen overflow-hidden bg-black/30"
                style={{ touchAction: "none" }}
            >
                <div
                    ref={zoomLayerRef}
                    className="flex flex-3 flex items-start gap-4 min-w-0 inline-flex/w-max"
                    style={{
                        transformOrigin: "0 0",
                        willChange: "transform",
                    }}
                >
                <CpuCard cpu={cpu} 
                machineStateDispatch={machineStateDispatch} 
                selectedVirtualAddress={selectedVirtualAddress}
                setSelectedVirtualAddress={setSelectedVirtualAddress}
                className="" />

                <MmuCard mmu={mmu} className="" />

                <MemoryCard className="row-span-2" 
                processControlBlocks={processControlBlocks} 
                allProcessPages={allProcessPages} 
                memory={memory}
                runningPid={cpu.kind === "running" ? cpu.runningPid : null} />

                <VirtualMemory 
                memory={memory} 
                processControlBlocks={processControlBlocks}
                selectedVirtualAddress={selectedVirtualAddress}
                setSelectedVirtualAddress={setSelectedVirtualAddress}
                cpu={cpu} />
                </div>
            </div>
        </SidebarProvider>
    )
}

export default App;