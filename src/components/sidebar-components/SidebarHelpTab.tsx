import { SidebarGroup } from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function SidebarHelpTab() {
  return (
    <SidebarGroup>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="cpu" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            CPU
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                The <strong>CPU</strong> card shows the currently running process (or “idle” if none is selected). It displays the process’s <strong>registers</strong>: <strong>PC</strong> (program counter, 4-bit virtual address), <strong>Page Table Base</strong> (offset in page 0 for this process’s page table), <strong>Accumulator</strong> (8-bit), and <strong>Current Instruction</strong> (raw byte at PC).
              </p>
              <p>
                Use the operand input and <strong>Fetch</strong> to set the PC to a selected virtual address, then <strong>Execute</strong> to run the instruction at the current PC. The operand (0–31) is used as a virtual address for memory instructions or as an immediate for addi/subi.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="mmu" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            MMU
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                The <strong>Memory Management Unit (MMU)</strong> card shows the current <strong>address translation</strong>. When the CPU accesses a virtual address, the MMU splits it into <strong>VPN</strong> (virtual page number, high bits) and <strong>offset</strong> (low bits within the page).
              </p>
              <p>
                It looks up the VPN in the running process’s page table to get the <strong>PFN</strong> (page frame number), then forms the physical address as <strong>PFN + offset</strong>. The card displays the virtual address (VPN and offset in binary) and the resulting physical address (PFN and offset).
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="virtual-memory" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Virtual Memory
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                The <strong>Virtual Memory</strong> card shows the <strong>current process’s address space</strong>: virtual addresses 0–15, grouped by <strong>VPN</strong> (VPN 0 = Code, VPN 1 = Heap). Each row is one virtual address; you see its content (instruction on code page, or raw byte on heap).
              </p>
              <p>
                Click an address to <strong>select</strong> it for Fetch. The row at the current <strong>PC</strong> is highlighted (light process color). Only the running process’s virtual memory is shown; switch processes in the sidebar to see another.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="memory" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Memory
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                The <strong>Memory</strong> card shows <strong>physical memory</strong> as 8 pages (PFN 0–7), each 8 bytes. <strong>Page 0</strong> holds page tables and the free list (byte 7). <strong>Page 1</strong> holds the four PCB slots (2 bytes each). <strong>Pages 2–7</strong> hold process code and data (or are free).
              </p>
              <p>
                Expand a page to see physical addresses and byte contents. Hover over a byte to see a hover card: for PTEs and PCB bytes you get a field breakdown (see Page tables and PCBs in this Help tab); for data bytes you get decimal, instruction decode, and ASCII.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="isa" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Instruction Set
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Instructions are 8 bits: <strong>opcode</strong> in bits [7:5], <strong>operand</strong> in bits [4:0].
              </p>
              <p className="font-medium text-foreground">Instructions</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>lb</strong> — load byte from virtual address into accumulator</li>
                <li><strong>sb</strong> — store accumulator to virtual address</li>
                <li><strong>add</strong> — add byte at address to accumulator (8-bit wrap)</li>
                <li><strong>addi</strong> — add immediate (0–31) to accumulator</li>
                <li><strong>sub</strong> — subtract byte at address from accumulator</li>
                <li><strong>subi</strong> — subtract immediate from accumulator</li>
                <li><strong>branch</strong> — if accumulator is 0, jump to address</li>
                <li><strong>jump</strong> — set PC to address</li>
              </ul>
              <p>
                Use <strong>Fetch</strong> to set the program counter to a virtual address, then <strong>Execute</strong> to run the instruction there. Operand: virtual addresses 0–15, or immediate 0–31 for addi/subi.
              </p>
              <p>
                Operand must be between 0 and 31. because it is an unsigned 5-bit number.
              </p>
              <p></p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="free-list" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Free list
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                The <strong>free list</strong> is a single byte in physical memory at <strong>page 0, byte 7</strong>. It encodes which page frames are available for allocation.
              </p>
              <p className="font-medium text-foreground">Bitmap</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each bit corresponds to a <strong>Page Frame Number (PFN)</strong>: bit 0 = PFN 7, bit 1 = PFN 6, … bit 7 = PFN 0.</li>
                <li><strong>1 = free</strong>, <strong>0 = used</strong>. A set bit means that PFN is on the free list and can be allocated to a process.</li>
              </ul>
              <p>
                When you add a process, the allocator picks free PFNs from this list. In the Memory view, hover over the free-list byte to see the bitmap, bit indices, and the list of free PFNs (same info as in the hover card).
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="page-tables" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Page tables
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                <strong>Page tables</strong> live in page 0. Each process has a small page table; each entry is one byte: a <strong>Page Table Entry (PTE)</strong>.
              </p>
              <p className="font-medium text-foreground">PTE layout (one byte)</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>[7:5] PFN</strong> — Page Frame Number (3 bits): physical frame backing this virtual page.</li>
                <li><strong>[4] valid</strong> — Entry in use.</li>
                <li><strong>[3] present</strong> — Page in memory.</li>
                <li><strong>[2] referenced</strong> — Recently accessed.</li>
                <li><strong>[1] dirty</strong> — Page modified.</li>
                <li><strong>[0] writable</strong> — Page may be written.</li>
              </ul>
              <p>
                The MMU uses the running process’s page table to translate virtual addresses to physical addresses. In the Memory view, hover over a PTE byte to see the same field breakdown as in the hover card.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pcbs" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Process Control Blocks (PCBs)
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                <strong>Process Control Blocks (PCBs)</strong> are stored in <strong>page 1</strong>: four slots of 2 bytes each (addresses 8–9, 10–11, 12–13, 14–15). Each PCB holds the state of one process when it is not running.
              </p>
              <p className="font-medium text-foreground">Byte 0</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>[7:5] pageTableBase</strong> — Offset in page 0 where this process’s page table starts (3 bits).</li>
                <li><strong>[4:1] programCounter</strong> — Current instruction address (4-bit virtual address).</li>
                <li><strong>[0] valid</strong> — PCB slot in use (1 = active process).</li>
              </ul>
              <p className="font-medium text-foreground">Byte 1</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>accumulator</strong> — 8-bit accumulator (full byte).</li>
              </ul>
              <p>
                On a context switch, the CPU saves the current process’s PC and accumulator into its PCB, then loads the new process’s values from its PCB. In the Memory view, hover over each PCB byte to see the same field breakdown as in the hover cards (byte 0: PT base, PC, valid; byte 1: accumulator).
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </SidebarGroup>
  );
}
