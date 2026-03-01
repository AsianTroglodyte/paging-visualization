import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useReducer, useState, useEffect, useLayoutEffect, useRef } from "react";
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
import { line, curveCatmullRom } from 'd3-shape';

const curveGen = line<[number, number]>().curve(curveCatmullRom.alpha(0.5));

function buildArrowPaths(
    ptPoint: [number, number],
    processMemPoint: [number, number],
    mmuTranslated: boolean
) {
    const queryPT = mmuTranslated ? ptPoint : ([1110, 135] as [number, number]);
    const queryPageTablePoints: [number, number][] = [[735, 245], [900, 220], queryPT];
    const pageTableReturnPoints: [number, number][] = [[735, 265], [900, 240], queryPT];
    const processMemoryAccessPoints: [number, number][] = [[850, 340], [1000, 340], processMemPoint];
    const writeBackPoints: [number, number][] = [processMemPoint, [900, 440], [500, 440], [450, 200], [400, 190]];

    return {
        queryPageTable: curveGen(queryPageTablePoints) ?? "",
        queryPageTableHead: `M${queryPT[0] + 15} ${queryPT[1]} L${queryPT[0]} ${queryPT[1] - 6} L${queryPT[0]} ${queryPT[1] + 6} Z`,
        pageTableReturn: curveGen(pageTableReturnPoints) ?? "",
        processMemoryAccess: curveGen(processMemoryAccessPoints) ?? "",
        processMemoryAccessHead: `M${processMemPoint[0] + 15} ${processMemPoint[1]} L${processMemPoint[0]} ${processMemPoint[1] - 6} L${processMemPoint[0]} ${processMemPoint[1] + 6} Z`,
        writeBack: curveGen(writeBackPoints) ?? "",
    };
}

export function App() {

    const [machineState, machineStateDispatch] = useReducer(machineReducer, undefined, () => {
        const initialMemory = new Array(64).fill(0);
        initialMemory[FREE_LIST_ADDRESS] = 0b11111100;
        return {
            memory: initialMemory,
            cpu: IDLE_CPU_STATE,
            mmu: {
                kind: "idle",
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
    const diagramContainerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);

    const VIEWBOX_WIDTH = 1440;
    const VIEWBOX_HEIGHT = 1000;

    // Arrow anchor points in SVG space, measured once on mount
    // const [ptPoint, setPtPoint] = useRef<[number, number] | null>(null);
    // const [processMemPoint, setProcessMemPoint] = useRef<[number, number] | null>(null);
    const ptPointRef = useRef<[number, number] | null>(null);
    const processMemPointRef = useRef<[number, number] | null>(null);

    // One-time measurement of page table and process memory positions
    useLayoutEffect(() => {
        const diagramEl = diagramContainerRef.current;
        if (!diagramEl) return;

        const diagramRect = diagramEl.getBoundingClientRect();

        const pageTableEl = document.querySelector("#page-table") as HTMLElement | null;
        const pageTableCallback = (pageTableEl: HTMLElement) => {
            const targetRect = pageTableEl.getBoundingClientRect();
            const relX = (targetRect.left - diagramRect.left) / diagramRect.width;
            const relY = (targetRect.top + targetRect.height / 2 - diagramRect.top) / diagramRect.height;
            ptPointRef.current = [relX * VIEWBOX_WIDTH - 20, relY * VIEWBOX_HEIGHT];
        }

        if (pageTableEl) pageTableCallback(pageTableEl);

        const processMemEl = document.querySelector("#process-mem") as HTMLElement | null;
        const processMemCallback = (processMemEl: HTMLElement) =>  {
            console.log("callback called");
            const processMemRect = processMemEl.getBoundingClientRect();
            const relX = (processMemRect.left - diagramRect.left) / diagramRect.width;
            const relY = (processMemRect.top + processMemRect.height / 2 - diagramRect.top) / diagramRect.height;
            processMemPointRef.current = [relX * VIEWBOX_WIDTH - 60, relY * VIEWBOX_HEIGHT];
            

            // update write back path using querySelector and setAttribute
            const writeBackPath = document.getElementById("write-back-path") as SVGPathElement | null;
            if (writeBackPath) {
                writeBackPath.setAttribute("d", curveGen([processMemPointRef.current, [900, 440], [500, 440], [450, 200], [400, 190]]) ?? "");
            }
            const writeBackHeadPath = document.getElementById("write-back-head-path") as SVGPathElement | null;
            if (writeBackHeadPath) {
                writeBackHeadPath.setAttribute("d", `M${processMemPointRef.current[0] + 15} ${processMemPointRef.current[1]} L${processMemPointRef.current[0]} ${processMemPointRef.current[1] - 6} L${processMemPointRef.current[0]} ${processMemPointRef.current[1] + 6} Z`);
            }

            // update process memory access path using querySelector and setAttribute
            const processMemoryAccessPath = document.getElementById("process-memory-access-path") as SVGPathElement | null;
            if (processMemoryAccessPath) {
                processMemoryAccessPath.setAttribute("d", curveGen([processMemPointRef.current, [1000, 340], [850, 340]]) ?? "");
            }
            const processMemoryAccessHeadPath = document.getElementById("process-memory-access-head-path") as SVGPathElement | null;
            if (processMemoryAccessHeadPath) {
                processMemoryAccessHeadPath.setAttribute("d", `M${processMemPointRef.current[0] + 15} ${processMemPointRef.current[1]} L${processMemPointRef.current[0]} ${processMemPointRef.current[1] - 6} L${processMemPointRef.current[0]} ${processMemPointRef.current[1] + 6} Z`);
            }
        }

        if (processMemEl) processMemCallback(processMemEl);

        const memoryCardEl = document.querySelector("#memory-card") as HTMLElement | null;

        const memoryResizeObserver = new ResizeObserver(() => {
            if (processMemEl !== null) requestAnimationFrame(() => processMemCallback(processMemEl));
        });

        if (memoryCardEl) memoryResizeObserver.observe(memoryCardEl);
        else throw new Error("Memory card element not found");

        return () => {
            memoryResizeObserver.disconnect();
        };

    }, []);


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
            className="pl-1 w-full h-screen bg-black/30 overflow-hidden"
            style={{ touchAction: "none" }}>
            <div
                ref={zoomLayerRef}
                className="flex flex-3 flex items-start h-[100rem] max-h-screen gap-4 min-w-0 inline-flex/w-max"
                style={{
                    transformOrigin: "0 0",
                    willChange: "transform",
                }}>
                <div
                    ref={diagramContainerRef}
                    className="h-[1000px] min-h-[1000px] min-w-[90rem] w-[90rem] relative">
                    <div className="flex flex-col gap-3 justify-center items-center absolute left-[2rem] top-[40px]">
                        <CpuCard cpu={cpu}
                            machineStateDispatch={machineStateDispatch}
                            selectedVirtualAddress={selectedVirtualAddress}
                            setSelectedVirtualAddress={setSelectedVirtualAddress}
                            className="" 
                            />

                        <VirtualMemory
                            memory={memory}
                            processControlBlocks={processControlBlocks}
                            selectedVirtualAddress={selectedVirtualAddress}
                            setSelectedVirtualAddress={setSelectedVirtualAddress}
                            cpu={cpu}
                            className="" />
                    </div>

                    <div className="absolute top-[40px] left-1/2 -translate-x-1/2 ">
                        <MmuCard mmu={mmu} className="" />
                    </div>

                    <div className="absolute top-[40px] right-[2rem]">
                        <MemoryCard
                            className="row-span-2"
                            processControlBlocks={processControlBlocks}
                            allProcessPages={allProcessPages}
                            memory={memory}
                            runningPid={cpu.kind === "running" ? cpu.runningPid : null} 
                            mmu={mmu}
                            cpu={cpu}
                            />
                    </div>

                    {/* Single SVG overlay for all arrows - spans entire diagram */}
                    {/* viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`} */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                        preserveAspectRatio="none">
                        <path
                            d={curveGen([[400, 150], [540, 170]]) ?? ""}
                            fill="none"
                            strokeDasharray="3,3"
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                        <path d="M555 170 L540 164 L540 177 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />

                        {(() => {
                            const pt = ptPointRef.current ?? [1110, 135];
                            const pm = processMemPointRef.current ?? [1100, 325];
                            const ip = buildArrowPaths(pt, pm, mmu.kind === "translated");
                            return (
                                <>
                                    <path d={ip.queryPageTable} fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path d={ip.queryPageTableHead} fill="currentColor" stroke="currentColor" strokeWidth="1"/>
                                    <path d={ip.pageTableReturn} fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M730 265 L745 259 L745 271 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                    <path id="process-memory-access-path" d={ip.processMemoryAccess} fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path id="process-memory-access-head-path" d={ip.processMemoryAccessHead} fill="currentColor" stroke="currentColor" strokeWidth="1"/>
                                    <path id="write-back-path" d={ip.writeBack} fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path id="write-back-head-path" d="M385 190 L400 184 L400 196 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                </>
                            );
                        })()}
                    </svg>
                </div>
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



