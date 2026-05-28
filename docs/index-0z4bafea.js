// src/core/data.ts
class Data {
  clues;
  constructor(id, ipuz) {
    this.clues = this.parseClues(ipuz.clues);
    this.mapClueToCells(ipuz.puzzle, ipuz.dimensions);
    console.log({ [id]: this.clues });
  }
  parseClues(clues) {
    const parseClue = (clue, suffix) => Array.isArray(clue) ? [clue[0] + suffix, { number: clue[0], clue: clue[1], cells: [] }] : [clue.number + suffix, { ...clue, cells: [] }];
    return {
      Across: Object.fromEntries(clues.Across.map((clue) => parseClue(clue, "A"))),
      Down: Object.fromEntries(clues.Down.map((clue) => parseClue(clue, "D")))
    };
  }
  mapClueToCells(puzzle, dimensions) {
    const value = (cell) => typeof cell === "object" && cell !== null ? cell.cell : cell;
    const walkDirection = (direction, x, y) => {
      const clues = direction === "A" ? this.clues.Across : this.clues.Down;
      for (let i = 0;i < y; i++) {
        let id = null;
        let cells = [];
        for (let j = 0;j < x; j++) {
          const [r, c] = direction === "A" ? [i, j] : [j, i];
          const cell = value(puzzle[r][c]);
          if (cell === null || cell === "#") {
            if (id && id in clues)
              clues[id].cells = cells;
            id = null;
            cells = [];
          } else {
            if (cell > 0 && !id)
              id = cell + direction;
            cells.push(r + "," + c);
          }
        }
        if (id && id in clues)
          clues[id].cells = cells;
      }
    };
    const { width, height } = dimensions;
    walkDirection("A", width, height);
    walkDirection("D", height, width);
  }
  static async init(url) {
    const response = await fetch(url);
    const json = await response.json();
    return new Data(url, json);
  }
}

// src/x-word.ts
var template = document.createElement("template");
template.innerHTML = ``;

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  async connectedCallback() {
    const data = await Data.init(this.src);
  }
  get src() {
    return this.getAttribute("src");
  }
  set src(val) {
    this.setAttribute("src", val);
  }
}
customElements.define("x-word", XWord);
