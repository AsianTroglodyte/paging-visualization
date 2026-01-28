import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"    

export function MmuCard() {
    return (
        <Card size="sm">
            <CardHeader>
                <CardTitle className="text-center mb-2">
                    <h1 className="text-4xl font-semibold">MMU  </h1>
                </CardTitle>
                <CardDescription >
                    <h2 className="text-lg"> Address Translation Process </h2>
                </CardDescription>
            </CardHeader>
            <CardContent className="">
                <div className="grid grid-cols-6 grid-rows-4">
                    <div className="text-sm flex justify-center font-semibold col-span-3">VPN</div>
                    <div className="text-sm flex justify-center font-semibold col-span-3">offset</div>



                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">0</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">0</div>

                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">0</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>


                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>

                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>

                    <div className="text-sm text-center flex justify-center font-semibold col-span-3">Address Translation</div>

                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>


                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>

                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold">|</div>

                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>

                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">0</div>
                    <div className="text-sm flex justify-center items-center h-8 w-8 font-semibold border">1</div>
                </div>
            </CardContent>
        </Card>
    )
}

export default MmuCard