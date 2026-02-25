import type {
  IpuzFile,
  Dimensions,
  FormattedClues,
  IpuzPuzzle,
  IpuzClues,
} from "../types";

class Data {
  dimensions: Dimensions;
  puzzle: IpuzPuzzle;
  clues: FormattedClues;
  cellToClue: Record<string, { Across: string; Down: string; }>;

  async init(ipuzUrl: string) {
    const ipuz = await this.fetchIpuz(ipuzUrl);

    this.dimensions = ipuz.dimensions;
    this.puzzle = ipuz.puzzle;

    const clueToCells = this.generateCells(ipuz.puzzle);
    this.clues = this.formatClues(ipuz.clues, clueToCells);

    this.cellToClue = this.mapCellToClues();
  }

  mapCellToClues() {
    const cellToClueMap: Record<string, { Across: string; Down: string }> = {};

    for (const [clueId, clueData] of Object.entries(this.clues)) {
      const direction = clueId.endsWith("Across") ? "Across" : "Down";
      for (const cell of clueData.cells) {
        if (!cellToClueMap[cell]) {
          cellToClueMap[cell] = { Across: "", Down: "" };
        }
        cellToClueMap[cell][direction] = clueId;
      }
    }
    return cellToClueMap;
  }

  getPrevClue(clueId: string) {
    const clueIds = Object.keys(this.clues);
    const index = clueIds.indexOf(clueId);
    if (index === 0) return clueIds[clueIds.length - 1];
    return clueIds[index - 1];
  }

  getNextClue(clueId: string) {
    const clueIds = Object.keys(this.clues);
    const index = clueIds.indexOf(clueId);
    if (index === clueIds.length - 1) return clueIds[0];
    return clueIds[index + 1];
  }

  formatClues(clues: IpuzClues, clueToCells: Record<string, string[]>) {
    const format = (direction: "Across" | "Down"): FormattedClues => {
      return Object.fromEntries(clues[direction].map(clue => {
        const id = `${clue[0]}-${direction}`;
        return [id, {
          id,
          number: clue[0],
          clue: clue[1],
          cells: clueToCells[id]
        }];
      }));
    };
    return { ...format("Across"), ...format("Down") };
  }

  cluesByDirection() {
    const Across = Object.values(this.clues).filter((clue) =>
      clue.id.endsWith("Across"));
    const Down = Object.values(this.clues).filter((clue) =>
      clue.id.endsWith("Down"));
    return { Across, Down };
  }

  generateCells(puzzle: IpuzPuzzle) {
    const cellsMap = {};

    for (let r = 0; r < this.dimensions.height; r++) {
      let currentClue: string | number | null = null;

      for (let c = 0; c < this.dimensions.width; c++) {
        let cell = puzzle[r][c];

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
