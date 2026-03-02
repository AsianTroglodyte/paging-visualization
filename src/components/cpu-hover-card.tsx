/** Hover card content for CPU register acronyms. */

export function PcHoverContent() {
  return (
    <div className="space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">PC — Program Counter</div>
      <div className="text-muted-foreground">
        Holds the <strong className="text-foreground">virtual address</strong> of the next instruction to execute.
        or set by Fetch/Jump. Normally we incremented the PC after an instruction execution, but we do not do this for your convenience. 
      </div>
    </div>
  );
}

export function PtbHoverContent() {
  return (
    <div className="space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">PTB — Page Table Base</div>
      <div className="text-muted-foreground">
        The <strong className="text-foreground">physical address</strong> of the start of this process&apos;s page table in memory.
        Used by the MMU to translate virtual page numbers (VPN) to physical frame numbers (PFN).
      </div>
    </div>
  );
}

export function AccHoverContent() {
  return (
    <div className="space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">ACC — Accumulator</div>
      <div className="text-muted-foreground">
        A <strong className="text-foreground">general-purpose register</strong> that stores the result of arithmetic operations
        (e.g. ADD, SUB). Wraps on overflow and underflow.
      </div>
    </div>
  );
}

export function IrHoverContent() {
  return (
    <div className="space-y-2 min-w-0 text-sm">
      <div className="font-semibold text-sm">IR — Instruction Register</div>
      <div className="text-muted-foreground">
        Holds the <strong className="text-foreground">current instruction</strong> being executed.
        Format: 3 bits opcode (bits 7–5) + 5 bits operand (bits 4–0).
      </div>
    </div>
  );
}
