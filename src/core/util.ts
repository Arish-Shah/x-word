import type { IpuzPuzzleCell } from "./types";

export const coords = (input: [number, number]) => input.join(",");

export const parse = (input: string) =>
  input.split(",").map(Number) as [number, number];

export const getCellValue = (cell: IpuzPuzzleCell) =>
  typeof cell === "object" && cell !== null ? cell.cell : cell;
