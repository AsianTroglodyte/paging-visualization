import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";
import { useMemo, useReducer, useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { zoom, zoomIdentity } from "d3-zoom";
import { select } from "d3-selection";
import { Toaster, toast } from "sonner";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { machineReducer } from "./simulation/machine-reducer";
import { getProcessControlBlocks, getAllProcessPages} from "./simulation/selectors";
import VirtualMemory from "./components/VirtualMemory";
import { FREE_LIST_ADDRESS } from "./simulation/constants";
import { IDLE_CPU_STATE, type MachineState } from "./simulation/types";
import { ControlBarDock } from "./components/control-bar";
import PagingTitle from "./components/paging-title";
import { buildArrowPaths, curveGen, updateArrowPaths as updateArrowPathsFn } from "./lib/arrow-paths";
import GithubLogoIcon from "./assets/github_logo_icon.png";
import type { ActivePageRefs, ArrowPathsRefs } from "./types";

export function App() {

    const [machineState, machineStateDispatch] = useReducer(machineReducer, undefined, (): MachineState => {
        const initialMemory = new Array(64).fill(0);
        initialMemory[FREE_LIST_ADDRESS] = 0b11111100;
        return {
            memory: initialMemory,
            cpu: IDLE_CPU_STATE,
            mmu: { kind: "idle" },
            error: null,
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
    const processMemElRef = useRef<HTMLElement | null>(null);
    const arrowFrameRef = useRef<number | null>(null);
    const isArrowTrackingRef = useRef(false);
    const activeArrowMotionCountRef = useRef(0);

    // when we want to update the arrow paths, we can use the arrowPathsRefs to get the path elements
    const arrowPathsRefs = useRef<ArrowPathsRefs>({
        writeBackPath: useRef<SVGPathElement | null>(null),
        processMemoryAccessPath: useRef<SVGPathElement | null>(null),
        processMemoryAccessHeadPath: useRef<SVGPathElement | null>(null),
        processBracketPath: useRef<SVGPathElement | null>(null),
        osPage0Path: useRef<SVGPathElement | null>(null),
        osPage1Path: useRef<SVGPathElement | null>(null),
    });

    // when we want to update the highling between the virtual and physical memory of the active page, 
    // we can use the activePageRefs to get the virtual and physical memory elements
    const activePageRefs = useRef<ActivePageRefs>({
        virtualMemoryPfn0: useRef<HTMLDivElement | null>(null),
        physicalMemoryPfn0: useRef<HTMLDivElement | null>(null),
        virtualMemoryPfn1: useRef<HTMLDivElement | null>(null),
        physicalMemoryPfn1: useRef<HTMLDivElement | null>(null),
    });

    const runArrowUpdate = useCallback(() => {
        const diagramEl = diagramContainerRef.current;
        if (!diagramEl) return;

        const diagramRect = diagramEl.getBoundingClientRect();
        const pageTableEl = document.getElementById("page-table") as HTMLElement | null;
        if (pageTableEl) {
            const targetRect = pageTableEl.getBoundingClientRect();
            const relX = (targetRect.left - diagramRect.left) / diagramRect.width;
            const relY = (targetRect.top + targetRect.height / 2 - diagramRect.top) / diagramRect.height;
            ptPointRef.current = [relX * VIEWBOX_WIDTH - 20, relY * VIEWBOX_HEIGHT];
        }

        if (!processMemElRef.current || !processMemElRef.current.isConnected) {
            processMemElRef.current = document.getElementById("process-mem") as HTMLElement | null;
        }
        if (!processMemElRef.current) return;

        updateArrowPathsFn(processMemElRef.current, diagramRect, {
            viewBoxWidth: VIEWBOX_WIDTH,
            viewBoxHeight: VIEWBOX_HEIGHT,
            setProcessMemPoint: (p) => { processMemPointRef.current = p; },
            arrowPathsRefs: arrowPathsRefs.current,
            activePageRefs: activePageRefs.current,
        });
    }, []);

    const queueArrowFrame = useCallback(() => {
        if (arrowFrameRef.current != null) return;
        arrowFrameRef.current = requestAnimationFrame(() => {
            arrowFrameRef.current = null;
            runArrowUpdate();
            if (isArrowTrackingRef.current) {
                queueArrowFrame();
            }
        });
    }, [runArrowUpdate]);

    const scheduleArrowUpdateOnce = useCallback(() => {
        queueArrowFrame();
    }, [queueArrowFrame]);

    const startArrowTracking = useCallback(() => {
        if (isArrowTrackingRef.current) return;
        isArrowTrackingRef.current = true;
        queueArrowFrame();
    }, [queueArrowFrame]);

    const stopArrowTracking = useCallback(() => {
        isArrowTrackingRef.current = false;
        if (arrowFrameRef.current != null) {
            cancelAnimationFrame(arrowFrameRef.current);
            arrowFrameRef.current = null;
        }
    }, []);

    // On load: initialize arrow update scheduling and motion listeners.
    useLayoutEffect(() => {
        const diagramEl = diagramContainerRef.current;
        if (!diagramEl) return;

        processMemElRef.current = document.getElementById("process-mem") as HTMLElement | null;

        const onMotionStart = () => {
            activeArrowMotionCountRef.current += 1;
            startArrowTracking();
        };
        const onMotionEnd = () => {
            activeArrowMotionCountRef.current = Math.max(0, activeArrowMotionCountRef.current - 1);
            if (activeArrowMotionCountRef.current === 0) {
                stopArrowTracking();
                scheduleArrowUpdateOnce();
            }
        };

        diagramEl.addEventListener("transitionstart", onMotionStart, true);
        diagramEl.addEventListener("animationstart", onMotionStart, true);
        diagramEl.addEventListener("transitionend", onMotionEnd, true);
        diagramEl.addEventListener("transitioncancel", onMotionEnd, true);
        diagramEl.addEventListener("animationend", onMotionEnd, true);
        diagramEl.addEventListener("animationcancel", onMotionEnd, true);

        window.addEventListener("resize", scheduleArrowUpdateOnce);
        scheduleArrowUpdateOnce();

        return () => {
            window.removeEventListener("resize", scheduleArrowUpdateOnce);
            diagramEl.removeEventListener("transitionstart", onMotionStart, true);
            diagramEl.removeEventListener("animationstart", onMotionStart, true);
            diagramEl.removeEventListener("transitionend", onMotionEnd, true);
            diagramEl.removeEventListener("transitioncancel", onMotionEnd, true);
            diagramEl.removeEventListener("animationend", onMotionEnd, true);
            diagramEl.removeEventListener("animationcancel", onMotionEnd, true);
            activeArrowMotionCountRef.current = 0;
            stopArrowTracking();
        };
    }, [scheduleArrowUpdateOnce, startArrowTracking, stopArrowTracking]);

    // Keep arrows synced after state-driven rerenders.
    useLayoutEffect(() => {
        scheduleArrowUpdateOnce();
    }, [scheduleArrowUpdateOnce, memory, cpu, mmu]);

    // hide os page paths when cpu is idle 
    useEffect(() => {
        if (cpu.kind === "idle") {
            const osPage0Path = arrowPathsRefs.current.osPage0Path.current;
            const osPage1Path = arrowPathsRefs.current.osPage1Path.current;
            if (!osPage0Path || !osPage1Path) return;
            osPage0Path.classList.add("invisible");
            osPage1Path.classList.add("invisible");
        }

        // when we want to update the highling between the virtual and physical memory of the active page, 
        // we can use the activePageRefs to get the virtual and physical memory elements
        if (cpu.kind != "idle") {
            activePageRefs.current.virtualMemoryPfn0.current = 
            document.getElementById(`virtual-memory-0`) as HTMLDivElement | null;
            
            activePageRefs.current.physicalMemoryPfn0.current = 
            document.getElementById(`physical-memory-0`) as HTMLDivElement | null;
            
            activePageRefs.current.virtualMemoryPfn1.current = 
            document.getElementById(`virtual-memory-1`) as HTMLDivElement | null;
            
            activePageRefs.current.physicalMemoryPfn1.current = 
            document.getElementById(`physical-memory-1`) as HTMLDivElement | null;
        }
    }, [cpu]);

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

        const panFraction = 0.35;

        // TODO: maybe unset selection on outside when zooming 
        const zoomBehavior = zoom<HTMLDivElement, unknown>()
            .scaleExtent([0.8, 1.4])
            .constrain((transform) => {
                const rect = container.getBoundingClientRect();
                const k = transform.k;
                if (k <= 0) return transform;
                const diagram = diagramContainerRef.current;
                if (!diagram) return transform;

                const clamp = (value: number, min: number, max: number) =>
                    Math.max(min, Math.min(max, value));

                // Clamp viewport center in world coordinates to diagram bounds.
                const centerWorldX = (rect.width / 2 - transform.x) / k;
                const centerWorldY = (rect.height / 2 - transform.y) / k;

                const diagramLeft = diagram.offsetLeft;
                const diagramTop = diagram.offsetTop;
                const diagramRight = diagramLeft + diagram.offsetWidth;
                const diagramBottom = diagramTop + diagram.offsetHeight;
                const marginWorldX = rect.width * panFraction;
                const marginWorldY = rect.height * panFraction;

                const clampedCenterWorldX = clamp(
                    centerWorldX,
                    diagramLeft - marginWorldX,
                    diagramRight + marginWorldX
                );
                const clampedCenterWorldY = clamp(
                    centerWorldY,
                    diagramTop - marginWorldY,
                    diagramBottom + marginWorldY
                );

                const clampedX = rect.width / 2 - clampedCenterWorldX * k;
                const clampedY = rect.height / 2 - clampedCenterWorldY * k;

                if (
                    clampedX === transform.x &&
                    clampedY === transform.y
                ) {
                    return transform;
                }
                return zoomIdentity.translate(clampedX, clampedY).scale(k);
            })
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
                scheduleArrowUpdateOnce();
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
    }, [scheduleArrowUpdateOnce]);

    // show error toast (page fault, no space for process, etc.)
    useEffect(() => {
        const err = machineState.error;
        if (err) {
            let title: string;
            if (err.kind === "page_fault" && err.virtualAddress != null) {
                title = `Page fault (address ${err.virtualAddress})`;
            } else if (err.kind === "page_fault") {
                title = "Page fault";
            } else {
                title = "Cannot create process";
            }
            toast(title, {
                description: err.message,
                duration: 3000,
            });
            machineStateDispatch({ type: "CLEAR_ERROR" });
        }
    }, [machineState.error]);

    return (
    <SidebarProvider defaultOpen={false} className="flex flex-1 flex-col items-center justify-center select-none">
        <Toaster richColors closeButton position="top-center" toastOptions={{
            duration: 3000,
            classNames: {
                description: "!text-white ",
                title: "!text-white !text-base",
                toast: "!bg-card !text-white !border-none",
            }
        }}/>
        <AppSidebar />

        {/* <a href="https://github.com/AsianTroglodyte/paging-visualization" 
        target="_self" rel="noopener noreferrer"
        className="absolute top-[10px] right-[10px] z-50 flex h-8 w-8 items-center bg-background rounded-full justify-center ">
            <img src={GithubIcon} alt="Github Icon" className="block h-6 w-6" />
        </a> */}

        <a href="https://github.com/AsianTroglodyte/paging-visualization" 
        target="_self" rel="noopener noreferrer"
        className="absolute top-[10px] right-[10px] z-50">
            <img src={GithubLogoIcon} alt="Github Logo Icon" className="block h-7 w-7" />
        </a>

        
        <div
            ref={zoomContainerRef}
            className="pl-1 w-full h-screen overflow-hidden"
            style={{ touchAction: "none" }}>
            <div
                ref={zoomLayerRef}
                className="flex justify-center h-[100rem] max-h-screen gap-4 min-w-0 inline-flex/w-max"
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

                    <div className="absolute top-[40px] left-1/2 -translate-x-1/2 z-10">
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


                    {diagramLabels()}

                    {/* Single SVG overlay for all arrows - spans entire diagram */}
                    {/* viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`} */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none z-30"
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
                            const ip = buildArrowPaths([1070, 135], [1100, 325], mmu.kind === "translated");
                            return (
                                <>
                                    <path id="query-page-table-path" className={"absolute inset z-11"} d={ip.queryPageTable} 
                                    fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path d={ip.queryPageTableHead} className={"absolute inset z-11"}
                                    id="query-page-table-head-path"
                                    fill="currentColor" stroke="currentColor" strokeWidth="1"/>
                                    <path d={ip.pageTableReturn} className={"z-11"}
                                    id="page-table-return-path"
                                    fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M730 265 L745 259 L745 271 Z" className={"z-11"}
                                    id="page-table-return-head-path"
                                    fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                    <path ref={arrowPathsRefs.current.processMemoryAccessPath} id="process-memory-access-path" className={"absolute z-11"}
                                    d={ip.processMemoryAccess} fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path ref={arrowPathsRefs.current.processMemoryAccessHeadPath} id="process-memory-access-head-path" className={"z-11"} 
                                    d={ip.processMemoryAccessHead} fill="currentColor" stroke="currentColor" strokeWidth="1"/>
                                    <path ref={arrowPathsRefs.current.writeBackPath} id="write-back-path" className={"z-11"}
                                    d={ip.writeBack} fill="none" strokeDasharray="3,3" stroke="currentColor" strokeWidth="1"/>
                                    <path d="M385 190 L400 184 L400 196 Z" 
                                    className={"absolute z-11"} fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                    <path ref={arrowPathsRefs.current.processBracketPath} id="process-bracket-path" className={"z-11"} d={ip.processBracketPoints} 
                                    fill="none" stroke="currentColor" strokeWidth="1"/>
                                </>
                            );
                        })()}

                    </svg>
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none z-0"
                        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                        preserveAspectRatio="none">
                        {(() => {
                            return (
                                <>
                                    <path ref={arrowPathsRefs.current.osPage0Path} id="os-page-0-path" d={"M1100 160 L1100 200 L745 271 Z"} 
                                    className="invisible z-11" fill="white" opacity="0.1" strokeWidth="1" />
                                    <path ref={arrowPathsRefs.current.osPage1Path} id="os-page-1-path" d={"M1100 220 L1100 260 L745 331 Z"} 
                                    className="invisible z-11" fill="white" opacity="0.1" strokeWidth="1" />
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
)}

export default App;



function diagramLabels() {
    return (
    <>
    <p className="absolute top-[6rem] left-[26rem] text-[0.6rem] text-muted-foreground">
        1. Send Virtual <br /> Address and PTB <br />  address to MMU
    </p>

    <p className="absolute top-[6rem] left-[59rem] text-[0.6rem] text-muted-foreground">
        2. Use PTB to find PT. <br/> use VPN to index PTE
    </p>

    <p className="absolute top-[15rem] left-[56rem] text-[0.6rem] text-muted-foreground">
        3. Extract PFN from PTE. <br/>MMU gets PFN.
    </p>

    <p className="absolute top-[21.5rem] left-[56rem] text-[0.6rem] text-muted-foreground">
        4. Use PFN to get <br/> page frame. Use <br/> offset to get <br/> byte.
    </p>

    <p className="absolute top-[29.5rem] left-[45rem] text-[0.6rem] text-muted-foreground">
        5. Write back to CPU.
    </p>

    </>
    )
}
