import type {
  Ipuz,
  IpuzClue,
  IpuzClues,
  IpuzDimensions,
  IpuzPuzzle,
  IpuzPuzzleCell,
  ParsedClue,
  ParsedClues,
  Dir,
} from "./types";

export class Data {
  clues: ParsedClues;

  constructor(id: string, ipuz: Ipuz) {
    this.clues = this.parseClues(ipuz.clues);
    this.mapClueToCells(ipuz.puzzle, ipuz.dimensions);
    console.log({ [id]: this.clues});
  }

  parseClues(clues: IpuzClues): ParsedClues {
    const parseClue = (clue: IpuzClue, suffix: Dir): [string, ParsedClue] =>
      Array.isArray(clue)
        ? [clue[0] + suffix, { number: clue[0], clue: clue[1], cells: [] }]
        : [clue.number + suffix, { ...clue, cells: [] }];

    return {
      Across: Object.fromEntries(clues.Across.map(clue => parseClue(clue, "A"))),
      Down: Object.fromEntries(clues.Down.map(clue => parseClue(clue, "D"))),
    };
  }

  mapClueToCells(puzzle: IpuzPuzzle, dimensions: IpuzDimensions) {
    const value = (cell: IpuzPuzzleCell) =>
      typeof cell === "object" && cell !== null ? cell.cell : cell;

    const walkDirection = (direction: Dir, x: number, y: number) => {
      const clues = direction === "A" ? this.clues.Across : this.clues.Down;

      for (let i = 0; i < y; i++) {
        let id: string | null = null;
        let cells = [];

        for (let j = 0; j < x; j++) {
          const [r, c] = direction === "A" ? [i, j] : [j, i];
          const cell = value(puzzle[r][c]);

          if (cell === null || cell === "#") {
            if (id && id in clues) clues[id].cells = cells;
            id = null; cells = [];
          } else {
            if (cell > 0 && !id) id = cell + direction;
            cells.push(r + "," + c);
          }
        }
        if (id && id in clues) clues[id].cells = cells;
      }
    };

    const { width, height } = dimensions;
    walkDirection("A", width, height);
    walkDirection("D", height, width);
  }

  static async init(url: string) {
    const response = await fetch(url);
    const json = await response.json();
    return new Data(url, json);
  }
}
