import type React from "react";

export type ArrowPathsRefs = {
  writeBackPath: React.RefObject<SVGPathElement | null>;
  processMemoryAccessPath: React.RefObject<SVGPathElement | null>;
  processMemoryAccessHeadPath: React.RefObject<SVGPathElement | null>;
  processBracketPath: React.RefObject<SVGPathElement | null>;
  osPage0Path: React.RefObject<SVGPathElement | null>;
  osPage1Path: React.RefObject<SVGPathElement | null>;
};