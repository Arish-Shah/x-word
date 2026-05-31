// src/core/data.ts
class Data {
  ipuz;
  clues;
  cellToClue;
  constructor(id, ipuz) {
    this.ipuz = ipuz;
    this.clues = this.parseClues(ipuz.clues);
    this.mapClueToCells(ipuz.dimensions, ipuz.puzzle);
    this.cellToClue = this.mapCellToClue();
  }
  parseClues(clues) {
    const parseClue = (clue, suffix) => Array.isArray(clue) ? [clue[0] + suffix, { number: clue[0], clue: clue[1], cells: [] }] : [clue.number + suffix, { ...clue, cells: [] }];
    return {
      Across: Object.fromEntries(clues.Across.map((clue) => parseClue(clue, "A"))),
      Down: Object.fromEntries(clues.Down.map((clue) => parseClue(clue, "D")))
    };
  }
  mapClueToCells(dimensions, puzzle) {
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
  mapCellToClue() {
    const mapDirection = (direction) => Object.fromEntries(Object.entries(this.clues[direction]).flatMap(([k, v]) => v.cells.map((cell) => [cell, k])));
    return {
      Across: mapDirection("Across"),
      Down: mapDirection("Down")
    };
  }
  static async init(url) {
    const response = await fetch(url);
    const json = await response.json();
    return new Data(url, json);
  }
}

// src/components/grid.ts
var template = document.createElement("template");
template.innerHTML = ``;

class XWordGrid extends HTMLElement {
  dimensions;
  puzzle;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  connectedCallback() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.shadowRoot.appendChild(svg);
  }
}
customElements.define("x-word-grid", XWordGrid);

// src/core/state.ts
class State {
  data;
  constructor(initialData) {
    this.data = initialData;
  }
  update(data) {
    this.data = data;
  }
}
var currentClue = new State(null);

// src/components/clues.ts
var template2 = document.createElement("template");
template2.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    ul {
      list-style-type: none;
    }
  </style>
  <div>
    <h3>across</h3>
    <ul></ul>
  </div>
  <div>
    <h3>down</h3>
    <ul></ul>
  </div>
`;

class XWordClues extends HTMLElement {
  clues;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template2.content.cloneNode(true));
  }
  connectedCallback() {
    const uls = this.shadowRoot.querySelectorAll("ul");
    uls[0].append(...Object.entries(this.clues.Across).map(this.createClue));
    uls[1].append(...Object.entries(this.clues.Down).map(this.createClue));
  }
  createClue([id, clue]) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${clue.number}</span><span>${clue.clue}</span>
    `;
    li.addEventListener("click", (_) => currentClue.update(id));
    return li;
  }
}
customElements.define("x-word-clues", XWordClues);

// src/core/styles.ts
var sheet = new CSSStyleSheet;
sheet.replaceSync(`
  @layer {
    :root {
      --x-word-bg: #000000;
      --x-word-fg: #ffffff;
      --x-word-select: #ffda00;
      --x-word-highlight: #a7d8ff;
      --x-word-font: georgia;
    }

    x-word {
      font-family: var(--x-word-font);
    }
  }
`);
if (!document.adoptedStyleSheets.includes(sheet)) {
  document.adoptedStyleSheets.push(sheet);
}

// src/x-word.ts
var template3 = document.createElement("template");
template3.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
    }
  </style>
`;

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template3.content.cloneNode(true));
  }
  async connectedCallback() {
    const data = await Data.init(this.src);
    const grid = document.createElement("x-word-grid");
    grid.dimensions = data.ipuz.dimensions;
    grid.puzzle = data.ipuz.puzzle;
    const clues = document.createElement("x-word-clues");
    clues.clues = data.clues;
    this.shadowRoot.appendChild(grid);
    this.shadowRoot.appendChild(clues);
  }
  get src() {
    return this.getAttribute("src");
  }
  set src(val) {
    this.setAttribute("src", val);
  }
}
customElements.define("x-word", XWord);
