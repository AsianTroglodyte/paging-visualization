import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"


createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <main className="w-full">
        <link rel="icon" href="/src/assets/page.png" />
        <App />     
      </main>
  </StrictMode>
)
