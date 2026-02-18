import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** ASCII control character names for bytes 0–31 and 127. */
const ASCII_CONTROL_NAMES: Record<number, string> = {
  0: "NUL", 1: "SOH", 2: "STX", 3: "ETX", 4: "EOT", 5: "ENQ", 6: "ACK", 7: "BEL",
  8: "BS", 9: "TAB", 10: "LF", 11: "VT", 12: "FF", 13: "CR", 14: "SO", 15: "SI",
  16: "DLE", 17: "DC1", 18: "DC2", 19: "DC3", 20: "DC4", 21: "NAK", 22: "SYN",
  23: "ETB", 24: "CAN", 25: "EM", 26: "SUB", 27: "ESC", 28: "FS", 29: "GS",
  30: "RS", 31: "US", 127: "DEL",
};

/** Returns a display string for a byte as ASCII: control name (0–31, 127), character (32–126), or "—" (128–255). */
export function formatByteAsAscii(byte: number): string {
  if (byte in ASCII_CONTROL_NAMES) return ASCII_CONTROL_NAMES[byte as keyof typeof ASCII_CONTROL_NAMES];
  if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
  return "—";
}
