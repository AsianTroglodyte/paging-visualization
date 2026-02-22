import type { MmuState } from "@/simulation/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"    
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export function MmuCard({mmu}: {mmu: MmuState}) {

    const { virtualPageNumber, pageFrameNumber, offset } = mmu;

    // vpnArray is specially formatted if thre 
    const vpnArray = new Array(3).fill("");
    const vpnStringUnpadded = virtualPageNumber.toString(2);
    for (let i = 2; i > (2 - vpnStringUnpadded.length); i--) {
        console.log(`vpnStringUnpadded[${2 - i}]: `, vpnStringUnpadded[2 - i]);
        vpnArray[i] = vpnStringUnpadded[2 - i];
    }




    const pfnString = pageFrameNumber.toString(2).padStart(3, "0");
    const offsetString = offset.toString(2).padStart(3, "0");

    return (
        <Card size="sm" >
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">MMU  </h1>
                </CardTitle>
                <CardDescription >
                    <h2 className="text-lg"> Address Translation Process </h2>
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                <div className="grid grid-cols-[5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem] grid-rows-[auto_1.5rem_3rem_3rem_3rem] items-start">
                    <div className="flex flex-col h-full justify-between items-center h-7 col-span-1 row-span-6">
                        <div className="text-sm text-muted-foreground 
                        font-medium flex items-center pr-2 justify-end pt-5">
                            Virtual address
                        </div>
                        <div className="text-sm text-muted-foreground 
                        font-medium flex items-center pr-2 justify-end">
                            Physical address
                        </div>
                    </div>
                    <div className="text-base flex justify-center font-semibold h-7 col-span-3">VPN</div>
                    <div className="text-base flex justify-center font-semibold h-7 col-span-3">offset</div>

                    {vpnArray.map((bit, index) => {
                        return (<div key={index} 
                            className={
                            bit === "" 
                            ? "invisible" 
                            :`text-base flex justify-center items-center font-semibold border`}>
                                {bit}
                            </div>)
                    })}

                    {offsetString.split("").map((bit, index) => {
                        return (<div key={index} className="text-base flex justify-center items-center font-semibold border">{bit}</div>)
                    })}

                    {/* VPN Arrow Divs. created based on vpnArray*/}
                    {vpnArray.map((bit, index) => {
                        return ( 
                        <div key={index} className={
                            bit === "" 
                            ? "invisible" 
                            :"flex justify-center items-center"}>
                            <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                                <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" 
                                strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                <path d="M12 23 L9 16 L15 16Z" />
                            </svg>
                        </div>)
                    })}
                    
                    {/* VPN Arrow Divs */}
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 80" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 77 L9 70 L15 70 Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 80" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 77 L9 70 L15 70 Z" />
                        </svg>
                    </div>                    
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 80" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 77 L9 70 L15 70 Z" />
                        </svg>
                    </div>

                    <div className={`text-base text-center flex justify-center font-semibold 
                    col-span-3 row border`}>Address Translation</div>


                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 23 L9 16 L15 16Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 23 L9 16 L15 16Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 23 L9 16 L15 16Z" />
                        </svg>
                    </div>

                    {pfnString.split("").map((bit, index) => {
                        return (<div key={index} className="text-base flex justify-center items-center font-semibold border">{bit}</div>)
                    })}

                    {offsetString.split("").map((bit, index) => {
                        return (<div key={index} className="text-base flex justify-center items-center font-semibold border">{bit}</div>)
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

export default MmuCard