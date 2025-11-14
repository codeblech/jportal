import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getDecimalPlaces() {
  return 2;
}

export function formatDecimal(value, places = 2) {
  if (typeof value === "number") {
    return value.toFixed(places);
  }
  return value;
}

export function getAttendanceDecimal() {
  return 2;
}

export function getGpaDecimal() {
  return 2;
}

export function getTargetGpaDecimal() {
  return 2;
}
