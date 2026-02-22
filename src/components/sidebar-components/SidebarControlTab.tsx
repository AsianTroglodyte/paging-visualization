import { SidebarContent, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { ProcessControlBlocks, MemoryAction } from "@/simulation/types";
import { getProcessColorClasses } from "@/simulation/selectors";

export function SidebarControlTab({
  machineStateDispatch,
  processControlBlocks,
  runningPid,
}: {
  machineStateDispatch: React.Dispatch<MemoryAction>;
  processControlBlocks: ProcessControlBlocks;
  runningPid: number | null;
}) {
  return (
    <SidebarGroup>
      <SidebarHeader>
        <h1 className="text-xl">Add Processes</h1>
      </SidebarHeader>
      <div className="w-full p-2 flex flex-col gap-4 justify-center">
        <ButtonGroup orientation="vertical" className="gap-2">
          <Button onMouseDown={() => machineStateDispatch({ type: "CREATE_PROCESS_RANDOM" })}>
            Add Process
          </Button>
        </ButtonGroup>
        <p className="text-base text-muted-foreground">Each process gets 2 pages (page size fixed)</p>
      </div>
      <SidebarHeader>
        <h1 className="text-xl">Processes</h1>
      </SidebarHeader>
      <div className="w-full p-2 flex flex-col gap-2 justify-center">
        {processControlBlocks.length === 0 ? (
          <p className="text-base text-muted-foreground">No active processes</p>
        ) : (
          <div className="flex flex-col gap-2 text-base text-muted-foreground">
            Press a process to context switch
            {processControlBlocks.map((pcb) => {
              const isRunning = runningPid === pcb.processID;
              const processColors = getProcessColorClasses(pcb.processID);
              return (
                <div
                  key={pcb.processID}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer
                    transition-colors border
                    ${processColors?.border ?? "border-transparent"}
                    ${isRunning && processColors
                      ? `${processColors.trigger ?? ""} text-white`
                      : `${processColors?.table ?? "bg-secondary"} ${processColors?.accent ?? ""} hover:opacity-90`
                    }`}
                  onMouseDown={() => {
                    machineStateDispatch({ type: "CONTEXT_SWITCH", payload: { processID: pcb.processID } });
                  }}
                >
                  <span className="flex items-center gap-2 text-sm">
                    Process {pcb.processID}
                    {isRunning && processColors && (
                      <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded text-white bg-white/20">
                        Running
                      </span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      machineStateDispatch({ type: "DELETE_PROCESS", payload: { processID: pcb.processID } });
                    }}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <SidebarHeader>
        <h1 className="text-xl">Basics</h1>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Add processes by clicking the "Add Process" button.</li>
          <li>Click on a process to context switch to it.</li>
          <li>Click on the "Execute" button to execute the instruction at the program counter.</li>
          <li>click on any address in virtual memory to select it.</li>
          <li>Click on the "Fetch" button to fetch the instruction at the selected address.</li>
          <li>Watch for the changes in the CPU, MMU, Memory, and Virtual Memory</li>
          <li>Click on the "Execute" button to execute the instruction at the selected address.</li>
          <li>Watch for changes especially if the instruction accesses memory</li>
          <li>??!?!?!?</li>
          <li>profit</li>
        </ol>
      </SidebarContent>
    </SidebarGroup>
  );
}
