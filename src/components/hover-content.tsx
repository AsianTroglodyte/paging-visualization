import { OPCODE_NAMES } from "@/simulation/isa";
import { formatByteAsAscii } from "@/lib/utils";

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

const PTE_FIELD_LIST: { bits: string; name: string; desc: string }[] = [
  { bits: "7..5", name: "PFN", desc: "Page Frame Number" },
  { bits: "4", name: "valid", desc: "Entry in use" },
  { bits: "3", name: "present", desc: "Page in memory" },
  { bits: "2", name: "referenced", desc: "Recently accessed" },
  { bits: "1", name: "dirty", desc: "Page modified" },
  { bits: "0", name: "writable", desc: "Page may be written" },
];

/** Option C: Mini diagram – labels, bit positions, then bit values; plus list of field meanings. */
export function PteHoverContent({ byte }: { byte: number }) {
  const bits = byte.toString(2).padStart(8, "0"); // bits[0]=b7 .. bits[7]=b0
  const pfnBits = bits.slice(0, 3);
  return (
    <div className="font-mono space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">Page Table Entry (PTE)</div>
      <div className="text-sm text-muted-foreground">Dec {byte}</div>
      {/* Row 1: group labels */}
      <div className="grid grid-cols-8 gap-0.5 text-sm text-center">
        <div className="col-span-3 border border-border/60 rounded px-0.5 py-0.5 bg-muted/30">PFN</div>
        <div className="border border-border/60 rounded px-0.5 py-0.5">v</div>
        <div className="border border-border/60 rounded px-0.5 py-0.5">p</div>
        <div className="border border-border/60 rounded px-0.5 py-0.5">r</div>
        <div className="border border-border/60 rounded px-0.5 py-0.5">d</div>
        <div className="border border-border/60 rounded px-0.5 py-0.5">w</div>
      </div>
      {/* Row 2: bit indices */}
      <div className="grid grid-cols-8 gap-0.5 text-sm text-muted-foreground text-center">
        <div className="col-span-3">7..5</div>
        <div>4</div>
        <div>3</div>
        <div>2</div>
        <div>1</div>
        <div>0</div>
      </div>
      {/* Row 3: bit values */}
      <div className="grid grid-cols-8 gap-0.5 text-center text-sm">
        <div className="col-span-3 font-medium">{pfnBits}</div>
        <div>{bits[3]}</div>
        <div>{bits[4]}</div>
        <div>{bits[5]}</div>
        <div>{bits[6]}</div>
        <div>{bits[7]}</div>
      </div>
      {/* List: what each field means */}
      <div className="pt-2 border-t border-border/50 space-y-1 text-sm">
        <div className="font-medium text-foreground">Fields</div>
        {PTE_FIELD_LIST.map(({ bits: bitRange, name, desc }) => (
          <div key={name} className="flex items-baseline gap-2 text-muted-foreground">
            <span className="tabular-nums shrink-0">[{bitRange}]</span>
            <span className="font-medium text-foreground">{name}</span>
            <span>— {desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PCB_BYTE0_FIELD_LIST: { bits: string; name: string; desc: string }[] = [
  { bits: "7..5", name: "pageTableBase", desc: "PT offset in page 0" },
  { bits: "4..1", name: "programCounter", desc: "Current instruction (4-bit)" },
  { bits: "0", name: "valid", desc: "PCB slot in use" },
];

/** PCB byte 0 only: [pageTableBase 7:5 | programCounter 4:1 | validBit 0]. */
export function PcbByte0HoverContent({
  byte,
  slotIndex,
}: {
  byte: number;
  slotIndex: number;
}) {
  const b = byte.toString(2).padStart(8, "0");
  const ptbBits = b.slice(0, 3);
  const pcBits = b.slice(3, 7);
  const validBit = b[7];
  const pageTableBase = (byte >> 5) & 0b111;
  const programCounter = (byte >> 1) & 0b1111;
  return (
    <div className="font-mono space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">PCB (slot {slotIndex}) · Byte 0</div>
      <div className="text-sm text-muted-foreground">Dec {byte}</div>
      <div className="grid grid-cols-8 gap-0.5 text-sm text-center">
        <div className="col-span-3 border border-border/60 rounded px-0.5 py-0.5 bg-muted/30">PT base</div>
        <div className="col-span-4 border border-border/60 rounded px-0.5 py-0.5">PC</div>
        <div className="border border-border/60 rounded px-0.5 py-0.5">v</div>
      </div>
      <div className="grid grid-cols-8 gap-0.5 text-sm text-muted-foreground text-center">
        <div className="col-span-3">7..5</div>
        <div className="col-span-4">4..1</div>
        <div>0</div>
      </div>
      <div className="grid grid-cols-8 gap-0.5 text-center text-sm">
        <div className="col-span-3 font-medium">{ptbBits}</div>
        <div className="col-span-4 font-medium">{pcBits}</div>
        <div>{validBit}</div>
      </div>
      <div className="pt-2 border-t border-border/50 space-y-2 text-sm">
        <div className="font-medium text-foreground">Fields</div>
        {PCB_BYTE0_FIELD_LIST.map(({ bits: bitRange, name, desc }) => (
          <div key={name}>
            <div className="font-medium text-foreground">
              <span className="tabular-nums text-muted-foreground">[{bitRange}] </span>
              {name}
            </div>
            <div className="text-muted-foreground pl-5">{desc}</div>
          </div>
        ))}
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
