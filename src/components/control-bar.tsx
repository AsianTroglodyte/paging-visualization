import { Button } from "./ui/button";
import type { ProcessControlBlocks, MemoryAction } from "@/simulation/types";
import { getProcessColorClasses } from "@/simulation/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useSidebar } from "./ui/sidebar";

export function ControlBar({
  machineStateDispatch,
  processControlBlocks,
  runningPid,
  className,
}: {
  machineStateDispatch: React.Dispatch<MemoryAction>;
  processControlBlocks: ProcessControlBlocks;
  runningPid: number | null;
  className: string;
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
          <Button
            className="text-sm cursor-pointer"
            onMouseDown={() =>
              machineStateDispatch({ type: "CREATE_PROCESS_RANDOM" })
            }
          >
            Add Process
          </Button>
          <p className="text-base text-muted-foreground text-center">
            2 Pages per process
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 align-center ">
          <h1 className="text-xl text-center">Processes</h1>
          {processControlBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No active processes
            </p>
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
                ${
                  isRunning && processColors
                    ? `${processColors.trigger ?? ""} text-white`
                    : `${processColors?.cellStrong} ${processColors?.accent} hover:opacity-90 `
                }`}
                    onMouseDown={() => {
                      machineStateDispatch({
                        type: "CONTEXT_SWITCH",
                        payload: { processID: pcb.processID },
                      });
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
                        machineStateDispatch({
                          type: "DELETE_PROCESS",
                          payload: { processID: pcb.processID },
                        });
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
  );
}

export function ControlBarDock({
  isOpen,
  toggle,
  machineStateDispatch,
  processControlBlocks,
  runningPid,
}: {
  isOpen: boolean;
  toggle: () => void;
  machineStateDispatch: React.Dispatch<MemoryAction>;
  processControlBlocks: ProcessControlBlocks;
  runningPid: number | null;
}) {
  const { state, isMobile } = useSidebar();

  const translateX =
    !isMobile && state === "expanded"
      ? "calc(-50% + var(--sidebar-width)/2)"
      : "-50%";
  const translateY = isOpen ? "0" : "calc(100% - 2.25rem)";

  return (
    <div
      className="flex flex-col items-center fixed bottom-0 left-1/2 z-50 transform-gpu transition-transform duration-300 ease-out will-change-transform"
      style={{ transform: `translate(${translateX}, ${translateY})` }}
    >
      <button
        type="button"
        onClick={toggle}
        className="flex h-10 w-30 items-center justify-center gap-2 rounded-t-md 
        bg-primary px-3 text-primary-foreground cursor-pointer"
      >
        <svg
          className={`h-5 w-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 18L12 13L7 18M17 11L12 6L7 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-base font-semibold font-mono">Control</span>
      </button>
      <ControlBar
        machineStateDispatch={machineStateDispatch}
        processControlBlocks={processControlBlocks}
        runningPid={runningPid}
        className="rounded-t-none"
      />
    </div>
  );
}