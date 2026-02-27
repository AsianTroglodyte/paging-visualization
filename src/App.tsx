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
import { ArcherContainer, ArcherElement } from 'react-archer';

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
    // const archerContainerRef = useRef<HTMLDivElement>(null);

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
        <SidebarProvider defaultOpen={false} className="flex flex-1 flex-col items-center justify-center">
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
                className="py-10 pl-1 w-full h-screen  overflow-hidden  bg-black/30"
                style={{ touchAction: "none" }}>
                <div
                    ref={zoomLayerRef}
                    className="flex flex-3 flex items-start gap-4 min-w-0 inline-flex/w-max"
                    style={{
                        transformOrigin: "0 0",
                        willChange: "transform",
                    }}>
                    <ArcherContainer
                        strokeColor="white"
                        strokeWidth={2}
                        offset={8}
                        lineStyle="curve"
                        className="h-screen min-h-[40rem] w-full min-w-[90rem] max-w-[110rem] mx-auto relative">
                        <div className="flex flex-col gap-3 justify-center items-center absolute left-[2rem] top-0">
                            <ArcherElement
                                id="cpu"
                                relations={[{
                                    targetId: 'mmu',
                                    sourceAnchor: 'right',
                                    targetAnchor: 'left',
                                    label: <span className="text-xs relative top-[-55px] ">Virtual address & PTB</span>,
                                }]}>
                                <div>
                                    <CpuCard cpu={cpu}
                                        machineStateDispatch={machineStateDispatch}
                                        selectedVirtualAddress={selectedVirtualAddress}
                                        setSelectedVirtualAddress={setSelectedVirtualAddress}
                                        className="" />
                                </div>
                            </ArcherElement>

                            <VirtualMemory
                                memory={memory}
                                processControlBlocks={processControlBlocks}
                                selectedVirtualAddress={selectedVirtualAddress}
                                setSelectedVirtualAddress={setSelectedVirtualAddress}
                                cpu={cpu}
                                className="" />
                        </div>

                        <ArcherElement id="mmu"
                        relations={[
                            {
                                targetId: 'page-table',
                                sourceAnchor: 'right',
                                targetAnchor: 'left',
                                label: <span className="text-xs relative top-[-50px]">Queries PT using PTB to get PFN from VPN</span>,
                                order: 1,
                                style: { startMarker: true, endMarker: true}
                            }, {
                                targetId: 'memory',
                                sourceAnchor: 'right',
                                targetAnchor: 'left',
                                label: <span className="text-xs relative top-[35px]">Uses physical address to access memory</span>,
                                order: 1,
                                style: { startMarker: false, endMarker: true}
                            }
                        ]}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2">
                                <MmuCard mmu={mmu} className="" />
                            </div>
                        </ArcherElement>


                        <ArcherElement id="memory">
                            <div className="absolute top-0 right-[2rem]">
                                <MemoryCard
                                    className="row-span-2"
                                    processControlBlocks={processControlBlocks}
                                    allProcessPages={allProcessPages}
                                    memory={memory}
                                    runningPid={cpu.kind === "running" ? cpu.runningPid : null} />
                            </div>
                        </ArcherElement>
                    </ArcherContainer>
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