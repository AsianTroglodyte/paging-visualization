import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "./ui/tabs"
import { SidebarHelpTab, SidebarSettingsTab, SidebarTutorialTab } from "./sidebar-components";


export function AppSidebar() {
  return (
    <Sidebar variant="floating"  collapsible="offcanvas" className="select-text">
      <SidebarHeader />
      <SidebarContent >
        <Tabs defaultValue="Tutorial" className="w-full">
          <TabsList className="w-full flex justify-center">
            <TabsTrigger value="Tutorial">Tutorial</TabsTrigger>
            <TabsTrigger value="Reference">Reference</TabsTrigger>
            <TabsTrigger value="Settings">Settings</TabsTrigger>
          </TabsList>


          <TabsContent value="Tutorial" className="mt-4">
            <SidebarTutorialTab />
          </TabsContent>

          <TabsContent value="Reference" className="mt-4">
            <SidebarHelpTab />
          </TabsContent>

          <TabsContent value="Settings" className="mt-4">
            <SidebarSettingsTab />
          </TabsContent>
        </Tabs>
      </SidebarContent>
      <SidebarFooter />
      <SidebarTrigger className="absolute top-[6px] right-[-36px] cursor-pointer" size="lg" />
    </Sidebar>
  )
}
