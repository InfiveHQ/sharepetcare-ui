"use client"

import * as React from "react"
import { DialogPrimitive } from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Command = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = "Command"

const CommandInput = React.forwardRef<
  React.ElementRef<"input">,
  React.ComponentPropsWithoutRef<"input">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "border-b border-input bg-transparent px-3 py-2 text-sm outline-none",
      className
    )}
    {...props}
  />
))
CommandInput.displayName = "CommandInput"

const CommandEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="py-4 px-3 text-sm text-muted-foreground">{children}</div>
)
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="py-1">{children}</div>
)
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

export {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}
