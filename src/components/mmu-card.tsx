import type { MmuState } from "@/simulation/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"    


export function MmuCard({mmu, className}: {mmu: MmuState, className: string}) {

    // if mmu is translated, use the virtual page number, page frame number, and offset
    // if mmu is idle, use 0 for all values
    let virtualPageNumber = mmu.kind === "translated" ? mmu.virtualPageNumber : 0;
    let pageFrameNumber = mmu.kind === "translated" ? mmu.pageFrameNumber : 0;
    let offset = mmu.kind === "translated" ? mmu.offset : 0;

    // vpnArray is specially formatted if thre 
    const vpnArray = new Array(3).fill("");
    const vpnStringUnpadded = virtualPageNumber.toString(2);
    for (let i = 2; i > (2 - vpnStringUnpadded.length); i--) {
        vpnArray[i] = vpnStringUnpadded[2 - i];
    }




    const pfnString = pageFrameNumber.toString(2).padStart(3, "0");
    const offsetString = offset.toString(2).padStart(3, "0");

    return (
        <Card size="sm" className={`bg-black w-85 min-w-85 ${className}`}>
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-3xl font-semibold">MMU  </h1>
                </CardTitle>
                <CardDescription >
                    <h2 className="text-lg"> Address Translation Process </h2>
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                <div className="grid grid-cols-[2.5rem_2rem_2rem_2rem_2rem_1rem_2rem_2rem_2rem] grid-rows-[auto_1.5rem_3rem_3rem_3rem_1.5rem] items-start">
                    <div className="flex flex-col h-full justify-between items-center h-7 col-span-2 row-span-7">
                        <p className="text-sm text-muted-foreground 
                        font-medium flex items-center pr-2 justify-end pt-5">
                            Virtual address
                        </p>
                        <p className="text-sm text-muted-foreground 
                        font-medium flex items-center pr-2 justify-end pb-5">
                            Physical address
                        </p>
                    </div>
                    <div className="text-base flex justify-center font-semibold h-7 col-span-3">VPN</div>

                    <div className="text-base flex justify-center font-semibold h-7 row-span-8"></div>

                    <div className="text-base flex justify-center font-semibold h-7 col-span-3">offset</div>

                    {vpnArray.map((bit, index) => {
                        return (<p key={index} 
                            className={
                            bit === "" 
                            ? "invisible" 
                            :`text-base flex justify-center items-center font-semibold border`}>
                                {bit}
                            </p>)
                    })}


                    {offsetString.split("").map((bit, index) => {
                        return (<p key={index} className="text-base flex justify-center items-center font-semibold border">{bit}</p>)
                    })}

                    {/* VPN Arrow Divs. created based on vpnArray*/}
                    {vpnArray.map((bit, index) => {
                        return ( 
                        <div key={index} className={
                            bit === "" 
                            ? "invisible" 
                            :"flex justify-center items-center"}>
                            <svg viewBox="0 0 24 30" className="text-foreground" fill="currentColor">
                                <line x1="12" y1="4" x2="12" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 28 L9 21 L15 21Z" />
                            </svg>
                        </div>)
                    })}
                    
                    {/* Offset Arrow Divs */}
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 100" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 100 L9 93 L15 93 Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 100" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 100 L9 93 L15 93 Z" />
                        </svg>
                    </div>                    
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 100" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 100 L9 93 L15 93 Z" />
                        </svg>
                    </div>

                    <p className={`text-sm text-center flex justify-center font-semibold 
                    col-span-3 row border`}>Address Translation</p>



                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 30" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 28 L9 21 L15 21Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 30" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 28 L9 21 L15 21Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 30" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        <path d="M12 28 L9 21 L15 21Z" />
                        </svg>
                    </div>

                    {pfnString.split("").map((bit, index) => {
                        return (<p key={index} className="text-base flex justify-center items-center font-semibold border">{bit}</p>)
                    })}

                    {offsetString.split("").map((bit, index) => {
                        return (<p key={index} className="text-base flex justify-center items-center font-semibold border">{bit}</p>)
                    })}

                    <p className="text-base flex justify-center font-semibold h-7 col-span-3">PFN</p>
                    <p className="text-base flex justify-center font-semibold h-7 col-span-3">offset</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default MmuCard