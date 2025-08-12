import React from "react";
import { TabsList } from "./tabs";
import { cn } from "@/lib/utils";

/**
 * TopTabsBar - A wrapper for TabsList that applies the correct top border radius and layout.
 * Also enforces a smaller font size for all tab triggers inside.
 * @param {object} props
 * @param {string} [props.className] - Additional classes
 * @param {string} [props.orientation] - 'vertical' (sidebar) or 'horizontal' (top bar)
 * @param {React.ReactNode} props.children - Tab triggers
 * @returns {JSX.Element}
 */
export default function TopTabsBar({
  className = "",
  orientation = "horizontal",
  children,
  ...props
}) {
  const base =
    orientation === "vertical"
      ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-xl overflow-hidden"
      : "bg-[var(--primary-color)] rounded-t-[var(--radius)] overflow-hidden";
  return (
    <TabsList
      className={cn(
        base,
        "[&_button]:text-sm [&_button]:text-[0.95rem]",
        className
      )}
      {...props}
    >
      {children}
    </TabsList>
  );
}
