// Formatted Clues Types
export type FormattedClues = Record<string, FormattedClueValue>;

export type FormattedClueValue = {
  id: string;
  number: number;
  clue: string;
  cells: string[];
};

// Ipuz File Types
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

/**
 * blocked/black cells are marked with "#"
 * cells with labels contain label number
 * cells without labels have 0
 */
export type IpuzPuzzleCell = (string | number);

export type IpuzClues = {
  Across: IpuzClue[];
  Down: IpuzClue[];
};

export type IpuzClue = {
  number: number;
  clue: string;
} | [number, string];

/**
 * blocked cells are marked with null
 */
export type IpuzSolutionCell = (string | null);
