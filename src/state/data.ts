import type {
  IpuzFile,
  Dimensions,
  FormattedClues,
  IpuzPuzzle,
  IpuzClues,
  FormattedClueValue,
} from "../types";

class Data {
  dimensions: Dimensions;
  clues: FormattedClues;

  async init(ipuzUrl: string) {
    const ipuz = await this.fetchIpuz(ipuzUrl);
    const clueToCells = this.generateCells(ipuz.puzzle);

    this.dimensions = ipuz.dimensions;
    this.clues = this.formatClues(ipuz.clues, clueToCells);
  }

  formatClues(clues: IpuzClues, clueToCells: Record<string, string[]>) {
    const format = (direction: "Across" | "Down"): FormattedClues => {
      return Object.fromEntries(clues[direction].map(clue => {
        if (Array.isArray(clue)) {
          const id = `${clue[0]}-${direction}`;
          return [id, { id, number: clue[0], clue: clue[1], cells: clueToCells[id] }];
        } else {
          const id = `${clue.number}-${direction}`;
          return [id, { id, ...clue, cells: clueToCells[id] }];
        }
      }));
    };

    return { ...format("Across"), ...format("Down") };
  }

  directionalClues() {
    // here
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

  async fetchIpuz(url: string): Promise<IpuzFile> {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
}

export const data = new Data();
