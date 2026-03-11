import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { useHaptics } from "@/hooks/useHaptics"

const SWIPE_MIN_DISTANCE = 56
const SWIPE_AXIS_RATIO = 1.25
const SWIPE_MAX_DURATION = 650

function isSwipeExcludedTarget(target) {
  if (!(target instanceof HTMLElement)) return true
  if (!target.closest("[role='tabpanel']")) return true
  if (target.closest("[data-no-tab-swipe]")) return true
  if (target.closest("input, textarea, select, option, button, a, [contenteditable='true']")) return true
  return false
}

const Tabs = React.forwardRef(({ swipeable = true, onTouchStart, onTouchMove, onTouchEnd, ...props }, ref) => {
  const rootRef = React.useRef(null)
  const haptics = useHaptics()
  const gestureRef = React.useRef({
    active: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    blocked: false,
  })

  const setRefs = (node) => {
    rootRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }

  const switchTab = (direction) => {
    const root = rootRef.current
    if (!root) return

    const tabs = Array.from(root.querySelectorAll("[role='tab'][data-tab-value]"))
      .filter((tab) => !tab.hasAttribute("disabled") && tab.getAttribute("aria-disabled") !== "true")

    if (tabs.length <= 1) return

    const activeIndex = tabs.findIndex((tab) => tab.getAttribute("data-state") === "active")
    if (activeIndex === -1) return

    const nextIndex = direction === "next" ? activeIndex + 1 : activeIndex - 1
    if (nextIndex < 0 || nextIndex >= tabs.length) return

    const targetTab = tabs[nextIndex]
    haptics.selection()
    targetTab.focus({ preventScroll: true })
    targetTab.click()
  }

  const handleTouchStart = (event) => {
    onTouchStart?.(event)
    if (!swipeable || event.touches.length !== 1) return

    const touch = event.touches[0]
    const blocked = isSwipeExcludedTarget(event.target)
    gestureRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      lastX: touch.clientX,
      lastTime: Date.now(),
      blocked,
    }
  }

  const handleTouchMove = (event) => {
    onTouchMove?.(event)
    if (!gestureRef.current.active || gestureRef.current.blocked || event.touches.length !== 1) return

    const touch = event.touches[0]
    gestureRef.current.lastX = touch.clientX
    gestureRef.current.lastTime = Date.now()
  }

  const handleTouchEnd = (event) => {
    onTouchEnd?.(event)
    const gesture = gestureRef.current
    gestureRef.current.active = false

    if (!swipeable || gesture.blocked) return

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - gesture.startX
    const deltaY = touch.clientY - gesture.startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const duration = Date.now() - gesture.startTime

    if (absX < SWIPE_MIN_DISTANCE) return
    if (absX < absY * SWIPE_AXIS_RATIO) return
    if (duration > SWIPE_MAX_DURATION && absX < SWIPE_MIN_DISTANCE * 1.5) return

    switchTab(deltaX < 0 ? "next" : "prev")
  }

  return (
    <TabsPrimitive.Root
      ref={setRefs}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    />
  )
})
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, onMouseDown, value, ...props }, ref) => {
  const haptics = useHaptics()

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-tab-value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs",
        className
      )}
      onMouseDown={(event) => {
        haptics.selection()
        onMouseDown?.(event)
      }}
      value={value}
      {...props} />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
