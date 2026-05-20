import type {
  Ipuz,
  IpuzClues,
  IpuzClueItem,
  ParsedClueItem,
  ParsedClues
} from "./types";

export class Data {
  clues: ParsedClues;

  constructor(id: string, ipuz: Ipuz) {
    this.clues = this.parseClues(ipuz.clues);
  }

  parseClues(clues: IpuzClues): ParsedClues {
    const parseClueItem = (item: IpuzClueItem, suffix: "A" | "D"): ParsedClueItem => {
      if (Array.isArray(item)) return {
        id: item[0] + suffix,
        label: item[0].toString(),
        clue: item[1]
      };
      else if ("number" in item) return {
        id: item.number + suffix,
        label: item.number.toString(),
        clue: item.clue
      };
      else return {
        id: item.label + suffix,
        label: item.label,
        clue: item.clue
      };
    };

    return {
      Across: clues.Across.map(item => parseClueItem(item, "A")),
      Down: clues.Down.map(item => parseClueItem(item, "D")),
    };
  }

  static async init(url: string) {
    const response = await fetch(url);
    const json = await response.json();
    return new Data(url.slice(0, 31), json);
  }
}
