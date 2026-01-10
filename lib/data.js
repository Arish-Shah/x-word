export class Data {
  title = "";
  clues = { across: [], down: [] };
  dimensions = { width: 0, height: 0 };
  puzzle = [[]];

  async init(ipuzUrl) {
    const ipuz = await this.fetchIpuz(ipuzUrl);

    this.title = ipuz.title;
    this.dimensions = ipuz.dimensions;

    console.log(ipuz);
  }

  async fetchIpuz(url) {
    const response = await fetch(url);
    return (await response.json());
  }
}

  // parseIpuz(ipuz) {
  //   const { acrossClueMap, downClueMap } =
  //     this.mapClueCells(ipuz.puzzle, ipuz.dimensions);
  //
  //   this.#clues.across = ipuz.clues.Across.map(clue =>
  //     ({ ...clue, startIndex: acrossClueMap[clue.number][0] }));
  //   this.#clues.down = ipuz.clues.Down.map(clue =>
  //     ({ ...clue, startIndex: downClueMap[clue.number][0] }));
  // }
  //
  // mapClueCells(puzzle, dimensions) {
  //   const acrossClueMap = {};
  //   const downClueMap = {};
  //
  //   const parseCells = ({ row, col }, activeClueNum, clueMap) => {
  //     let cellValue = puzzle[row][col];
  //     if (cellValue && typeof cellValue === "object")
  //       cellValue = cellValue.cell;
  //
  //     switch (cellValue) {
  //       case "#": return null; // reset on black square
  //       case null: clueMap[activeClueNum].push(`${row},${col}`); break;
  //       default: {
  //         if (!activeClueNum) {
  //           activeClueNum = cellValue;
  //           clueMap[activeClueNum] = [`${row},${col}`];
  //         } else {
  //           clueMap[activeClueNum].push(`${row},${col}`);
  //         }
  //       }
  //     }
  //     return activeClueNum;
  //   };
  //
  //   for (let row = 0; row < dimensions.height; row++) {
  //     let activeClueNum = null;
  //     for (let col = 0; col < dimensions.width; col++) {
  //       activeClueNum = parseCells({ row, col }, activeClueNum, acrossClueMap);
  //     }
  //   }
  //
  //   for (let col = 0; col < dimensions.width; col++) {
  //     let activeClueNum = null;
  //     for (let row = 0; row < dimensions.height; row++) {
  //       activeClueNum = parseCells({ row, col }, activeClueNum, downClueMap);
  //     }
  //   }
  //
  //   return { acrossClueMap, downClueMap };
  // }
  //
  // getClues() {
  //   return this.#data.clues;
  // }

export const data = new Data();
