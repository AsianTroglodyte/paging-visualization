import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

/**
 * Toggle control kept outside <Sidebar> so it stays visible when the mobile
 * Sheet is closed. Desktop position approximates the old in-sidebar tab
 * (top 6px, peeking past the panel's right edge).
 */
export function SidebarEdgeTrigger() {
  const { state, isMobile } = useSidebar()

  return (
    <SidebarTrigger
      size="lg"
      className={cn(
        "fixed z-50 cursor-pointer bg-background",
        "top-[6px] transition-[left] duration-200 ease-linear",
        isMobile
          ? "left-2"
          : state === "expanded"
            ? "left-[calc(var(--sidebar-width)+36px-2.25rem)]"
            : "left-2",
      )}
    />
  )
}
