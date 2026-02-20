import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsTrigger, TabsList} from "./ui/tabs"
import { ButtonGroup } from "./ui/button-group"
import type { ProcessControlBlocks, MemoryAction} from "@/simulation/types";
import { getProcessColorClasses } from "@/simulation/selectors";

export function AppSidebar(
  {
    machineStateDispatch,
    processControlBlocks,
    runningPid,
  }: {
    machineStateDispatch: React.Dispatch<MemoryAction>;
    processControlBlocks: ProcessControlBlocks;
    runningPid: number | null;
  }
) {
  return (
  <Sidebar>
    <SidebarHeader />
      <SidebarContent>
        <Tabs defaultValue="Control" className="w-full">
            <TabsList className="grid w-full grid-cols-2">  
              <TabsTrigger value="Control">Control</TabsTrigger>
              <TabsTrigger value="Settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="Control" className="mt-4">
              <SidebarGroup>
              <SidebarHeader className="text-lg">Add Processes</SidebarHeader>
                <div className="w-full p-2 flex flex-col gap-4 justify-center">
                  <ButtonGroup orientation="vertical" className="gap-2">
                      <Button onMouseDown={() => machineStateDispatch({type: "CREATE_PROCESS_RANDOM"})}>Add Process</Button>
                  </ButtonGroup>
                  <p className="text-xs text-muted-foreground">Each process gets 2 pages (page size fixed)</p>
                </div>
              <SidebarHeader className="text-lg">Processes</SidebarHeader>
                <div className="w-full p-2 flex flex-col gap-2 justify-center">
                  {processControlBlocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active processes</p>
                  ) : (
                    <div className="flex flex-col gap-2">
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
                            ${isRunning && processColors ? `ring-2 ${processColors.ring}` : ""} 
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
                              machineStateDispatch({type: "DELETE_PROCESS", payload: {processID: pcb.processID}});
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
              </SidebarGroup>
            </TabsContent>

            <TabsContent value="Settings" className="mt-4">
                <SidebarGroup>
                    <SidebarHeader className="text-lg">Settings</SidebarHeader>
                    <div className="w-full p-2 h-64 flex flex-col items-center gap-4 justify-center">
                      <p className="text-xs text-muted-foreground">
                          Nothing to see here yet, but enjoy this rickroll in the meantime
                      </p>
                      <img className="w-full" src="/src/assets/rickroll-meme.gif" alt="Rick Roll" >
                      </img>

                    </div>
                </SidebarGroup>
            </TabsContent>
        </Tabs>
      </SidebarContent>
    <SidebarFooter />
  </Sidebar>
  )
}