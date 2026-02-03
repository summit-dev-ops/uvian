"use client"

import * as React from "react"
// Note: Using a simplified scroll area if radix-scroll-area is not available
// In a full shadcn setup, this would use @radix-ui/react-scroll-area

import { cn } from "../../lib/utils"

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <div className="h-full w-full overflow-y-auto scrollbar-hide">
      {children}
    </div>
  </div>
))
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
