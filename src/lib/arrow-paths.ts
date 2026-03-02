import { line, curveCatmullRom } from "d3-shape";

export const curveGen = line<[number, number]>().curve(curveCatmullRom.alpha(0.5));
const lineGen = line<[number, number]>();
export function buildArrowPaths(
    ptPoint: [number, number],
    processMemPoint: [number, number],
    mmuTranslated: boolean
) {
    const queryPT = mmuTranslated ? ptPoint : ([1070, 135] as [number, number]);
    const queryPageTablePoints: [number, number][] = [[735, 245], [900, 220], queryPT];
    const pageTableReturnPoints: [number, number][] = [[735, 265], [900, 240], queryPT];
    const processMemoryAccessPoints: [number, number][] = [[850, 340], [1000, 340], processMemPoint];
    const writeBackPoints: [number, number][] = [processMemPoint, [900, 440], [500, 440], [450, 200], [400, 190]];
    const processBracketPoints: [number, number][] = [[1110, 205], [1100, 205], [1100, 475], [1110, 475]];

    return {
        queryPageTable: curveGen(queryPageTablePoints) ?? "",
        queryPageTableHead: `M${queryPT[0] + 15} ${queryPT[1]} L${queryPT[0]} ${queryPT[1] - 6} L${queryPT[0]} ${queryPT[1] + 6} Z`,
        pageTableReturn: curveGen(pageTableReturnPoints) ?? "",
        processMemoryAccess: curveGen(processMemoryAccessPoints) ?? "",
        processMemoryAccessHead: `M${processMemPoint[0] + 15} ${processMemPoint[1]} L${processMemPoint[0]} ${processMemPoint[1] - 6} L${processMemPoint[0]} ${processMemPoint[1] + 6} Z`,
        writeBack: curveGen(writeBackPoints) ?? "",
        processBracketPoints: lineGen(processBracketPoints) ?? "",
    };
}

export interface UpdateArrowPathsOptions {
    viewBoxWidth: number;
    viewBoxHeight: number;
    setProcessMemPoint: (point: [number, number]) => void;
    getPathElement: (id: string) => SVGPathElement | null;

}

export function updateArrowPaths(
    el: HTMLElement,
    diagramRect: DOMRect,
    options: UpdateArrowPathsOptions,
) {
    const { viewBoxWidth, viewBoxHeight, setProcessMemPoint, getPathElement } = options;
    const processMemRect = el.getBoundingClientRect();
    const relX = (processMemRect.left - diagramRect.left) / diagramRect.width;
    const relY = (processMemRect.top + processMemRect.height / 2 - diagramRect.top) / diagramRect.height;

    // index zero is the x coordinate, index one is the y coordinate
    const pt: [number, number] = [relX * viewBoxWidth - 60, relY * viewBoxHeight];
    setProcessMemPoint(pt);

    // update write back path
    const writeBackPath = getPathElement("write-back-path");
    if (writeBackPath) writeBackPath.setAttribute("d", curveGen([pt, [900, 440], [500, 440], [450, 200], [400, 190]]) ?? "");

    // update process memory access path
    const processMemoryAccessPath = getPathElement("process-memory-access-path");
    if (processMemoryAccessPath) {
        // Keep point order identical to buildArrowPaths() to avoid visible shifts
        // when rerenders/zoom updates swap between initial and runtime geometry.
        processMemoryAccessPath.setAttribute("d", curveGen([[850, 340], [1000, 340], pt]) ?? "");
    }

    // update process memory access head path (triangle: base, tip-top, tip-bottom, close)
    const processMemoryAccessHeadPath = getPathElement("process-memory-access-head-path");
    if (processMemoryAccessHeadPath) {
        // Match buildArrowPaths() head geometry exactly for stable positioning.
        processMemoryAccessHeadPath.setAttribute("d", `M${pt[0] + 20} ${pt[1]} L${pt[0]} ${pt[1] - 6} L${pt[0]} ${pt[1] + 6} Z`);
    }


    const topBracketPoint = (processMemRect.top - diagramRect.top) / diagramRect.height * viewBoxHeight;
    const bottomBracketPoint = (processMemRect.top + processMemRect.height - diagramRect.top) / diagramRect.height * viewBoxHeight;
    const bracktXPoint = ((processMemRect.left - diagramRect.left) / diagramRect.width * viewBoxWidth) - 30;

    // update process bracket path
    const processBracketPath = getPathElement("process-bracket-path");
    if (processBracketPath) processBracketPath.setAttribute("d", 
        lineGen([[bracktXPoint + 10, topBracketPoint], 
            [bracktXPoint, topBracketPoint], 
            [bracktXPoint, bottomBracketPoint], 
            [bracktXPoint + 10, bottomBracketPoint]]) ?? "");


    const virtualMemoryPfn0 = document.getElementById("virtual-memory-0");
    const physicalMemoryPfn0 = document.getElementById("physical-memory-0");

    if (virtualMemoryPfn0 === null || physicalMemoryPfn0 === null) return; 

    if (virtualMemoryPfn0) {
        // virtual memory dimensions
        const virtualMemoryPfn0Rect = virtualMemoryPfn0.getBoundingClientRect();
        const virtualMemoryPfn0RelX = (virtualMemoryPfn0Rect.right - diagramRect.left) / diagramRect.width;
        const virtualMemoryPfn0RelY = (virtualMemoryPfn0Rect.top - diagramRect.top) / diagramRect.height;
        const virtualMemoryPfn0Height = (virtualMemoryPfn0Rect.height / diagramRect.height) * viewBoxHeight;

        const virtualMemoryPfn0Point: [number, number] = [virtualMemoryPfn0RelX * viewBoxWidth, virtualMemoryPfn0RelY * viewBoxHeight];


        const osPage0Path = getPathElement("os-page-0-path");
        if (!osPage0Path) {
            throw new Error("os-page-0-path not found");
        }

        // physical memory dimensions
        const physicalMemoryPfn0Rect = physicalMemoryPfn0.getBoundingClientRect();
        const physicalMemoryPfn0RelX = (physicalMemoryPfn0Rect.left - diagramRect.left) / diagramRect.width;
        const physicalMemoryPfn0RelY = (physicalMemoryPfn0Rect.top - diagramRect.top) / diagramRect.height;
        const physicalMemoryPfn0Height = (physicalMemoryPfn0Rect.height / diagramRect.height) * viewBoxHeight;

        const physicalMemoryPfn0Point: [number, number] = [physicalMemoryPfn0RelX * viewBoxWidth, physicalMemoryPfn0RelY * viewBoxHeight];

        const path = lineGen([
            [virtualMemoryPfn0Point[0], virtualMemoryPfn0Point[1]], 
            [virtualMemoryPfn0Point[0], virtualMemoryPfn0Point[1] + virtualMemoryPfn0Height + 1.5],
            [physicalMemoryPfn0Point[0], physicalMemoryPfn0Point[1] + physicalMemoryPfn0Height + 1.5],
            [physicalMemoryPfn0Point[0], physicalMemoryPfn0Point[1]]]);

        osPage0Path.setAttribute("d", path ?? "");
        osPage0Path.classList.remove("invisible");
    }

    const virtualMemoryPfn1 = document.getElementById("virtual-memory-1");
    const physicalMemoryPfn1 = document.getElementById("physical-memory-1");

    if (virtualMemoryPfn1 === null || physicalMemoryPfn1 === null) return; 

    if (virtualMemoryPfn1) {
        const virtualMemoryPfn1Rect = virtualMemoryPfn1.getBoundingClientRect();
        const virtualMemoryPfn1RelX = (virtualMemoryPfn1Rect.right - diagramRect.left) / diagramRect.width;
        const virtualMemoryPfn1RelY = (virtualMemoryPfn1Rect.top - diagramRect.top) / diagramRect.height;
        const virtualMemoryPfn1Height = (virtualMemoryPfn1Rect.height / diagramRect.height) * viewBoxHeight;

        const virtualMemoryPfn1Point: [number, number] = [virtualMemoryPfn1RelX * viewBoxWidth, virtualMemoryPfn1RelY * viewBoxHeight];

        const osPage1Path = getPathElement("os-page-1-path");
        if (!osPage1Path) {
            throw new Error("os-page-1-path not found");
        }

        const physicalMemoryPfn1Rect = physicalMemoryPfn1.getBoundingClientRect();
        const physicalMemoryPfn1RelX = (physicalMemoryPfn1Rect.left - diagramRect.left) / diagramRect.width;
        const physicalMemoryPfn1RelY = (physicalMemoryPfn1Rect.top - diagramRect.top) / diagramRect.height;
        const physicalMemoryPfn1Height = (physicalMemoryPfn1Rect.height / diagramRect.height) * viewBoxHeight;

        const physicalMemoryPfn1Point: [number, number] = [physicalMemoryPfn1RelX * viewBoxWidth, physicalMemoryPfn1RelY * viewBoxHeight];

        const path = lineGen([
            [virtualMemoryPfn1Point[0], virtualMemoryPfn1Point[1] - 1.5], 
            [virtualMemoryPfn1Point[0], virtualMemoryPfn1Point[1] + virtualMemoryPfn1Height],
            [physicalMemoryPfn1Point[0], physicalMemoryPfn1Point[1] + physicalMemoryPfn1Height],
            [physicalMemoryPfn1Point[0], physicalMemoryPfn1Point[1] - 1.5]]);

        osPage1Path.setAttribute("d", path ?? "");
        osPage1Path.classList.remove("invisible");
    }
}


