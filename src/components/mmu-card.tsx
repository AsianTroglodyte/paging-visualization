import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"    
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export function MmuCard() {
    return (
        <Card size="sm" className="bg-black">
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2}> VPN</TableHead>
                            <TableHead rowSpan={3}>offset</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>0</TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>1</TableCell>
                            <TableCell>1</TableCell>
                            <TableCell>1</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default MmuCard