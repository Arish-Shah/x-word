/* ipuz file types */
export type IpuzDimensions = {
  width: number;
  height: number;
};

export type IpuzPuzzleCell = number | "#" | 0 | null | { cell: number | "#" | 0; style?: any };
export type IpuzPuzzle = IpuzPuzzleCell[][];

export type IpuzClueItem = string | [number, string] | { number: number; clue: string };
export type IpuzClues = {
  Across: IpuzClueItem[];
  Down: IpuzClueItem[];
};

export type IpuzSolutionCell = string | "#" | 0 | null;
export type IpuzSolution = IpuzSolutionCell[][];

export type Ipuz = {
  title?: string;
  dimensions: IpuzDimensions;
  puzzle: IpuzPuzzle;
  clues: IpuzClues;
  solution: IpuzSolution;
};
