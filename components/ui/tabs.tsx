"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-oklch(0.97 0 0) p-1 text-oklch(0.556 0 0) dark:bg-oklch(0.269 0 0) dark:text-oklch(0.708 0 0)",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-oklch(1 0 0) transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oklch(0.708 0 0) focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-oklch(1 0 0) data-[state=active]:text-oklch(0.145 0 0) data-[state=active]:shadow dark:ring-offset-oklch(0.145 0 0) dark:focus-visible:ring-oklch(0.556 0 0) dark:data-[state=active]:bg-oklch(0.145 0 0) dark:data-[state=active]:text-oklch(0.985 0 0)",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-oklch(1 0 0) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oklch(0.708 0 0) focus-visible:ring-offset-2 dark:ring-offset-oklch(0.145 0 0) dark:focus-visible:ring-oklch(0.556 0 0)",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
