import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="absolute"/>
        <App />     
      </main>
    </SidebarProvider>
  </StrictMode>
)
