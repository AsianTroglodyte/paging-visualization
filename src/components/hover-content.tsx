import { useState } from "react";
import { OPCODE_NAMES } from "@/simulation/isa";
import { formatByteAsAscii } from "@/lib/utils";
import { NUM_PAGES } from "@/simulation/constants";

/** Free list: byte at page 0 byte 7. Bit N set = PFN N is free. */
export function FreeListHoverContent({ byte }: { byte: number }) {
  const [hoveredPfn, setHoveredPfn] = useState<number | null>(null);
  const bits = byte.toString(2).padStart(8, "0"); // bits[0]=PFN7 .. bits[7]=PFN0
  const freePfns: number[] = [];
  for (let pfn = 0; pfn < NUM_PAGES; pfn++) {
    if ((byte & (1 << pfn)) !== 0) freePfns.push(pfn);
  }
  const freeCount = freePfns.length;
  const total = NUM_PAGES;
  const pct = total > 0 ? Math.round((freeCount / total) * 100) : 0;
  const pfnsLeftToRight = [7, 6, 5, 4, 3, 2, 1, 0]; // strip order: PFN 7 .. PFN 0

  return (
    <div className="font-mono space-y-2 min-w-0 text-sm">
      {/* 1) Header: byte in multiple forms + free count */}
      <div className="font-semibold text-sm">Free List (bitmap)</div>
      <div className="text-sm text-muted-foreground">
        Dec {byte} · Hex 0x{byte.toString(16).padStart(2, "0").toUpperCase()} · Bin {bits}
      </div>
      <div className="text-sm font-medium text-foreground">
        Free: {freeCount}/{total} ({pct}%)
      </div>

      {/* 2) Bit strip with legend; 1 = stronger emphasis */}
      <div className="text-[10px] text-muted-foreground">1 = free, 0 = used</div>
      <div className="grid grid-cols-8 gap-0.5 text-sm text-center">
        {pfnsLeftToRight.map((pfn) => (
          <div key={pfn} className="border border-border/60 rounded px-0.5 py-0.5">
            {pfn}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 text-center text-sm">
        {pfnsLeftToRight.map((pfn) => {
          const bitIndex = 7 - pfn; // bits[0]=b7=PFN7, bits[7]=b0=PFN0
          const value = bits[bitIndex];
          const isFree = value === "1";
          const isHovered = hoveredPfn === pfn;
          return (
            <div
              key={pfn}
              onMouseEnter={() => setHoveredPfn(pfn)}
              onMouseLeave={() => setHoveredPfn(null)}
              className={[
                "rounded px-0.5 py-0.5 font-medium transition-colors",
                isFree && "border-2 border-primary/80 bg-primary/10 text-foreground",
                !isFree && "border border-border/60 text-muted-foreground",
                isHovered && "ring-2 ring-muted-foreground/50 ring-offset-1",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {value}
            </div>
          );
        })}
      </div>

      {/* 3) Free PFNs (sorted) */}
      <div className="pt-2 border-t border-border/50 space-y-1 text-sm">
        <div className="font-medium text-foreground">Free PFNs (sorted)</div>
        <div
          className="text-muted-foreground"
          onMouseLeave={() => setHoveredPfn(null)}
        >
          {freePfns.length > 0 ? (
            [...freePfns].reverse().map((pfn, i, arr) => (
              <span key={pfn}>
                <span
                  onMouseEnter={() => setHoveredPfn(pfn)}
                  className={`tabular-nums cursor-default rounded px-0.5 ${
                    hoveredPfn === pfn ? "bg-muted text-foreground" : ""
                  }`}
                >
                  {pfn}
                </span>
                {i < arr.length - 1 ? ", " : ""}
              </span>
            ))
          ) : (
            <span>none</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ByteHoverContent({ byte }: { byte: number }) {
  const instruction = OPCODE_NAMES[(byte & 0b11100000) >> 5] + " " + (byte & 0b00011111);
  return (
    <div className="font-mono space-y-1">
      <div className="font-semibold">Data Interpretation</div>
      <div>Decimal: {byte}</div>
      <div>Instruction: {instruction}</div>
      <div>ASCII: {formatByteAsAscii(byte)}</div>
    </div>
  );
}

const PTE_FIELD_LIST: { bits: string; name: string; desc: string; cellIndices: number[] }[] = [
  { bits: "7..5", name: "PFN", desc: "Page Frame Number", cellIndices: [0, 1, 2] },
  { bits: "4", name: "valid", desc: "Entry in use", cellIndices: [3] },
  { bits: "3", name: "present", desc: "Page in memory", cellIndices: [4] },
  { bits: "2", name: "referenced", desc: "Recently accessed", cellIndices: [5] },
  { bits: "1", name: "dirty", desc: "Page modified", cellIndices: [6] },
  { bits: "0", name: "writable", desc: "Page may be written", cellIndices: [7] },
];

/** PTE: labels, bit positions, bit values; Fields list with hover sync. */
export function PteHoverContent({ byte }: { byte: number }) {
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const [hoveredFieldIndex, setHoveredFieldIndex] = useState<number | null>(null);
  const bits = byte.toString(2).padStart(8, "0"); // bits[0]=b7 .. bits[7]=b0
  const pfnBits = bits.slice(0, 3);
  const cellLayout = [
    { span: 3, value: pfnBits, bitIndices: [0, 1, 2] },
    { span: 1, value: bits[3], bitIndices: [3] },
    { span: 1, value: bits[4], bitIndices: [4] },
    { span: 1, value: bits[5], bitIndices: [5] },
    { span: 1, value: bits[6], bitIndices: [6] },
    { span: 1, value: bits[7], bitIndices: [7] },
  ];
  const isCellHighlighted = (cellBitIndices: number[]) =>
    hoveredCellIndex !== null && cellBitIndices.includes(hoveredCellIndex) ||
    hoveredFieldIndex !== null && PTE_FIELD_LIST[hoveredFieldIndex].cellIndices.some(i => cellBitIndices.includes(i));

  const highlightClass = "ring-1 ring-primary/30 bg-primary/10";

  return (
    <div className="font-mono space-y-2 min-w-0 text-sm" onMouseLeave={() => { setHoveredCellIndex(null); setHoveredFieldIndex(null); }}>
      <div className="font-semibold text-sm">Page Table Entry (PTE)</div>
      <div className="text-sm text-muted-foreground">Dec {byte}</div>
      {/* Row 1: group labels - hoverable */}
      <div className="grid grid-cols-8 gap-0.5 text-sm text-center">
        {cellLayout.map((cell, cellIdx) => (
          <div
            key={cellIdx}
            className={`${cell.span === 3 ? "col-span-3" : "col-span-1"} border border-border/60 rounded px-0.5 py-0.5 cursor-default transition-colors ${
              cellIdx === 0 ? "bg-muted/30" : ""
            } ${isCellHighlighted(cell.bitIndices) ? highlightClass : ""}`}
            onMouseEnter={() => setHoveredCellIndex(cell.bitIndices[0])}
            onMouseLeave={() => setHoveredCellIndex(null)}
          >
            {cellIdx === 0 ? "PFN" : cellIdx === 1 ? "v" : cellIdx === 2 ? "p" : cellIdx === 3 ? "r" : cellIdx === 4 ? "d" : "w"}
          </div>
        ))}
      </div>
      {/* Row 2: bit indices - not hoverable */}
      <div className="grid grid-cols-8 gap-0.5 text-sm text-muted-foreground text-center">
        <div className="col-span-3">7..5</div>
        <div>4</div>
        <div>3</div>
        <div>2</div>
        <div>1</div>
        <div>0</div>
      </div>
      {/* Row 3: bit values - hoverable */}
      <div className="grid grid-cols-8 gap-0.5 text-center text-sm">
        {cellLayout.map((cell, cellIdx) => (
          <div
            key={cellIdx}
            className={`${cell.span === 3 ? "col-span-3" : "col-span-1"} font-medium rounded px-0.5 py-0.5 cursor-default transition-colors ${
              isCellHighlighted(cell.bitIndices) ? highlightClass : ""
            }`}
            onMouseEnter={() => setHoveredCellIndex(cell.bitIndices[0])}
            onMouseLeave={() => setHoveredCellIndex(null)}
          >
            {cell.value}
          </div>
        ))}
      </div>
      {/* List: what each field means - hoverable */}
      <div className="pt-2 border-t border-border/50 space-y-1 text-sm">
        <div className="font-medium text-foreground">Fields</div>
        {PTE_FIELD_LIST.map(({ bits: bitRange, name, desc, cellIndices }, fieldIdx) => {
          const isHighlighted = hoveredFieldIndex === fieldIdx || (hoveredCellIndex !== null && cellIndices.includes(hoveredCellIndex));
          return (
            <div
              key={name}
              className={`flex items-baseline gap-2 rounded px-1 py-0.5 cursor-default transition-colors ${
                isHighlighted ? highlightClass : "text-muted-foreground"
              }`}
              onMouseEnter={() => setHoveredFieldIndex(fieldIdx)}
              onMouseLeave={() => setHoveredFieldIndex(null)}
            >
              <span className="tabular-nums shrink-0">[{bitRange}]</span>
              <span className="font-medium text-foreground">{name}</span>
              <span>— {desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PCB_BYTE0_FIELD_LIST: { bits: string; name: string; desc: string; cellIndices: number[] }[] = [
  { bits: "7..5", name: "pageTableBase", desc: "PT offset in page 0", cellIndices: [0, 1, 2] },
  { bits: "4..1", name: "programCounter", desc: "Current instruction (4-bit)", cellIndices: [3, 4, 5, 6] },
  { bits: "0", name: "valid", desc: "PCB slot in use", cellIndices: [7] },
];

/** PCB byte 0 only: [pageTableBase 7:5 | programCounter 4:1 | validBit 0]. */
export function PcbByte0HoverContent({
  byte,
  slotIndex,
}: {
  byte: number;
  slotIndex: number;
}) {
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);
  const [hoveredFieldIndex, setHoveredFieldIndex] = useState<number | null>(null);
  const b = byte.toString(2).padStart(8, "0");
  const ptbBits = b.slice(0, 3);
  const pcBits = b.slice(3, 7);
  const validBit = b[7];
  const pageTableBase = (byte >> 5) & 0b111;
  const programCounter = (byte >> 1) & 0b1111;
  const cellLayout = [
    { span: 3, value: ptbBits, bitIndices: [0, 1, 2] },
    { span: 4, value: pcBits, bitIndices: [3, 4, 5, 6] },
    { span: 1, value: validBit, bitIndices: [7] },
  ];
  const isCellHighlighted = (cellBitIndices: number[]) =>
    hoveredCellIndex !== null && cellBitIndices.includes(hoveredCellIndex) ||
    hoveredFieldIndex !== null && PCB_BYTE0_FIELD_LIST[hoveredFieldIndex].cellIndices.some(i => cellBitIndices.includes(i));

  const highlightClass = "ring-1 ring-primary/30 bg-primary/10";

  return (
    <div className="font-mono space-y-2 min-w-0 text-sm" onMouseLeave={() => { setHoveredCellIndex(null); setHoveredFieldIndex(null); }}>
      <div className="font-semibold text-sm">PCB (slot {slotIndex}) · Byte 0</div>
      <div className="text-sm text-muted-foreground">Dec {byte}</div>
      {/* Row 1: group labels - hoverable */}
      <div className="grid grid-cols-8 gap-0.5 text-sm text-center">
        {cellLayout.map((cell, cellIdx) => (
          <div
            key={cellIdx}
            className={`${cell.span === 3 ? "col-span-3" : cell.span === 4 ? "col-span-4" : "col-span-1"} border border-border/60 rounded px-0.5 py-0.5 cursor-default transition-colors ${
              cellIdx === 0 ? "bg-muted/30" : ""
            } ${isCellHighlighted(cell.bitIndices) ? highlightClass : ""}`}
            onMouseEnter={() => setHoveredCellIndex(cell.bitIndices[0])}
            onMouseLeave={() => setHoveredCellIndex(null)}
          >
            {cellIdx === 0 ? "PT base" : cellIdx === 1 ? "PC" : "v"}
          </div>
        ))}
      </div>
      {/* Row 2: bit indices - not hoverable */}
      <div className="grid grid-cols-8 gap-0.5 text-sm text-muted-foreground text-center">
        <div className="col-span-3">7..5</div>
        <div className="col-span-4">4..1</div>
        <div>0</div>
      </div>
      <div className="grid grid-cols-8 gap-0.5 text-center text-sm">
        {cellLayout.map((cell, cellIdx) => (
          <div
            key={cellIdx}
            className={`${cell.span === 3 ? "col-span-3" : cell.span === 4 ? "col-span-4" : "col-span-1"} font-medium rounded px-0.5 py-0.5 cursor-default transition-colors ${
              isCellHighlighted(cell.bitIndices) ? highlightClass : ""
            }`}
            onMouseEnter={() => setHoveredCellIndex(cell.bitIndices[0])}
            onMouseLeave={() => setHoveredCellIndex(null)}
          >
            {cell.value}
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-border/50 space-y-2 text-sm">
        <div className="font-medium text-foreground">Fields</div>
        {PCB_BYTE0_FIELD_LIST.map(({ bits: bitRange, name, desc, cellIndices }, fieldIdx) => {
          const isHighlighted = hoveredFieldIndex === fieldIdx || (hoveredCellIndex !== null && cellIndices.includes(hoveredCellIndex));
          return (
            <div
              key={name}
              className={`rounded px-1 py-0.5 cursor-default transition-colors ${isHighlighted ? highlightClass : ""}`}
              onMouseEnter={() => setHoveredFieldIndex(fieldIdx)}
              onMouseLeave={() => setHoveredFieldIndex(null)}
            >
              <div className="font-medium text-foreground">
                <span className="tabular-nums text-muted-foreground">[{bitRange}] </span>
                {name}
              </div>
              <div className="text-muted-foreground pl-5">{desc}</div>
            </div>
          );
        })}
      </div>
      <div className="pt-2 border-t border-border/50 space-y-0.5 text-sm text-muted-foreground">
        <div>pageTableBase = {pageTableBase}</div>
        <div>programCounter = {programCounter}</div>
        <div>valid = {validBit}</div>
      </div>
    </div>
  );
}

/** PCB byte 1 only: accumulator (8 bits). */
export function PcbByte1HoverContent({
  byte,
  slotIndex,
}: {
  byte: number;
  slotIndex: number;
}) {
  const bits = byte.toString(2).padStart(8, "0");
  return (
    <div className="font-mono space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">PCB (slot {slotIndex}) · Byte 1</div>
      <div className="text-sm text-muted-foreground">Dec {byte}</div>
      <div className="text-muted-foreground text-xs">accumulator</div>
      <div className="grid grid-cols-8 gap-0.5 text-sm text-center">
        {[7, 6, 5, 4, 3, 2, 1, 0].map((i) => (
          <div key={i} className="border border-border/60 rounded px-0.5 py-0.5">
            {i}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 text-center text-sm">
        {bits.split("").map((c, i) => (
          <div key={i} className="font-medium">
            {c}
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-border/50 text-sm text-muted-foreground">
        accumulator = {byte}
      </div>
    </div>
  );
}
