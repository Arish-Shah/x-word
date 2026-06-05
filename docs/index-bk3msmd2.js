// src/core/util.ts
var coords = (input) => input.join(",");
var getCellValue = (cell) => typeof cell === "object" && cell !== null ? cell.cell : cell;

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
    const parseClue = (clue, suffix) => Array.isArray(clue) ? [`${clue[0]}-${suffix}`, { number: clue[0], clue: clue[1], cells: [] }] : [`${clue.number}-${suffix}`, { ...clue, cells: [] }];
    return {
      Across: Object.fromEntries(clues.Across.map((clue) => parseClue(clue, "Across"))),
      Down: Object.fromEntries(clues.Down.map((clue) => parseClue(clue, "Down")))
    };
  }
  mapClueToCells(dimensions, puzzle) {
    const walkDirection = (direction, x, y) => {
      const clues = direction === "A" ? this.clues.Across : this.clues.Down;
      for (let i = 0;i < y; i++) {
        let id = null;
        let cells = [];
        for (let j = 0;j < x; j++) {
          const [r, c] = direction === "A" ? [i, j] : [j, i];
          const cell = getCellValue(puzzle[r][c]);
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
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    svg {
      width: 100%;
      min-width: min(100%, 300px);
    }

    rect {
      fill: var(--x-word-bg);
      stroke: var(--x-word-fg);
      stroke-width: 1;

      &.blocked {
        fill: var(--x-word-fg);
        pointer-events: none;
      }
    }
  </style>
`;

class XWordGrid extends HTMLElement {
  CELL_SIZE = 32;
  dimensions;
  puzzle;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  connectedCallback() {
    const { height, width } = this.dimensions;
    const gridHeight = height * this.CELL_SIZE + height + 1;
    const gridWidth = width * this.CELL_SIZE + width + 1;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${gridWidth} ${gridHeight}`);
    for (let r = 0;r < height; r++) {
      for (let c = 0;c < width; c++) {
        svg.appendChild(this.createCell(r, c));
      }
    }
    this.shadowRoot.appendChild(svg);
  }
  createCell(r, c) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.dataset.coord = coords([r, c]);
    let cell = getCellValue(this.puzzle[r][c]);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(this.CELL_SIZE * c + c + 1));
    rect.setAttribute("y", String(this.CELL_SIZE * r + r + 1));
    rect.setAttribute("width", String(this.CELL_SIZE));
    rect.setAttribute("height", String(this.CELL_SIZE));
    if (cell === "#")
      rect.classList.add("blocked");
    else if (cell === null)
      rect.classList.add("hidden");
    g.appendChild(rect);
    return g;
  }
}
customElements.define("x-word-grid", XWordGrid);

// src/core/signal.ts
class Signal {
  _value;
  subscribers;
  constructor(initialValue) {
    this._value = initialValue;
    this.subscribers = [];
  }
  get value() {
    return this._value;
  }
  set value(newValue) {
    const previous = this._value;
    this._value = newValue;
    this.subscribers.forEach((sub) => sub(this._value, previous));
  }
  subscribe(callback) {
    this.subscribers.push(callback);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((sub) => sub !== callback);
      }
    };
  }
}
var currentClue = new Signal(null);

// src/components/clues.ts
var template2 = document.createElement("template");
template2.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :host {
      font-size: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    h3 {
      font-size: 1.15rem;
      padding: 0.25rem 0;
      border-top: 1px solid var(--x-word-button);
    }

    h3::after {
      content: "";
      display: block;
      height: 1px;
      opacity: 0.15;
      background: var(--x-word-fg);
      margin-top: 1rem;
    }

    ul {
      list-style-type: none;
    }

    li {
      cursor: pointer;
      padding: 0.5rem 0;
      display: flex;
      gap: 0.5rem;

      &.selected {
        background: var(--x-word-highlight);
      }
    }

    span:first-of-type {
      width: 1.5rem;
      flex-shrink: 0;
      text-align: right;
      font-weight: bold;
    }

    @media (min-width: 980px) {
      :host {
        flex-direction: row;
      }
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
  currentClueSub;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template2.content.cloneNode(true));
  }
  connectedCallback() {
    const uls = this.shadowRoot.querySelectorAll("ul");
    uls[0].append(...Object.entries(this.clues.Across).map(this.createClue));
    uls[1].append(...Object.entries(this.clues.Down).map(this.createClue));
    this.currentClueSub = currentClue.subscribe((id, prevId) => this.highlight(id, prevId));
    currentClue.value = Object.keys(this.clues.Across)[0];
  }
  createClue([id, clue]) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${clue.number}</span><span>${clue.clue}</span>
    `;
    li.dataset.id = id;
    li.addEventListener("click", () => currentClue.value = id);
    return li;
  }
  highlight(id, prevId) {
    if (prevId)
      this.shadowRoot.querySelector(`[data-id="${prevId}"]`).classList.remove("selected");
    this.shadowRoot.querySelector(`[data-id="${id}"]`).classList.add("selected");
  }
  disconnectedCallback() {
    this.currentClueSub.unsubscribe();
  }
}
customElements.define("x-word-clues", XWordClues);

// src/core/styles.ts
var sheet = new CSSStyleSheet;
sheet.replaceSync(`
  @layer {
    :root {
      --x-word-bg: #ffffff;
      --x-word-fg: #000000;
      --x-word-selected: #ffda00;
      --x-word-highlight: #a7d8ff;
      --x-word-font: georgia;
      --x-word-button: #bb3b80;
    }

    x-word {
      font-family: var(--x-word-font);
      -webkit-tap-highlight-color: transparent;
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
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    h1 {
      font-size: 1.25rem;
      margin: 1rem 0;
    }

    @media (min-width: 740px) {
      :host {
        flex-direction: row;
      }
    }
  </style>

  <div class="container"></div>
  <div class="container"></div>
`;

class XWord extends HTMLElement {
  data;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template3.content.cloneNode(true));
  }
  async connectedCallback() {
    this.data = await Data.init(this.src);
    this.render();
  }
  render() {
    const containers = this.shadowRoot.querySelectorAll(".container");
    const heading = document.createElement("h1");
    heading.textContent = this.data.ipuz.title || "crossword";
    const grid = document.createElement("x-word-grid");
    grid.dimensions = this.data.ipuz.dimensions;
    grid.puzzle = this.data.ipuz.puzzle;
    const clues = document.createElement("x-word-clues");
    clues.clues = this.data.clues;
    containers[0].appendChild(heading);
    containers[0].appendChild(grid);
    containers[1].appendChild(clues);
  }
  get src() {
    return this.getAttribute("src");
  }
  set src(val) {
    this.setAttribute("src", val);
  }
}
customElements.define("x-word", XWord);
