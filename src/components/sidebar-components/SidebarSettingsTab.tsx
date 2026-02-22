import { SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";

export function SidebarSettingsTab() {
  return (
    <SidebarGroup>
      <SidebarHeader className="text-lg">Settings</SidebarHeader>
      <div className="w-full p-2 h-64 flex flex-col items-center gap-4 justify-center">
        <p className="text-sm text-muted-foreground">
          Nothing to see here yet, but enjoy this rickroll in the meantime
        </p>
        <img className="w-full" src="/src/assets/rickroll-meme.gif" alt="Rick Roll" />
      </div>
    </SidebarGroup>
  );
}
