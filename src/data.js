// @ts-check

import * as Types from "./types.js";

class Data {
  /** @param {string} ipuzUrl  */
  async init(ipuzUrl) {
    const ipuz = await this.fetchIpuz(ipuzUrl);
    const cells = this.getCells(ipuz.puzzle);

    this.dimensions = ipuz.dimensions;
    this.clues = this.formatClues(ipuz.clues);
  }

  /** @param {Types.IpuzPuzzle} puzzle  */
  getCells(puzzle) {
    for (let r = 0; r < this.dimensions.height; r++) {}
  }

  /**
   * @param {Types.IpuzClues} clues
   * @returns {Types.FormattedClues}
   */
  formatClues(clues) {
    const Across = Object.fromEntries(
      clues.Across.map(clue => [clue[0] + "-Across", {
        number: clue[0],
        text: clue[1],
        cells: [],
      }]),
    );

    const Down = Object.fromEntries(
      clues.Down.map(clue => [clue[0] + "-Down", {
        number: clue[0],
        text: clue[1],
        cells: [],
      }]),
    );

    return { Across, Down };
  }

  /**
   * @param {string} url 
   * @returns {Promise<Types.IpuzFile>}
   */
  async fetchIpuz(url) {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }
}

export const data = new Data();
