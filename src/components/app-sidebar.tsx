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


export function AppSidebar({createProcessRandom, activePageTablesBases, deleteProcess} : any) {
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
                    <SidebarHeader>Add Processes</SidebarHeader>
                      <div className="w-full p-2 flex flex-col gap-4 justify-center">
                        <ButtonGroup orientation="vertical" className="gap-2">
                            <Button onClick={() => createProcessRandom(2)}>Create 2 Page Process</Button>
                            <Button onClick={() => createProcessRandom(4)}>Create 4 Page Process</Button>
                        </ButtonGroup>
                      </div>
                    <SidebarHeader>Remove Processes</SidebarHeader>
                      <div className="w-full p-2 flex flex-col gap-2 justify-center">
                        {activePageTablesBases.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No active processes</p>
                        ) : (
                          <ButtonGroup orientation="vertical" className="gap-2">
                            {activePageTablesBases.map((process) => (
                              <Button key={process.processID} onClick={() => deleteProcess(process.processID)} variant="destructive">
                                Delete Process {process.processID} ({process.numPages}p)
                              </Button>
                            ))}
                          </ButtonGroup>
                        )}
                      </div>
                  </SidebarGroup>
              </TabsContent>

              <TabsContent value="Settings" className="mt-4">
                  <SidebarGroup>
                      <SidebarHeader>Settings</SidebarHeader>
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