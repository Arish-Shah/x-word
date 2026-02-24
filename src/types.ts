export type FormattedClues = Record<string, FormattedClueValue>;

export type FormattedClueValue = {
  id: string;
  number: number;
  clue: string;
  cells: string[];
};

export type IpuzFile = {
  title: string;
  dimensions: Dimensions;
  puzzle: IpuzPuzzle;
  clues: IpuzClues;
  solution: (string | null)[][];
};

export type Dimensions = {
  width: number;
  height: number;
};

export type IpuzPuzzle = IpuzPuzzleCell[][];

export type IpuzPuzzleCell = (string | number);

export type IpuzClues = {
  Across: IpuzClue[];
  Down: IpuzClue[];
};

export type IpuzClue = {
  number: number;
  clue: string;
} | [number, string];
