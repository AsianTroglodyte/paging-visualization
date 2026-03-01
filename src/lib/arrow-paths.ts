import { line, curveCatmullRom } from "d3-shape";

export const curveGen = line<[number, number]>().curve(curveCatmullRom.alpha(0.5));
const lineGen = line<[number, number]>();
export function buildArrowPaths(
    ptPoint: [number, number],
    processMemPoint: [number, number],
    mmuTranslated: boolean
) {
    const queryPT = mmuTranslated ? ptPoint : ([1110, 135] as [number, number]);
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

export function updateArrowPathsFromProcessMem(
    el: HTMLElement,
    diagramRect: DOMRect,
    options: UpdateArrowPathsOptions
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
    if (processMemoryAccessPath) processMemoryAccessPath.setAttribute("d", curveGen([pt, [1000, 340], [850, 340]]) ?? "");

    // update process memory access head path
    const processMemoryAccessHeadPath = getPathElement("process-memory-access-head-path");
    if (processMemoryAccessHeadPath) processMemoryAccessHeadPath.setAttribute("d", `M${pt[0] + 15} ${pt[1]} L${pt[0]} ${pt[1] - 6} L${pt[0]} ${pt[1] + 6} Z`);


    const topBracketPoint = (processMemRect.top - diagramRect.top) / diagramRect.height * viewBoxHeight;
    const bottomBracketPoint = (processMemRect.top + processMemRect.height - diagramRect.top) / diagramRect.height * viewBoxHeight;

    // update process bracket path
    const processBracketPath = getPathElement("process-bracket-path");
    if (processBracketPath) processBracketPath.setAttribute("d", 
        lineGen([[1110, topBracketPoint], [1100, topBracketPoint], [1100, bottomBracketPoint], [1110, bottomBracketPoint]]) ?? "");
}


