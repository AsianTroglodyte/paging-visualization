import {CpuCard}  from "./components/cpu-card";
import MmuCard from "./components/mmu-card";
import { MemoryCard } from "./components/memory-card";


export function App() {
    // grid grid-cols-3 grid-rows-2 
    return (
        // <div className="p-10 w-full h-full 
        // grid grid-cols-3 grid-rows-2 gap-4">
            
        //     <div></div>
        //     <MmuCard></MmuCard>
        //     <MemoryCard className="row-span-2"></MemoryCard>
        //     <CpuCard></CpuCard>
        //     <div></div>
        // </div>
        <div className="p-10 w-full h-full 
        flex flex-3 flex items-start gap-4">
            <CpuCard></CpuCard>
            <MmuCard></MmuCard>
            <MemoryCard className="row-span-2"></MemoryCard>
        </div>
    )
}

export default App;