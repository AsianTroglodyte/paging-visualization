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
import type { PageTablesBases, MemoryAction} from "@/simulation/types";

export function AppSidebar(
  {
    machineStateDispatch,
    activePageTablesBases,
  }: {
    machineStateDispatch: React.Dispatch<MemoryAction>;
    activePageTablesBases: PageTablesBases;
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
                            <Button onClick={() => machineStateDispatch({type: "CREATE_PROCESS_RANDOM"})}>Add Process</Button>
                        </ButtonGroup>
                        <p className="text-xs text-muted-foreground">Each process gets 2 pages (page size fixed)</p>
                      </div>
                    <SidebarHeader className="text-lg">Processes</SidebarHeader>
                      <div className="w-full p-2 flex flex-col gap-2 justify-center">
                        {activePageTablesBases.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No active processes</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            Press a process to context switch
                            {activePageTablesBases.map((process) => (
                              <div key={process.processID} className="flex items-center justify-between bg-secondary p-2 rounded">
                                <span className="text-sm">Process {process.processID} (2 pages)</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => machineStateDispatch({type: "DELETE_PROCESS", payload: {processID: process.processID}})}
                                  className="h-6 w-6 p-0"
                                >
                                  ✕
                                </Button>
                              </div>
                            ))}
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