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
import { ControlBar } from "./components/control-bar";


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

    const [isControlBarOpen, setIsControlBarOpen] = useState(false);


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

    useEffect(() => {
        const fault = machineState.pageFault;
        if (fault) {
            const detail = fault.virtualAddress != null ? ` (address ${fault.virtualAddress})` : "";
            toast.error(`Page fault${detail}`, { description: fault.message });
            machineStateDispatch({ type: "CLEAR_PAGE_FAULT" });
        }
    }, [machineState.pageFault]);

    return (
        <SidebarProvider defaultOpen={false}>
            <Toaster richColors position="top-center" />
            <AppSidebar 
                machineStateDispatch={machineStateDispatch}
                processControlBlocks={processControlBlocks}
                runningPid={cpu.kind === "running" ? cpu.runningPid : null}
            />
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
                    }}
                >
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 font-bold
            flex items-center justify-center bg-black text-white rounded-b-[16px] primary-color"
            style={{ clipPath: "url(#paging-bar-clip)" }} >
                <h1 className="text-base">Paging</h1>
            </div>

            {/* Control Bar */}
            <div
                className={`
                    flex flex-col items-center 
                    fixed bottom-0 left-1/2 z-50 
                    -translate-x-1/2 transform-gpu transition-transform duration-300 
                    ease-out will-change-transform ${
                    isControlBarOpen
                        ? "translate-y-0"
                        : "translate-y-[calc(100%-2.25rem)]"
                }`}>
                <button
                    type="button"
                    onClick={() => setIsControlBarOpen((prev) => !prev)}
                    className="flex h-10 w-30 items-center justify-center gap-2 
                    rounded-t-md border border-b-0 bg-primary px-3 text-primary-foreground">
                    <svg
                        className={`h-5 w-5 transition-transform duration-300 ${
                            isControlBarOpen ? "rotate-180" : "rotate-0"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M17 18L12 13L7 18M17 11L12 6L7 11"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"/>
                    </svg>
                    <span className="text-base font-semibold font-mono">Control</span>
                </button>
                <ControlBar
                    machineStateDispatch={machineStateDispatch}
                    processControlBlocks={processControlBlocks}
                    runningPid={cpu.kind === "running" ? cpu.runningPid : null}
                    className="rounded-t-none"/>
            </div>

        </SidebarProvider>
    )
}

export default App;