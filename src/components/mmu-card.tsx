import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"    
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export function MmuCard() {
    return (
        <Card size="sm" className="w-70">
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">MMU  </h1>
                </CardTitle>
                <CardDescription >
                    <h2 className="text-lg"> Address Translation Process </h2>
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                <div className="grid grid-cols-6 grid-rows-[auto_1.5rem_3rem_3rem_3rem] items-start">
                    <div className="text-base flex justify-center font-semibold h-7 col-span-3">VPN</div>
                    <div className="text-base flex justify-center font-semibold h-7 col-span-3">offset</div>



                    <div className="text-base flex justify-center items-center font-semibold border">0</div>
                    <div className="text-base flex justify-center items-center font-semibold border">1</div>
                    <div className="text-base flex justify-center items-center font-semibold border">0</div>

                    <div className="text-base flex justify-center items-center font-semibold border">1</div>
                    <div className="text-base flex justify-center items-center font-semibold border">0</div>
                    <div className="text-base flex justify-center items-center font-semibold border">1</div>


                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 L9 13 L15 13Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 L9 13 L15 13Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 L9 13 L15 13Z" />
                        </svg>
                    </div>
                    

                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 69 L9 63 L15 63 Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 69 L9 63 L15 63 Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center row-span-3">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 69 L9 63 L15 63 Z" />
                        </svg>
                    </div>

                    <div className="text-base text-center flex justify-center font-semibold 
                    col-span-3 row">Address Translation</div>


                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 L9 13 L15 13Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 L9 13 L15 13Z" />
                        </svg>
                    </div>
                    <div className="flex justify-center items-center ">
                        <svg viewBox="0 0 24 72" className="text-foreground" fill="currentColor">
                            <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 L9 13 L15 13Z" />
                        </svg>
                    </div>

                    <div className="text-base flex justify-center items-center  font-semibold border">1</div>
                    <div className="text-base flex justify-center items-center  font-semibold border">1</div>
                    <div className="text-base flex justify-center items-center  font-semibold border">1</div>

                    <div className="text-base flex justify-center items-center  font-semibold border">1</div>
                    <div className="text-base flex justify-center items-center  font-semibold border">0</div>
                    <div className="text-base flex justify-center items-center  font-semibold border">1</div>
                </div>
            </CardContent>
        </Card>
    )
}

export default MmuCard