import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs"
import type { ProcessControlBlocks, MemoryAction } from "@/simulation/types";
import { SidebarHelpTab, SidebarSettingsTab } from "./sidebar-components";


export function AppSidebar({
}: {
}) {
  return (
    <Sidebar variant="floating" collapsible="offcanvas">
      <SidebarHeader />
      <SidebarContent className="">
        <Tabs defaultValue="Help" className="w-full">
          <TabsList className="w-full flex justify-center">
            <TabsTrigger value="Help">Learn</TabsTrigger>
            <TabsTrigger value="Settings">Settings</TabsTrigger>
          </TabsList>


          <TabsContent value="Help" className="mt-4">
            <SidebarHelpTab />
          </TabsContent>

          <TabsContent value="Settings" className="mt-4">
            <SidebarSettingsTab />
          </TabsContent>
        </Tabs>
      </SidebarContent>
      <SidebarFooter />
      <SidebarTrigger className="absolute top-[-3px] right-[-36px] cursor-pointer bg-black" size="lg" />
    </Sidebar>
  )
}
