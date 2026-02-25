(() => {
  // src/state/data.ts
  var Data = class {
    dimensions;
    puzzle;
    clues;
    cellToClue;
    async init(ipuzUrl) {
      const ipuz = await this.fetchIpuz(ipuzUrl);
      this.dimensions = ipuz.dimensions;
      this.puzzle = ipuz.puzzle;
      const clueToCells = this.generateCells(ipuz.puzzle);
      this.clues = this.formatClues(ipuz.clues, clueToCells);
      this.cellToClue = this.mapCellToClues();
    }
    mapCellToClues() {
      const cellToClueMap = {};
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
    getPrevClue(clueId) {
      const clueIds = Object.keys(this.clues);
      const index = clueIds.indexOf(clueId);
      if (index === 0) return clueIds[clueIds.length - 1];
      return clueIds[index - 1];
    }
    getNextClue(clueId) {
      const clueIds = Object.keys(this.clues);
      const index = clueIds.indexOf(clueId);
      if (index === clueIds.length - 1) return clueIds[0];
      return clueIds[index + 1];
    }
    formatClues(clues, clueToCells) {
      const format = (direction) => {
        return Object.fromEntries(clues[direction].map((clue) => {
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
      const Across = Object.values(this.clues).filter((clue) => clue.id.endsWith("Across"));
      const Down = Object.values(this.clues).filter((clue) => clue.id.endsWith("Down"));
      return { Across, Down };
    }
    generateCells(puzzle) {
      const cellsMap = {};
      for (let r = 0; r < this.dimensions.height; r++) {
        let currentClue = null;
        for (let c = 0; c < this.dimensions.width; c++) {
          let cell = puzzle[r][c];
          switch (cell) {
            case "#":
              currentClue = null;
              break;
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
        let currentClue = null;
        for (let r = 0; r < this.dimensions.height; r++) {
          let cell = puzzle[r][c];
          switch (cell) {
            case "#":
              currentClue = null;
              break;
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
    async fetchIpuz(url) {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    }
  };
  var data = new Data();

  // src/state/store.ts
  var Store = class {
    state;
    listeners;
    constructor(initialState) {
      this.state = initialState;
      this.listeners = [];
    }
    update(newState) {
      const oldState = this.state;
      if (newState !== oldState) {
        this.state = newState;
        this.notifyAll(newState, oldState);
      }
    }
    notifyAll(newState, oldState) {
      this.listeners.forEach((listener) => listener(newState, oldState));
    }
    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        const index = this.listeners.indexOf(listener);
        this.listeners.splice(index, 1);
      };
    }
  };
  var currentClueStore = new Store(null);
  var currentCellStore = new Store(null);
  currentClueStore.subscribe((newValue) => {
    if (newValue) {
      currentCellStore.update(data.clues[newValue].cells[0]);
    }
  });

  // src/components/nav.ts
  var template = document.createElement("template");
  template.innerHTML = `
  <style>
    :host {
      display: flex;
    }

    div {
      width: 300px;
    }
  </style>

  <button>prev</button>
  <div>
    <strong></strong>
    <span></span>
  </div>
  <button>next</button>
`;
  var XWordNav = class extends HTMLElement {
    subscription;
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    connectedCallback() {
      const buttons = this.shadowRoot.querySelectorAll("button");
      const strong = this.shadowRoot.querySelector("strong");
      const span = this.shadowRoot.querySelector("span");
      this.subscription = currentClueStore.subscribe((newVal) => {
        if (newVal) {
          strong.textContent = newVal.split("-").join(" ");
          span.textContent = data.clues[newVal].clue;
        }
      });
      buttons[0].addEventListener("click", (_) => {
        if (currentClueStore.state)
          currentClueStore.update(data.getPrevClue(currentClueStore.state));
      });
      buttons[1].addEventListener("click", (_) => {
        if (currentClueStore.state)
          currentClueStore.update(data.getNextClue(currentClueStore.state));
      });
    }
    disconnectedCallback() {
      this.subscription();
    }
  };
  customElements.define("x-word-nav", XWordNav);

  // src/components/clues.ts
  var template2 = document.createElement("template");
  template2.innerHTML = `
  <style>
    .highlight {
      background: yellow;
    }
  </style>
  <div>
    <strong>across</strong>
    <ul></ul>
  </div>
  <div>
    <strong>down</strong>
    <ul></ul>
  </div>
`;
  var XWordClues = class extends HTMLElement {
    subscription;
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template2.content.cloneNode(true));
    }
    connectedCallback() {
      const uls = this.shadowRoot.querySelectorAll("ul");
      const clues = data.cluesByDirection();
      uls[0].append(...clues.Across.map(this.createClueItem));
      uls[1].append(...clues.Down.map(this.createClueItem));
      this.subscription = currentClueStore.subscribe((newValue, oldValue) => {
        if (oldValue) {
          this.shadowRoot.querySelector(`[data-id="${oldValue}"]`).classList.remove("highlight");
        }
        this.shadowRoot.querySelector(`[data-id="${newValue}"]`).classList.add("highlight");
      });
      currentClueStore.update(clues.Across[0].id);
    }
    createClueItem({ id, number, clue }) {
      const li = document.createElement("li");
      li.dataset.id = id;
      li.innerHTML = `<span>${number}</span><span>${clue}</span>`;
      li.addEventListener("click", () => {
        currentClueStore.update(id);
      });
      return li;
    }
    disconnectedCallback() {
      this.subscription();
    }
  };
  customElements.define("x-word-clues", XWordClues);

  // src/util.ts
  function createSelector(indices) {
    const left = '[data-id="';
    const right = '"]';
    return left + indices.join(`${right}, ${left}`) + right;
  }

  // src/components/cell.ts
  var template3 = document.createElement("template");
  template3.innerHTML = `
  <style>
    * { box-sizing: border-box; }

    :host {
      position: relative;
    }

    :host(.highlight) {
      background: yellow;
    }

    :host([blocked]) {
      background: black;
    }

    :host([label])::before {
      content: attr(label);
      position: absolute;
      top: 2px;
      left: 2px;
    }

    input {
      width: 100%;
      aspect-ratio: 1 / 1;
      text-align: center;
      outline: 0;
      border: 1px solid black;
      background: transparent;

      &:focus {
        background: red;
      }
    }

  </style>
  <input type="text" />
`;
  var XWordCell = class extends HTMLElement {
    input;
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template3.content.cloneNode(true));
    }
    connectedCallback() {
      this.input = this.shadowRoot.querySelector("input");
      this.input.addEventListener("click", () => {
        const currentDirection = currentClueStore.state?.split("-")[1];
        currentClueStore.update(data.cellToClue[this.dataset.id][currentDirection]);
        this.input.focus();
      });
    }
    get blocked() {
      return this.hasAttribute("blocked");
    }
    set blocked(val) {
      if (val) {
        this.setAttribute("blocked", "");
      } else this.removeAttribute("blocked");
    }
    get label() {
      return this.getAttribute("label");
    }
    set label(val) {
      this.setAttribute("label", val);
    }
    highlight() {
      this.classList.toggle("highlight");
    }
    focus() {
      this.input.focus();
    }
  };
  customElements.define("x-word-cell", XWordCell);

  // src/components/grid.ts
  var template4 = document.createElement("template");
  template4.innerHTML = `
  <style>
    :host {
      display: grid;
    }
  </style>
`;
  var XWordGrid = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template4.content.cloneNode(true));
    }
    connectedCallback() {
      this.style.gridTemplateColumns = `repeat(${data.dimensions.width}, 1fr)`;
      for (let r = 0; r < data.dimensions.height; r++) {
        for (let c = 0; c < data.dimensions.width; c++) {
          this.shadowRoot.appendChild(this.createCell(`${r},${c}`, data.puzzle[r][c]));
        }
      }
      currentClueStore.subscribe((newValue, oldValue) => {
        const indices = [];
        if (newValue) indices.push(...data.clues[newValue].cells);
        if (oldValue) indices.push(...data.clues[oldValue].cells);
        this.highlightCells(indices);
      });
      currentCellStore.subscribe((newValue) => {
        if (newValue) {
          this.focusCell(newValue);
        }
      });
    }
    createCell(id, cellData) {
      const cellEl = document.createElement("x-word-cell");
      cellEl.dataset.id = id;
      if (cellData === "#") cellEl.blocked = true;
      else if (+cellData > 0) cellEl.label = cellData.toString();
      return cellEl;
    }
    highlightCells(indices) {
      const cells = this.shadowRoot.querySelectorAll(createSelector(indices));
      cells.forEach((cell) => cell.highlight());
    }
    focusCell(index) {
      this.shadowRoot.querySelector(`[data-id="${index}"]`).focus();
    }
  };
  customElements.define("x-word-grid", XWordGrid);

  // src/x-word.ts
  var XWord = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {
      await data.init(this.src);
      const nav = document.createElement("x-word-nav");
      const grid = document.createElement("x-word-grid");
      const clues = document.createElement("x-word-clues");
      this.shadowRoot.appendChild(nav);
      this.shadowRoot.appendChild(grid);
      this.shadowRoot.appendChild(clues);
    }
    get src() {
      return this.getAttribute("src");
    }
    set src(val) {
      this.setAttribute("src", val);
    }
  };
  customElements.define("x-word", XWord);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3N0YXRlL2RhdGEudHMiLCAiLi4vc3JjL3N0YXRlL3N0b3JlLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL25hdi50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jbHVlcy50cyIsICIuLi9zcmMvdXRpbC50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jZWxsLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2dyaWQudHMiLCAiLi4vc3JjL3gtd29yZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUge1xuICBJcHV6RmlsZSxcbiAgRGltZW5zaW9ucyxcbiAgRm9ybWF0dGVkQ2x1ZXMsXG4gIElwdXpQdXp6bGUsXG4gIElwdXpDbHVlcyxcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmNsYXNzIERhdGEge1xuICBkaW1lbnNpb25zOiBEaW1lbnNpb25zO1xuICBwdXp6bGU6IElwdXpQdXp6bGU7XG4gIGNsdWVzOiBGb3JtYXR0ZWRDbHVlcztcbiAgY2VsbFRvQ2x1ZTogUmVjb3JkPHN0cmluZywgeyBBY3Jvc3M6IHN0cmluZzsgRG93bjogc3RyaW5nOyB9PjtcblxuICBhc3luYyBpbml0KGlwdXpVcmw6IHN0cmluZykge1xuICAgIGNvbnN0IGlwdXogPSBhd2FpdCB0aGlzLmZldGNoSXB1eihpcHV6VXJsKTtcblxuICAgIHRoaXMuZGltZW5zaW9ucyA9IGlwdXouZGltZW5zaW9ucztcbiAgICB0aGlzLnB1enpsZSA9IGlwdXoucHV6emxlO1xuXG4gICAgY29uc3QgY2x1ZVRvQ2VsbHMgPSB0aGlzLmdlbmVyYXRlQ2VsbHMoaXB1ei5wdXp6bGUpO1xuICAgIHRoaXMuY2x1ZXMgPSB0aGlzLmZvcm1hdENsdWVzKGlwdXouY2x1ZXMsIGNsdWVUb0NlbGxzKTtcblxuICAgIHRoaXMuY2VsbFRvQ2x1ZSA9IHRoaXMubWFwQ2VsbFRvQ2x1ZXMoKTtcbiAgfVxuXG4gIG1hcENlbGxUb0NsdWVzKCkge1xuICAgIGNvbnN0IGNlbGxUb0NsdWVNYXA6IFJlY29yZDxzdHJpbmcsIHsgQWNyb3NzOiBzdHJpbmc7IERvd246IHN0cmluZyB9PiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBbY2x1ZUlkLCBjbHVlRGF0YV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5jbHVlcykpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGNsdWVJZC5lbmRzV2l0aChcIkFjcm9zc1wiKSA/IFwiQWNyb3NzXCIgOiBcIkRvd25cIjtcbiAgICAgIGZvciAoY29uc3QgY2VsbCBvZiBjbHVlRGF0YS5jZWxscykge1xuICAgICAgICBpZiAoIWNlbGxUb0NsdWVNYXBbY2VsbF0pIHtcbiAgICAgICAgICBjZWxsVG9DbHVlTWFwW2NlbGxdID0geyBBY3Jvc3M6IFwiXCIsIERvd246IFwiXCIgfTtcbiAgICAgICAgfVxuICAgICAgICBjZWxsVG9DbHVlTWFwW2NlbGxdW2RpcmVjdGlvbl0gPSBjbHVlSWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjZWxsVG9DbHVlTWFwO1xuICB9XG5cbiAgZ2V0UHJldkNsdWUoY2x1ZUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbHVlSWRzID0gT2JqZWN0LmtleXModGhpcy5jbHVlcyk7XG4gICAgY29uc3QgaW5kZXggPSBjbHVlSWRzLmluZGV4T2YoY2x1ZUlkKTtcbiAgICBpZiAoaW5kZXggPT09IDApIHJldHVybiBjbHVlSWRzW2NsdWVJZHMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGNsdWVJZHNbaW5kZXggLSAxXTtcbiAgfVxuXG4gIGdldE5leHRDbHVlKGNsdWVJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2x1ZUlkcyA9IE9iamVjdC5rZXlzKHRoaXMuY2x1ZXMpO1xuICAgIGNvbnN0IGluZGV4ID0gY2x1ZUlkcy5pbmRleE9mKGNsdWVJZCk7XG4gICAgaWYgKGluZGV4ID09PSBjbHVlSWRzLmxlbmd0aCAtIDEpIHJldHVybiBjbHVlSWRzWzBdO1xuICAgIHJldHVybiBjbHVlSWRzW2luZGV4ICsgMV07XG4gIH1cblxuICBmb3JtYXRDbHVlcyhjbHVlczogSXB1ekNsdWVzLCBjbHVlVG9DZWxsczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+KSB7XG4gICAgY29uc3QgZm9ybWF0ID0gKGRpcmVjdGlvbjogXCJBY3Jvc3NcIiB8IFwiRG93blwiKTogRm9ybWF0dGVkQ2x1ZXMgPT4ge1xuICAgICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhjbHVlc1tkaXJlY3Rpb25dLm1hcChjbHVlID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBgJHtjbHVlWzBdfS0ke2RpcmVjdGlvbn1gO1xuICAgICAgICByZXR1cm4gW2lkLCB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgbnVtYmVyOiBjbHVlWzBdLFxuICAgICAgICAgIGNsdWU6IGNsdWVbMV0sXG4gICAgICAgICAgY2VsbHM6IGNsdWVUb0NlbGxzW2lkXVxuICAgICAgICB9XTtcbiAgICAgIH0pKTtcbiAgICB9O1xuICAgIHJldHVybiB7IC4uLmZvcm1hdChcIkFjcm9zc1wiKSwgLi4uZm9ybWF0KFwiRG93blwiKSB9O1xuICB9XG5cbiAgY2x1ZXNCeURpcmVjdGlvbigpIHtcbiAgICBjb25zdCBBY3Jvc3MgPSBPYmplY3QudmFsdWVzKHRoaXMuY2x1ZXMpLmZpbHRlcigoY2x1ZSkgPT5cbiAgICAgIGNsdWUuaWQuZW5kc1dpdGgoXCJBY3Jvc3NcIikpO1xuICAgIGNvbnN0IERvd24gPSBPYmplY3QudmFsdWVzKHRoaXMuY2x1ZXMpLmZpbHRlcigoY2x1ZSkgPT5cbiAgICAgIGNsdWUuaWQuZW5kc1dpdGgoXCJEb3duXCIpKTtcbiAgICByZXR1cm4geyBBY3Jvc3MsIERvd24gfTtcbiAgfVxuXG4gIGdlbmVyYXRlQ2VsbHMocHV6emxlOiBJcHV6UHV6emxlKSB7XG4gICAgY29uc3QgY2VsbHNNYXAgPSB7fTtcblxuICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICBsZXQgY3VycmVudENsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICBmb3IgKGxldCBjID0gMDsgYyA8IHRoaXMuZGltZW5zaW9ucy53aWR0aDsgYysrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuXG4gICAgICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgICAgIGNhc2UgXCIjXCI6IGN1cnJlbnRDbHVlID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Q2x1ZSkge1xuICAgICAgICAgICAgICBjdXJyZW50Q2x1ZSA9IGNlbGw7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1BY3Jvc3NgXSA9IFtyICsgXCIsXCIgKyBjXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1BY3Jvc3NgXS5wdXNoKHIgKyBcIixcIiArIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgdGhpcy5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgIGxldCBjdXJyZW50Q2x1ZTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuXG4gICAgICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgICAgIGNhc2UgXCIjXCI6IGN1cnJlbnRDbHVlID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Q2x1ZSkge1xuICAgICAgICAgICAgICBjdXJyZW50Q2x1ZSA9IGNlbGw7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1Eb3duYF0gPSBbciArIFwiLFwiICsgY107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tRG93bmBdLnB1c2gociArIFwiLFwiICsgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjdXJyZW50Q2x1ZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjZWxsc01hcDtcbiAgfVxuXG4gIGFzeW5jIGZldGNoSXB1eih1cmw6IHN0cmluZyk6IFByb21pc2U8SXB1ekZpbGU+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZGF0YSA9IG5ldyBEYXRhKCk7XG4iLCAiaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcblxuY2xhc3MgU3RvcmU8VD4ge1xuICBzdGF0ZTogVDtcbiAgbGlzdGVuZXJzOiAoKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkgPT4gdm9pZClbXTtcblxuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGU6IFQpIHtcbiAgICB0aGlzLnN0YXRlID0gaW5pdGlhbFN0YXRlO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cblxuICB1cGRhdGUobmV3U3RhdGU6IFQpIHtcbiAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKG5ld1N0YXRlICE9PSBvbGRTdGF0ZSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IG5ld1N0YXRlO1xuICAgICAgdGhpcy5ub3RpZnlBbGwobmV3U3RhdGUsIG9sZFN0YXRlKTtcbiAgICB9XG4gIH1cblxuICBub3RpZnlBbGwobmV3U3RhdGU6IFQsIG9sZFN0YXRlOiBUKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcihuZXdTdGF0ZSwgb2xkU3RhdGUpKTtcbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkgPT4gdm9pZCkge1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGN1cnJlbnRDbHVlU3RvcmUgPSBuZXcgU3RvcmU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5leHBvcnQgY29uc3QgY3VycmVudENlbGxTdG9yZSA9IG5ldyBTdG9yZTxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuY3VycmVudENsdWVTdG9yZS5zdWJzY3JpYmUoKG5ld1ZhbHVlKSA9PiB7XG4gIGlmIChuZXdWYWx1ZSkge1xuICAgIGN1cnJlbnRDZWxsU3RvcmUudXBkYXRlKGRhdGEuY2x1ZXNbbmV3VmFsdWVdLmNlbGxzWzBdKTtcbiAgfVxufSk7XG4iLCAiaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50Q2x1ZVN0b3JlIH0gZnJvbSBcIi4uL3N0YXRlL3N0b3JlXCI7XG5cbmNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xudGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8c3R5bGU+XG4gICAgOmhvc3Qge1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICB9XG5cbiAgICBkaXYge1xuICAgICAgd2lkdGg6IDMwMHB4O1xuICAgIH1cbiAgPC9zdHlsZT5cblxuICA8YnV0dG9uPnByZXY8L2J1dHRvbj5cbiAgPGRpdj5cbiAgICA8c3Ryb25nPjwvc3Ryb25nPlxuICAgIDxzcGFuPjwvc3Bhbj5cbiAgPC9kaXY+XG4gIDxidXR0b24+bmV4dDwvYnV0dG9uPlxuYDtcblxuY2xhc3MgWFdvcmROYXYgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIHN1YnNjcmlwdGlvbjogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBjb25zdCBidXR0b25zID0gdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uXCIpO1xuICAgIGNvbnN0IHN0cm9uZyA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihcInN0cm9uZ1wiKTtcbiAgICBjb25zdCBzcGFuID0gdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKFwic3BhblwiKTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gY3VycmVudENsdWVTdG9yZS5zdWJzY3JpYmUoKG5ld1ZhbCkgPT4ge1xuICAgICAgaWYgKG5ld1ZhbCkge1xuICAgICAgICBzdHJvbmchLnRleHRDb250ZW50ID0gbmV3VmFsLnNwbGl0KFwiLVwiKS5qb2luKFwiIFwiKTtcbiAgICAgICAgc3BhbiEudGV4dENvbnRlbnQgPSBkYXRhLmNsdWVzW25ld1ZhbF0uY2x1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGJ1dHRvbnNbMF0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF8gPT4ge1xuICAgICAgaWYgKGN1cnJlbnRDbHVlU3RvcmUuc3RhdGUpXG4gICAgICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGRhdGEuZ2V0UHJldkNsdWUoY3VycmVudENsdWVTdG9yZS5zdGF0ZSkpO1xuICAgIH0pO1xuXG4gICAgYnV0dG9uc1sxXS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgXyA9PiB7XG4gICAgICBpZiAoY3VycmVudENsdWVTdG9yZS5zdGF0ZSlcbiAgICAgICAgY3VycmVudENsdWVTdG9yZS51cGRhdGUoZGF0YS5nZXROZXh0Q2x1ZShjdXJyZW50Q2x1ZVN0b3JlLnN0YXRlKSk7XG4gICAgfSk7XG4gIH1cblxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbigpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZC1uYXZcIiwgWFdvcmROYXYpO1xuIiwgImltcG9ydCB0eXBlIHsgRm9ybWF0dGVkQ2x1ZVZhbHVlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4uL3N0YXRlL2RhdGFcIjtcbmltcG9ydCB7IGN1cnJlbnRDbHVlU3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICAuaGlnaGxpZ2h0IHtcbiAgICAgIGJhY2tncm91bmQ6IHllbGxvdztcbiAgICB9XG4gIDwvc3R5bGU+XG4gIDxkaXY+XG4gICAgPHN0cm9uZz5hY3Jvc3M8L3N0cm9uZz5cbiAgICA8dWw+PC91bD5cbiAgPC9kaXY+XG4gIDxkaXY+XG4gICAgPHN0cm9uZz5kb3duPC9zdHJvbmc+XG4gICAgPHVsPjwvdWw+XG4gIDwvZGl2PlxuYDtcblxuY2xhc3MgWFdvcmRDbHVlcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgc3Vic2NyaXB0aW9uOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnN0IHVscyA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvckFsbChcInVsXCIpO1xuICAgIGNvbnN0IGNsdWVzID0gZGF0YS5jbHVlc0J5RGlyZWN0aW9uKCk7XG5cbiAgICB1bHNbMF0uYXBwZW5kKC4uLmNsdWVzLkFjcm9zcy5tYXAodGhpcy5jcmVhdGVDbHVlSXRlbSkpO1xuICAgIHVsc1sxXS5hcHBlbmQoLi4uY2x1ZXMuRG93bi5tYXAodGhpcy5jcmVhdGVDbHVlSXRlbSkpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24gPSBjdXJyZW50Q2x1ZVN0b3JlLnN1YnNjcmliZSgobmV3VmFsdWUsIG9sZFZhbHVlKSA9PiB7XG4gICAgICBpZiAob2xkVmFsdWUpIHtcbiAgICAgICAgdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7b2xkVmFsdWV9XCJdYCkhXG4gICAgICAgICAgLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWdobGlnaHRcIik7XG4gICAgICB9XG4gICAgICB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtuZXdWYWx1ZX1cIl1gKSFcbiAgICAgICAgLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gICAgfSk7XG5cbiAgICBjdXJyZW50Q2x1ZVN0b3JlLnVwZGF0ZShjbHVlcy5BY3Jvc3NbMF0uaWQpO1xuICB9XG5cbiAgY3JlYXRlQ2x1ZUl0ZW0oeyBpZCwgbnVtYmVyLCBjbHVlIH06IEZvcm1hdHRlZENsdWVWYWx1ZSkge1xuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgIGxpLmRhdGFzZXQuaWQgPSBpZDtcbiAgICBsaS5pbm5lckhUTUwgPSBgPHNwYW4+JHtudW1iZXJ9PC9zcGFuPjxzcGFuPiR7Y2x1ZX08L3NwYW4+YDtcblxuICAgIGxpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICBjdXJyZW50Q2x1ZVN0b3JlLnVwZGF0ZShpZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGxpO1xuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24oKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtY2x1ZXNcIiwgWFdvcmRDbHVlcyk7XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlbGVjdG9yKGluZGljZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IGxlZnQgPSAnW2RhdGEtaWQ9XCInO1xuICBjb25zdCByaWdodCA9ICdcIl0nO1xuICByZXR1cm4gbGVmdCArIGluZGljZXMuam9pbihgJHtyaWdodH0sICR7bGVmdH1gKSArIHJpZ2h0O1xufVxuIiwgImltcG9ydCB7IGRhdGEgfSBmcm9tIFwiLi4vc3RhdGUvZGF0YVwiO1xuaW1wb3J0IHsgY3VycmVudENlbGxTdG9yZSwgY3VycmVudENsdWVTdG9yZSB9IGZyb20gXCIuLi9zdGF0ZS9zdG9yZVwiO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbnRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPHN0eWxlPlxuICAgICogeyBib3gtc2l6aW5nOiBib3JkZXItYm94OyB9XG5cbiAgICA6aG9zdCB7XG4gICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgfVxuXG4gICAgOmhvc3QoLmhpZ2hsaWdodCkge1xuICAgICAgYmFja2dyb3VuZDogeWVsbG93O1xuICAgIH1cblxuICAgIDpob3N0KFtibG9ja2VkXSkge1xuICAgICAgYmFja2dyb3VuZDogYmxhY2s7XG4gICAgfVxuXG4gICAgOmhvc3QoW2xhYmVsXSk6OmJlZm9yZSB7XG4gICAgICBjb250ZW50OiBhdHRyKGxhYmVsKTtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIHRvcDogMnB4O1xuICAgICAgbGVmdDogMnB4O1xuICAgIH1cblxuICAgIGlucHV0IHtcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgYXNwZWN0LXJhdGlvOiAxIC8gMTtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgIG91dGxpbmU6IDA7XG4gICAgICBib3JkZXI6IDFweCBzb2xpZCBibGFjaztcbiAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXG4gICAgICAmOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZDogcmVkO1xuICAgICAgfVxuICAgIH1cblxuICA8L3N0eWxlPlxuICA8aW5wdXQgdHlwZT1cInRleHRcIiAvPlxuYDtcblxuZXhwb3J0IGNsYXNzIFhXb3JkQ2VsbCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5pbnB1dCA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihcImlucHV0XCIpITtcblxuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnREaXJlY3Rpb24gPSBjdXJyZW50Q2x1ZVN0b3JlLnN0YXRlPy5zcGxpdChcIi1cIilbMV07XG4gICAgICBjdXJyZW50Q2x1ZVN0b3JlLnVwZGF0ZShkYXRhLmNlbGxUb0NsdWVbdGhpcy5kYXRhc2V0LmlkIV1bY3VycmVudERpcmVjdGlvbiFdKTtcbiAgICAgIHRoaXMuaW5wdXQuZm9jdXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldCBibG9ja2VkKCkge1xuICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShcImJsb2NrZWRcIik7XG4gIH1cblxuICBzZXQgYmxvY2tlZCh2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImJsb2NrZWRcIiwgXCJcIik7XG4gICAgfSBlbHNlIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwiYmxvY2tlZFwiKTtcbiAgfVxuXG4gIGdldCBsYWJlbCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoXCJsYWJlbFwiKSE7XG4gIH1cblxuICBzZXQgbGFiZWwodmFsOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZShcImxhYmVsXCIsIHZhbCk7XG4gIH1cblxuICBoaWdobGlnaHQoKSB7XG4gICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKFwiaGlnaGxpZ2h0XCIpO1xuICB9XG5cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5pbnB1dC5mb2N1cygpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZC1jZWxsXCIsIFhXb3JkQ2VsbCk7XG4iLCAiaW1wb3J0IHR5cGUgeyBJcHV6UHV6emxlQ2VsbCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50Q2VsbFN0b3JlLCBjdXJyZW50Q2x1ZVN0b3JlIH0gZnJvbSBcIi4uL3N0YXRlL3N0b3JlXCI7XG5pbXBvcnQgeyBjcmVhdGVTZWxlY3RvciB9IGZyb20gXCIuLi91dGlsXCI7XG5pbXBvcnQgXCIuL2NlbGxcIjtcbmltcG9ydCB7IFhXb3JkQ2VsbCB9IGZyb20gXCIuL2NlbGxcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICA6aG9zdCB7XG4gICAgICBkaXNwbGF5OiBncmlkO1xuICAgIH1cbiAgPC9zdHlsZT5cbmA7XG5cbmNsYXNzIFhXb3JkR3JpZCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zID0gYHJlcGVhdCgke2RhdGEuZGltZW5zaW9ucy53aWR0aH0sIDFmcilgO1xuXG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCBkYXRhLmRpbWVuc2lvbnMuaGVpZ2h0OyByKyspIHtcbiAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgZGF0YS5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUNlbGwoYCR7cn0sJHtjfWAsIGRhdGEucHV6emxlW3JdW2NdKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudENsdWVTdG9yZS5zdWJzY3JpYmUoKG5ld1ZhbHVlLCBvbGRWYWx1ZSkgPT4ge1xuICAgICAgY29uc3QgaW5kaWNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGlmIChuZXdWYWx1ZSkgaW5kaWNlcy5wdXNoKC4uLmRhdGEuY2x1ZXNbbmV3VmFsdWVdLmNlbGxzKTtcbiAgICAgIGlmIChvbGRWYWx1ZSkgaW5kaWNlcy5wdXNoKC4uLmRhdGEuY2x1ZXNbb2xkVmFsdWVdLmNlbGxzKTtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0Q2VsbHMoaW5kaWNlcyk7XG4gICAgfSk7XG5cbiAgICBjdXJyZW50Q2VsbFN0b3JlLnN1YnNjcmliZSgobmV3VmFsdWUpID0+IHtcbiAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICB0aGlzLmZvY3VzQ2VsbChuZXdWYWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVDZWxsKGlkOiBzdHJpbmcsIGNlbGxEYXRhOiBJcHV6UHV6emxlQ2VsbCkge1xuICAgIGNvbnN0IGNlbGxFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtY2VsbFwiKSBhcyBYV29yZENlbGw7XG4gICAgY2VsbEVsLmRhdGFzZXQuaWQgPSBpZDtcbiAgICBpZiAoY2VsbERhdGEgPT09IFwiI1wiKSBjZWxsRWwuYmxvY2tlZCA9IHRydWU7XG4gICAgZWxzZSBpZiAoK2NlbGxEYXRhID4gMCkgY2VsbEVsLmxhYmVsID0gY2VsbERhdGEudG9TdHJpbmcoKTtcblxuICAgIHJldHVybiBjZWxsRWw7XG4gIH1cblxuICBoaWdobGlnaHRDZWxscyhpbmRpY2VzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IGNlbGxzID0gdGhpcy5zaGFkb3dSb290IVxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoY3JlYXRlU2VsZWN0b3IoaW5kaWNlcykpIGFzIE5vZGVMaXN0T2Y8WFdvcmRDZWxsPjtcbiAgICBjZWxscy5mb3JFYWNoKGNlbGwgPT4gY2VsbC5oaWdobGlnaHQoKSk7XG4gIH1cblxuICBmb2N1c0NlbGwoaW5kZXg6IHN0cmluZykge1xuICAgICh0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtpbmRleH1cIl1gKSBhcyBYV29yZENlbGwpXG4gICAgICAuZm9jdXMoKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtZ3JpZFwiLCBYV29yZEdyaWQpXG4iLCAiaW1wb3J0IFwiLi9jb21wb25lbnRzL25hdlwiO1xuaW1wb3J0IFwiLi9jb21wb25lbnRzL2NsdWVzXCI7XG5pbXBvcnQgXCIuL2NvbXBvbmVudHMvZ3JpZFwiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuL3N0YXRlL2RhdGFcIjtcblxuY2xhc3MgWFdvcmQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgfVxuXG4gIGFzeW5jIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGF3YWl0IGRhdGEuaW5pdCh0aGlzLnNyYyk7XG5cbiAgICBjb25zdCBuYXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC13b3JkLW5hdlwiKTtcbiAgICBjb25zdCBncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIngtd29yZC1ncmlkXCIpO1xuICAgIGNvbnN0IGNsdWVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIngtd29yZC1jbHVlc1wiKTtcblxuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQobmF2KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKGdyaWQpO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQoY2x1ZXMpO1xuICB9XG5cbiAgZ2V0IHNyYygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoXCJzcmNcIikhO1xuICB9XG5cbiAgc2V0IHNyYyh2YWw6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwic3JjXCIsIHZhbCk7XG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwieC13b3JkXCIsIFhXb3JkKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBUUEsTUFBTSxPQUFOLE1BQVc7QUFBQSxJQUNUO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQSxNQUFNLEtBQUssU0FBaUI7QUFDMUIsWUFBTSxPQUFPLE1BQU0sS0FBSyxVQUFVLE9BQU87QUFFekMsV0FBSyxhQUFhLEtBQUs7QUFDdkIsV0FBSyxT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
