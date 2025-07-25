import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getDecimalPlaces() {
  const saved = localStorage.getItem("decimalPlaces");
  const n = saved ? parseInt(saved) : 1;
  return isNaN(n) ? 1 : Math.max(0, Math.min(6, n));
}

export function formatDecimal(value, places) {
  const decimals = typeof places === "number" ? places : getDecimalPlaces();
  if (typeof value === "number") {
    return value.toFixed(decimals);
  }
  return value;
}

export function getAttendanceDecimal() {
  const saved = localStorage.getItem("attendanceDecimal");
  if (saved !== null) return Math.max(0, Math.min(6, parseInt(saved)));
  return getDecimalPlaces();
}

export function getGpaDecimal() {
  const saved = localStorage.getItem("gpaDecimal");
  if (saved !== null) return Math.max(0, Math.min(6, parseInt(saved)));
  return getDecimalPlaces();
}

export function getTargetGpaDecimal() {
  const saved = localStorage.getItem("targetGpaDecimal");
  if (saved !== null) return Math.max(0, Math.min(6, parseInt(saved)));
  return getDecimalPlaces();
}
