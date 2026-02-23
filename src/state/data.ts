import type {
  IpuzFile,
  Dimensions,
  IpuzClues,
  FormattedClues,
  IpuzPuzzle,
  FormattedClue,
} from "../types";

class Data {
  dimensions: Dimensions;
  clues: FormattedClues;
  cells: Record<string, (string | null)>;
  cluesMap: Record<string, FormattedClue>;

  async init(ipuzUrl: string) {
    const ipuz = await this.fetchIpuz(ipuzUrl);
    this.dimensions = ipuz.dimensions;

    this.cells = this.generateCells(ipuz.puzzle);
    this.clues = this.formatClues(ipuz.clues);

    this.cluesMap = this.generateCluesMap();
    console.log(this.cluesMap);
  }

  generateCluesMap() {
    const cluesMap = Object.fromEntries(this.clues.Across.map(clue => {
      return [clue.id, { ...clue, cells: this.cells[clue.id] }];
    }));
    return cluesMap;
  }

  generateCells(puzzle: IpuzPuzzle) {
    const cellsMap = {};

    for (let r = 0; r < this.dimensions.height; r++) {
      let currentClue: string | number | null = null;

      for (let c = 0; c < this.dimensions.width; c++) {
        let cell = puzzle[r][c];
        if (typeof cell === "object") cell = cell.cell;

        switch (cell) {
          case "#": currentClue = null; break;
          default: {
            if (!currentClue) {
              currentClue = cell;
              cellsMap[`${currentClue}-Across`] = [r + "," + c];
            } else {
              cellsMap[`${currentClue}-Across`].push(r + "," + c);
            }
          }
        }
      }

      currentClue = null;
    }

    for (let c = 0; c < this.dimensions.width; c++) {
      let currentClue: string | number | null = null;

      for (let r = 0; r < this.dimensions.height; r++) {
        let cell = puzzle[r][c];
        if (typeof cell === "object") cell = cell.cell;

        switch (cell) {
          case "#": currentClue = null; break;
          default: {
            if (!currentClue) {
              currentClue = cell;
              cellsMap[`${currentClue}-Down`] = [r + "," + c];
            } else {
              cellsMap[`${currentClue}-Down`].push(r + "," + c);
            }
          }
        }
      }

      currentClue = null;
    }

    return cellsMap;
  }

  formatClues(clues: IpuzClues) {
    const Across = clues.Across.map(clue => {
      if (Array.isArray(clue)) {
        return { id: clue[0] + "-Across", number: clue[0], clue: clue[1] };
      } else {
        return { ...clue, id: clue.number + "-Across" };
      }
    });

    const Down = clues.Down.map(clue => {
      if (Array.isArray(clue)) {
        return { id: clue[0] + "-Down", number: clue[0], clue: clue[1] };
      } else {
        return { ...clue, id: clue.number + "-Down" };
      }
    });

    return { Across, Down } satisfies FormattedClues;
  }

  async fetchIpuz(url: string): Promise<IpuzFile> {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
}

export const data = new Data();
