import { line, curveCatmullRom } from "d3-shape";
import type { ActivePageRefs, ArrowPathsRefs } from "@/types";

// this is the offset creates a slight overlap between paths that map active virtual 
// to their physical memory pages counterparts. This overlaps helps to create a visual distinction 
// between parallel paths, making it easier to understand the mapping relationship.
const PAGE_SHADING_OFFSET = 1.5;

export const curveGen = line<[number, number]>().curve(curveCatmullRom.alpha(0.5));
const lineGen = line<[number, number]>();

export interface UpdateArrowPathsOptions {
    viewBoxWidth: number;
    viewBoxHeight: number;
    setProcessMemPoint: (point: [number, number]) => void;
    arrowPathsRefs: ArrowPathsRefs;
    activePageRefs: ActivePageRefs;
}

export function updateArrowPaths(
    el: HTMLElement,
    diagramRect: DOMRect,
    options: UpdateArrowPathsOptions,
) {
    const { viewBoxWidth, viewBoxHeight, setProcessMemPoint, arrowPathsRefs, activePageRefs } = options;
    const processMemRect = el.getBoundingClientRect();
    const relX = (processMemRect.left - diagramRect.left) / diagramRect.width;
    const relY = (processMemRect.top + processMemRect.height / 2 - diagramRect.top) / diagramRect.height;

    // index zero is the x coordinate, index one is the y coordinate
    const pt: [number, number] = [relX * viewBoxWidth - 60, relY * viewBoxHeight];
    setProcessMemPoint(pt);

    // update write back path
    const writeBackPath = arrowPathsRefs.writeBackPath.current;
    if (writeBackPath) writeBackPath.setAttribute("d", curveGen([pt, [900, 440], [500, 440], [450, 200], [400, 190]]) ?? "");

    // update process memory access path
    const processMemoryAccessPath = arrowPathsRefs.processMemoryAccessPath.current;
    if (processMemoryAccessPath) {
        // Keep point order stable to avoid visible shifts during updates.
        processMemoryAccessPath.setAttribute("d", curveGen([[850, 340], [1000, 340], pt]) ?? "");
    }

    // update process memory access head path (triangle: base, tip-top, tip-bottom, close)
    const processMemoryAccessHeadPath = arrowPathsRefs.processMemoryAccessHeadPath.current;
    if (processMemoryAccessHeadPath) {
        // Keep head geometry stable so re-measured updates do not jump.
        processMemoryAccessHeadPath.setAttribute("d", `M${pt[0] + 15} ${pt[1]} L${pt[0]} ${pt[1] - 6} L${pt[0]} ${pt[1] + 6} Z`);
    }


    const topBracketPoint = (processMemRect.top - diagramRect.top) / diagramRect.height * viewBoxHeight;
    const bottomBracketPoint = (processMemRect.top + processMemRect.height - diagramRect.top) / diagramRect.height * viewBoxHeight;
    const bracktXPoint = ((processMemRect.left - diagramRect.left) / diagramRect.width * viewBoxWidth) - 30;

    // update process bracket path
    const processBracketPath = arrowPathsRefs.processBracketPath.current;
    if (processBracketPath) processBracketPath.setAttribute("d", 
        lineGen([[bracktXPoint + 10, topBracketPoint], 
            [bracktXPoint, topBracketPoint], 
            [bracktXPoint, bottomBracketPoint], 
            [bracktXPoint + 10, bottomBracketPoint]]) ?? "");


    const virtualMemoryPfn0 = activePageRefs.virtualMemoryPfn0.current;
    const physicalMemoryPfn0 = activePageRefs.physicalMemoryPfn0.current;
    const osPage0Path = arrowPathsRefs.osPage0Path.current;
    const osPage1Path = arrowPathsRefs.osPage1Path.current;
    if (!osPage0Path || !osPage1Path) return;

    if (virtualMemoryPfn0 && physicalMemoryPfn0) {
        // virtual memory dimensions
        const virtualMemoryPfn0Rect = virtualMemoryPfn0.getBoundingClientRect();
        const virtualMemoryPfn0RelX = (virtualMemoryPfn0Rect.right - diagramRect.left) / diagramRect.width;
        const virtualMemoryPfn0RelY = (virtualMemoryPfn0Rect.top - diagramRect.top) / diagramRect.height;
        const virtualMemoryPfn0Height = (virtualMemoryPfn0Rect.height / diagramRect.height) * viewBoxHeight;

        const virtualMemoryPfn0Point: [number, number] = [virtualMemoryPfn0RelX * viewBoxWidth, virtualMemoryPfn0RelY * viewBoxHeight];

        // physical memory dimensions
        const physicalMemoryPfn0Rect = physicalMemoryPfn0.getBoundingClientRect();
        const physicalMemoryPfn0RelX = (physicalMemoryPfn0Rect.left - diagramRect.left) / diagramRect.width;
        const physicalMemoryPfn0RelY = (physicalMemoryPfn0Rect.top - diagramRect.top) / diagramRect.height;
        const physicalMemoryPfn0Height = (physicalMemoryPfn0Rect.height / diagramRect.height) * viewBoxHeight;

        const physicalMemoryPfn0Point: [number, number] = [physicalMemoryPfn0RelX * viewBoxWidth, physicalMemoryPfn0RelY * viewBoxHeight];

        const path = lineGen([
            [virtualMemoryPfn0Point[0], virtualMemoryPfn0Point[1]], 
            [virtualMemoryPfn0Point[0], virtualMemoryPfn0Point[1] + virtualMemoryPfn0Height + PAGE_SHADING_OFFSET],
            [physicalMemoryPfn0Point[0], physicalMemoryPfn0Point[1] + physicalMemoryPfn0Height + PAGE_SHADING_OFFSET],
            [physicalMemoryPfn0Point[0], physicalMemoryPfn0Point[1]]]);

        osPage0Path.setAttribute("d", path ?? "");
    }

    const virtualMemoryPfn1 = activePageRefs.virtualMemoryPfn1.current;
    const physicalMemoryPfn1 = activePageRefs.physicalMemoryPfn1.current;

    if (virtualMemoryPfn1 && physicalMemoryPfn1) {
        const virtualMemoryPfn1Rect = virtualMemoryPfn1.getBoundingClientRect();
        const virtualMemoryPfn1RelX = (virtualMemoryPfn1Rect.right - diagramRect.left) / diagramRect.width;
        const virtualMemoryPfn1RelY = (virtualMemoryPfn1Rect.top - diagramRect.top) / diagramRect.height;
        const virtualMemoryPfn1Height = (virtualMemoryPfn1Rect.height / diagramRect.height) * viewBoxHeight;

        const virtualMemoryPfn1Point: [number, number] = [virtualMemoryPfn1RelX * viewBoxWidth, virtualMemoryPfn1RelY * viewBoxHeight];

        const physicalMemoryPfn1Rect = physicalMemoryPfn1.getBoundingClientRect();
        const physicalMemoryPfn1RelX = (physicalMemoryPfn1Rect.left - diagramRect.left) / diagramRect.width;
        const physicalMemoryPfn1RelY = (physicalMemoryPfn1Rect.top - diagramRect.top) / diagramRect.height;
        const physicalMemoryPfn1Height = (physicalMemoryPfn1Rect.height / diagramRect.height) * viewBoxHeight;

        const physicalMemoryPfn1Point: [number, number] = [physicalMemoryPfn1RelX * viewBoxWidth, physicalMemoryPfn1RelY * viewBoxHeight];

        const path = lineGen([
            [virtualMemoryPfn1Point[0], virtualMemoryPfn1Point[1] - PAGE_SHADING_OFFSET], 
            [virtualMemoryPfn1Point[0], virtualMemoryPfn1Point[1] + virtualMemoryPfn1Height],
            [physicalMemoryPfn1Point[0], physicalMemoryPfn1Point[1] + physicalMemoryPfn1Height],
            [physicalMemoryPfn1Point[0], physicalMemoryPfn1Point[1] - PAGE_SHADING_OFFSET]]);

        osPage1Path.setAttribute("d", path ?? "");
    }
}


