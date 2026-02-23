export type FormattedClues = {
  Across: FormattedClue[];
  Down: FormattedClue[];
};

export type FormattedClue = {
  id: string;
  number: number;
  clue: string;
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

export type IpuzPuzzle = (string | number | IpuzPuzzleCellDetailed)[][];

export type IpuzPuzzleCellDetailed = {
  cell: number;
  style: {
    shapebg: "circle";
  };
};

export type IpuzClues = {
  Across: IpuzClue[];
  Down: IpuzClue[];
};

export type IpuzClue = {
  number: number;
  clue: string;
} | [number, string];
