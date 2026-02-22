import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs"
import type { ProcessControlBlocks, MemoryAction } from "@/simulation/types";
import { SidebarControlTab, SidebarHelpTab, SidebarSettingsTab } from "./sidebar-components";

export function AppSidebar({
  machineStateDispatch,
  processControlBlocks,
  runningPid,
}: {
  machineStateDispatch: React.Dispatch<MemoryAction>;
  processControlBlocks: ProcessControlBlocks;
  runningPid: number | null;
}) {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <Tabs defaultValue="Control" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="Control">Control</TabsTrigger>
            <TabsTrigger value="Help">Help</TabsTrigger>
            <TabsTrigger value="Settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="Control" className="mt-4">
            <SidebarControlTab
              machineStateDispatch={machineStateDispatch}
              processControlBlocks={processControlBlocks}
              runningPid={runningPid}
            />
          </TabsContent>

          <TabsContent value="Help" className="mt-4">
            <SidebarHelpTab />
          </TabsContent>

          <TabsContent value="Settings" className="mt-4">
            <SidebarSettingsTab />
          </TabsContent>
        </Tabs>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
