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
import { getProcessControlBlocks, getAllProcessPages } from "./simulation/selectors";
import VirtualMemory from "./components/VirtualMemory";
import { FREE_LIST_ADDRESS } from "./simulation/constants";
import { IDLE_CPU_STATE } from "./simulation/types";
import { ControlBarDock } from "./components/control-bar";
import PagingTitle from "./components/paging-title";

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

    const processControlBlocks = useMemo(() => {
        return getProcessControlBlocks(memory);
    }, [memory]);

    const allProcessPages = useMemo(() => {
        return getAllProcessPages(memory);
    }, [memory]);

    const [isControlBarOpen, setIsControlBarOpen] = useState(false);


    const [selectedVirtualAddress, setSelectedVirtualAddress] = useState<number | null>(null);
    const zoomContainerRef = useRef<HTMLDivElement>(null);
    const zoomLayerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);

    // setup zoom and panning
    useEffect(() => {
        const container = zoomContainerRef.current;
        const layer = zoomLayerRef.current;
        if (!container || !layer) return;

        let nextTransform = zoomIdentity;

        const applyTransform = () => {
            frameRef.current = null;
            layer.style.transform = `translate(${nextTransform.x}px, ${nextTransform.y}px) scale(${nextTransform.k})`;
        };

        // TODO: maybe unset selection on outside when zooming 
        const zoomBehavior = zoom<HTMLDivElement, unknown>()
            .scaleExtent([0.8, 1.4])
            .filter((event) => {
                const target = event?.target as HTMLElement | null;
                if (!target?.closest) return true;
                return !target.closest(
                    "button, input, select, textarea, a, [contenteditable], [data-no-zoom]"
                );
            })
            .on("zoom", (event) => {
                nextTransform = event.transform;
                if (frameRef.current == null) {
                    frameRef.current = requestAnimationFrame(applyTransform);
                }
            })
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

    // show page fault toast
    useEffect(() => {
        const fault = machineState.pageFault;
        if (fault) {
            const detail = fault.virtualAddress != null ? ` (address ${fault.virtualAddress})` : "";
            // toast.error(`Page fault${detail}`, { description: fault.message });
            toast(`Page fault${detail}`, { 
                description: fault.message,
            });
            machineStateDispatch({ type: "CLEAR_PAGE_FAULT" });
        }
    }, [machineState.pageFault]);

    return (
        <SidebarProvider defaultOpen={false}>
            <Toaster richColors position="top-center" toastOptions={{
                classNames: {
                    description: "!text-white !font-mono",
                    title: "!text-white !font-mono !text-base",
                    toast: "!bg-card !text-white !border-none",
                }
            }}/>
            <AppSidebar />
            <div
                ref={zoomContainerRef}
                className="py-10 pl-1 w-full min-h-screen max-h-screen overflow-hidden bg-black/30"
                style={{ touchAction: "none" }}>
                <div
                    ref={zoomLayerRef}
                    className="flex flex-3 flex items-start gap-4 min-w-0 inline-flex/w-max"
                    style={{
                        transformOrigin: "0 0",
                        willChange: "transform",
                    }}>
                    <div className="flex flex-col gap-3 justify-center items-center absolute left-[2rem] top-0">
                        <CpuCard cpu={cpu} 
                        machineStateDispatch={machineStateDispatch} 
                        selectedVirtualAddress={selectedVirtualAddress}
                        setSelectedVirtualAddress={setSelectedVirtualAddress}
                        className="" />

                        <VirtualMemory 
                        memory={memory} 
                        processControlBlocks={processControlBlocks}
                        selectedVirtualAddress={selectedVirtualAddress}
                        setSelectedVirtualAddress={setSelectedVirtualAddress}
                        cpu={cpu} 
                        className=""/>
                    </div>

                    <MmuCard mmu={mmu} 
                    className="absolute top-0 left-1/2 -translate-x-1/2 "/>

                    <MemoryCard className="row-span-2 absolute right-[2rem] top-0" 
                    processControlBlocks={processControlBlocks} 
                    allProcessPages={allProcessPages} 
                    memory={memory}
                    runningPid={cpu.kind === "running" ? cpu.runningPid : null} />

                </div>
            </div>

            {/* Title */}
            <PagingTitle />

            {/* Control Bar */}
            <ControlBarDock
                isOpen={isControlBarOpen}
                toggle={() => setIsControlBarOpen((prev) => !prev)}
                machineStateDispatch={machineStateDispatch}
                processControlBlocks={processControlBlocks}
                runningPid={cpu.kind === "running" ? cpu.runningPid : null}
            />

        </SidebarProvider>
    )
}

export default App;