import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import type { ProcessControlBlocks, MemoryAction } from "@/simulation/types";
import { getProcessColorClasses } from "@/simulation/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ControlBar({ machineStateDispatch, processControlBlocks, runningPid, className }: { 
  machineStateDispatch: React.Dispatch<MemoryAction>, 
  processControlBlocks: ProcessControlBlocks, 
  runningPid: number | null, className: string 
}) {
return (
<Card className={`bg-card px-3 w-100 ${className}`}>

  <CardContent className="w-full p-2 flex flex-row gap-4 justify-center">
    <div className="flex flex-col gap-4 align-center">
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl text-center">Add Processes</h1>
        </CardTitle>
      </CardHeader>
      <Button className="text-sm" onMouseDown={() => machineStateDispatch({ type: "CREATE_PROCESS_RANDOM" })}>
        Add Process
      </Button>
      <p className="text-base text-muted-foreground text-center">2 Pages per process</p>
    </div>



    <div className="w-full flex flex-col gap-2 align-center ">
      <h1 className="text-xl text-center">Processes</h1>
    {processControlBlocks.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center">No active processes</p>
    ) : (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground text-center">
        Press to context switch
        {processControlBlocks.map((pcb) => {
          const isRunning = runningPid === pcb.processID;
          const processColors = getProcessColorClasses(pcb.processID);
          return (
            <div
              key={pcb.processID}
              className={`flex items-center justify-between p-2 rounded cursor-pointer
                transition-colors 
                ${processColors?.border ?? "border-transparent"}
                ${isRunning && processColors
                  ? `${processColors.trigger ?? ""} text-white`
                  : `${processColors?.cellStrong} ${processColors?.accent} hover:opacity-90 `
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
  </CardContent>
</Card>
)
  }