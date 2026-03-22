# Paging Visualization

Visualize paging and virtual address translation by taking processes and creating, deleting, switching between them, and running instructions in them.

## Demo

<video src="docs/demo-small.webm" controls playsinline width="720"></video>

[docs/demo-small.webm](docs/demo-small.webm)

## What you can do in the app

- **Processes** — Add processes from the bottom **Control** bar (each gets **two virtual pages** allocated at random from the free list). **Context switch** by clicking a process row; **delete** a process with its ✕ button. Processes are color-coded in the diagram.
- **CPU** — When a process is running, the CPU card shows **PC**, **page table base (PTBR)**, **accumulator**, and **instruction register (IR)**. **Execute** runs the current opcode on the current operand; **Fetch** loads the instruction at a **virtual address you selected** in virtual memory (click a byte first). You can edit the **operand** (0–31) for the current instruction.
- **MMU** — While the CPU accesses memory, the MMU card shows how a **virtual address splits into VPN and offset** and maps to a **physical frame (PFN)**.
- **Virtual vs physical memory** — **Virtual memory** lists the running process’s pages and bytes (with instruction decoding). **Memory** shows physical **frames**, **page tables**, **PCBs**, and the **free list**, with accordions and hover details for bytes and PTE fields.
- **Diagram** — The main canvas ties CPU, MMU, and memory together with **SVG arrows** for data paths. **Pan and zoom** the diagram (mouse drag / wheel); interactive controls are excluded from zoom so buttons stay usable.
- **Help** — The **sidebar** has **Tutorial**, **Reference**, and **Settings** tabs (open it from the edge trigger).
- **Errors** — **Page faults** and failures to create a process (e.g. not enough free pages) show as **toasts** at the top.

## How to run 
install 
```pnpm install```
dev 
```pnpm dev```
production build 
```pnpm build```
and optional preview 
```pnpm preview```
lint 
```pnpm lint```

## Tech
Tech used: 
    - TypeScript
    - React
    - Tailwind
    - Shadcn
        - Accordion  
        - SideBar 
        - Toast
    - D3
        - D3 zoom
        - D3 selection
        - D3 Shape
