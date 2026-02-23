import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { AccordionContent } from "./accordion"

function MemoryAccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  
  
  return (
    <AccordionContent className={cn(
      "text-xs overflow-hidden data-open:animate-accordion-down-21 data-closed:animate-accordion-up-21 h-[21rem]",
      className
    )} {...props}>
      {children}
    </AccordionContent>
  )
}


export { MemoryAccordionContent }
