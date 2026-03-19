import { SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function SidebarTutorialTab() {
  return (
    <SidebarGroup>
      <SidebarHeader className="text-xl px-2">
        <h1 className=""> Basic Controls</h1>
      </SidebarHeader>
      <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
        <p className="text-sm text-muted-foreground">
          Add a Process in the Control panel and context switch to it. 
        </p>
        <p className="text-sm text-muted-foreground">
          Notice the registers of the current process in the CPU card and the virtual memory 
          of the process in the Virtual Memory card.
        </p>
        <p className="text-sm text-muted-foreground">
          You can press on an address in the virtual memory card, to select it for Fetch. 
          Then you Fetch the address by pressing the Fetch button.
        </p>
        <p className="text-sm text-muted-foreground">
          Then you Execute the instruction by pressing the Execute button.
        </p>
        <p className="text-sm ">
          NOTE: hover over anything that has a dotted underline to see more information.
        </p>

      </div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tutorial-1" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Tutorial section 1
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">When does the MMU translate? (Fetch and memory instructions)</p>
              <p>
                Add a Process in the Control panel and context switch to it. 
              </p>
              <p>
              When you click <strong>Fetch</strong>, the CPU sends the <strong>program counter (PC)
                </strong> — a <strong>virtual address</strong> — to the MMU. The MMU splits it into
                <strong>VPN</strong> and <strong>offset</strong>, looks up the VPN in the process’s 
                <strong>page table</strong> to get the <strong>PFN</strong>, then forms the physical 
                address. That location is read to get the <strong>current instruction</strong>. So 
                every Fetch reads from memory twice: the page-table read for the address translation 
                (memory read 1) and fetching the instruction from memory thanks to the address translation 
                (memory read 2). Watch the <strong>MMU</strong> card after Fetch to see that translation.
              </p>
              <p>
                For <strong>lb</strong>, <strong>sb</strong>, <strong>add</strong>, <strong>sub
                </strong>, <strong>branch</strong>, and <strong>jump</strong>, the operand is 
                (or contains) a virtual address. The MMU translates it the same way: VPN → page 
                table → PFN → physical address. So you get a translation and a memory access 
                for each. The key idea: <strong>any time the CPU uses a virtual address to 
                access memory, the MMU does a page-table translation and there is a memory 
                access.</strong>
              </p>
              <p>
                Try it: run <strong>Fetch</strong> then <strong>Execute</strong> on an instruction 
                that reads from memory. 
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tutorial-2" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Tutorial section 2
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">When does the MMU not translate? (addi and subi)</p>
              <p>
                <strong>addi</strong> and <strong>subi</strong> use only the <strong>immediate 
                value</strong> in the instruction (bits [4:0] of the operand). They do not use 
                a virtual address to read or write memory. So for addi/subi there is <strong>no
                </strong> page-table lookup and <strong>no</strong> memory access for the operand. 
                The MMU does not need to translate anything; it stays idle (or unchanged).
              </p>
              <p>
                Try it: run <strong>Fetch</strong> then <strong>Execute</strong> on an addi or subi. 
                After Execute, the MMU card will not show a new translation for the operand — that’s
                the contrast with lb, sb, add, or sub.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tutorial-3" className="border-b-0">
          <AccordionTrigger className="py-2 text-base font-medium hover:no-underline">
            Tutorial section 3
          </AccordionTrigger>
          <AccordionContent>
            <div className="w-full p-2 flex flex-col gap-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Explore the page table (hover over PTEs)</p>
              <p>
                The <strong>page table</strong> lives in <strong>physical memory</strong>, in 
                <strong>Page 0</strong> (PFN 0). Each process has a small table; each <strong>
                page table entry (PTE)</strong> is one byte and describes one virtual page.
              </p>
              <p>
                In the <strong>Memory</strong> card, expand <strong>PFN 0</strong>, find the 
                bytes that belong to the running process’s page table, and <strong>hover over a 
                PTE byte</strong>. The hover card shows the field breakdown of that PTE (valid, 
                present, PFN bits, etc.) — that’s what the MMU uses when it does VPN → PTE → PFN. 
                When you see the MMU translate a VPN to a PFN, the PTE it used is that byte in page 
                0; hover it to see the bits the MMU used.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SidebarGroup>
  );
}
