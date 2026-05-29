export type Direction = "Across" | "Down";

/* ipuz file types */
export type IpuzDimensions = {
  width: number;
  height: number;
};

export type IpuzPuzzleCell = number | "#" | 0 | null | { cell: number | "#" | 0; style?: any };
export type IpuzPuzzle = IpuzPuzzleCell[][];

export type IpuzClue = [number, string] | { number: number; clue: string };
export type IpuzClues = Record<Direction, IpuzClue[]>;

export type IpuzSolutionCell = string | "#" | 0 | null;
export type IpuzSolution = IpuzSolutionCell[][];

export type Ipuz = {
  title?: string;
  dimensions: IpuzDimensions;
  puzzle: IpuzPuzzle;
  clues: IpuzClues;
  solution: IpuzSolution;
};

/* parsed types */
export type ParsedClue = { number: number; clue: string, cells: string[] };
export type ParsedClues = Record<Direction, Record<string, ParsedClue>>;

/* misc types */
export type Dir = "A" | "D";
