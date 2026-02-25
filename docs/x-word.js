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
    if (newValue) currentCellStore.update(data.clues[newValue].cells[0]);
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

  // src/components/cell.ts
  var template3 = document.createElement("template");
  template3.innerHTML = `
  <style>
    * { box-sizing: border-box; }

    :host {
      position: relative;
      background: white;
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
      this.id = this.dataset.id;
      this.input.addEventListener("click", () => {
        const currentDirection = currentClueStore.state?.split("-")[1];
        if (this.id === currentCellStore.state) {
          const nextDirection = currentDirection === "Across" ? "Down" : "Across";
          currentClueStore.update(data.cellToClue[this.id][nextDirection]);
        } else {
          currentClueStore.update(data.cellToClue[this.id][currentDirection]);
        }
        currentCellStore.update(this.id);
      });
      currentClueStore.subscribe((newValue) => {
        if (data.clues[newValue].cells.indexOf(this.id) >= 0) this.highlight();
        else this.unhighlight();
      });
      currentCellStore.subscribe((newValue) => {
        if (newValue === this.id) this.input.focus();
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
      this.classList.add("highlight");
    }
    unhighlight() {
      if (this.classList.contains("highlight")) {
        this.classList.remove("highlight");
      }
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
    }
    createCell(id, cellData) {
      const cellEl = document.createElement("x-word-cell");
      cellEl.dataset.id = id;
      if (cellData === "#") cellEl.blocked = true;
      else if (+cellData > 0) cellEl.label = cellData.toString();
      return cellEl;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3N0YXRlL2RhdGEudHMiLCAiLi4vc3JjL3N0YXRlL3N0b3JlLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL25hdi50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jbHVlcy50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jZWxsLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2dyaWQudHMiLCAiLi4vc3JjL3gtd29yZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUge1xuICBJcHV6RmlsZSxcbiAgRGltZW5zaW9ucyxcbiAgRm9ybWF0dGVkQ2x1ZXMsXG4gIElwdXpQdXp6bGUsXG4gIElwdXpDbHVlcyxcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmNsYXNzIERhdGEge1xuICBkaW1lbnNpb25zOiBEaW1lbnNpb25zO1xuICBwdXp6bGU6IElwdXpQdXp6bGU7XG4gIGNsdWVzOiBGb3JtYXR0ZWRDbHVlcztcbiAgY2VsbFRvQ2x1ZTogUmVjb3JkPHN0cmluZywgeyBBY3Jvc3M6IHN0cmluZzsgRG93bjogc3RyaW5nOyB9PjtcblxuICBhc3luYyBpbml0KGlwdXpVcmw6IHN0cmluZykge1xuICAgIGNvbnN0IGlwdXogPSBhd2FpdCB0aGlzLmZldGNoSXB1eihpcHV6VXJsKTtcblxuICAgIHRoaXMuZGltZW5zaW9ucyA9IGlwdXouZGltZW5zaW9ucztcbiAgICB0aGlzLnB1enpsZSA9IGlwdXoucHV6emxlO1xuXG4gICAgY29uc3QgY2x1ZVRvQ2VsbHMgPSB0aGlzLmdlbmVyYXRlQ2VsbHMoaXB1ei5wdXp6bGUpO1xuICAgIHRoaXMuY2x1ZXMgPSB0aGlzLmZvcm1hdENsdWVzKGlwdXouY2x1ZXMsIGNsdWVUb0NlbGxzKTtcblxuICAgIHRoaXMuY2VsbFRvQ2x1ZSA9IHRoaXMubWFwQ2VsbFRvQ2x1ZXMoKTtcbiAgfVxuXG4gIG1hcENlbGxUb0NsdWVzKCkge1xuICAgIGNvbnN0IGNlbGxUb0NsdWVNYXA6IFJlY29yZDxzdHJpbmcsIHsgQWNyb3NzOiBzdHJpbmc7IERvd246IHN0cmluZyB9PiA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBbY2x1ZUlkLCBjbHVlRGF0YV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5jbHVlcykpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGNsdWVJZC5lbmRzV2l0aChcIkFjcm9zc1wiKSA/IFwiQWNyb3NzXCIgOiBcIkRvd25cIjtcbiAgICAgIGZvciAoY29uc3QgY2VsbCBvZiBjbHVlRGF0YS5jZWxscykge1xuICAgICAgICBpZiAoIWNlbGxUb0NsdWVNYXBbY2VsbF0pIHtcbiAgICAgICAgICBjZWxsVG9DbHVlTWFwW2NlbGxdID0geyBBY3Jvc3M6IFwiXCIsIERvd246IFwiXCIgfTtcbiAgICAgICAgfVxuICAgICAgICBjZWxsVG9DbHVlTWFwW2NlbGxdW2RpcmVjdGlvbl0gPSBjbHVlSWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjZWxsVG9DbHVlTWFwO1xuICB9XG5cbiAgZ2V0UHJldkNsdWUoY2x1ZUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbHVlSWRzID0gT2JqZWN0LmtleXModGhpcy5jbHVlcyk7XG4gICAgY29uc3QgaW5kZXggPSBjbHVlSWRzLmluZGV4T2YoY2x1ZUlkKTtcbiAgICBpZiAoaW5kZXggPT09IDApIHJldHVybiBjbHVlSWRzW2NsdWVJZHMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGNsdWVJZHNbaW5kZXggLSAxXTtcbiAgfVxuXG4gIGdldE5leHRDbHVlKGNsdWVJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2x1ZUlkcyA9IE9iamVjdC5rZXlzKHRoaXMuY2x1ZXMpO1xuICAgIGNvbnN0IGluZGV4ID0gY2x1ZUlkcy5pbmRleE9mKGNsdWVJZCk7XG4gICAgaWYgKGluZGV4ID09PSBjbHVlSWRzLmxlbmd0aCAtIDEpIHJldHVybiBjbHVlSWRzWzBdO1xuICAgIHJldHVybiBjbHVlSWRzW2luZGV4ICsgMV07XG4gIH1cblxuICBmb3JtYXRDbHVlcyhjbHVlczogSXB1ekNsdWVzLCBjbHVlVG9DZWxsczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+KSB7XG4gICAgY29uc3QgZm9ybWF0ID0gKGRpcmVjdGlvbjogXCJBY3Jvc3NcIiB8IFwiRG93blwiKTogRm9ybWF0dGVkQ2x1ZXMgPT4ge1xuICAgICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhjbHVlc1tkaXJlY3Rpb25dLm1hcChjbHVlID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBgJHtjbHVlWzBdfS0ke2RpcmVjdGlvbn1gO1xuICAgICAgICByZXR1cm4gW2lkLCB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgbnVtYmVyOiBjbHVlWzBdLFxuICAgICAgICAgIGNsdWU6IGNsdWVbMV0sXG4gICAgICAgICAgY2VsbHM6IGNsdWVUb0NlbGxzW2lkXVxuICAgICAgICB9XTtcbiAgICAgIH0pKTtcbiAgICB9O1xuICAgIHJldHVybiB7IC4uLmZvcm1hdChcIkFjcm9zc1wiKSwgLi4uZm9ybWF0KFwiRG93blwiKSB9O1xuICB9XG5cbiAgY2x1ZXNCeURpcmVjdGlvbigpIHtcbiAgICBjb25zdCBBY3Jvc3MgPSBPYmplY3QudmFsdWVzKHRoaXMuY2x1ZXMpLmZpbHRlcigoY2x1ZSkgPT5cbiAgICAgIGNsdWUuaWQuZW5kc1dpdGgoXCJBY3Jvc3NcIikpO1xuICAgIGNvbnN0IERvd24gPSBPYmplY3QudmFsdWVzKHRoaXMuY2x1ZXMpLmZpbHRlcigoY2x1ZSkgPT5cbiAgICAgIGNsdWUuaWQuZW5kc1dpdGgoXCJEb3duXCIpKTtcbiAgICByZXR1cm4geyBBY3Jvc3MsIERvd24gfTtcbiAgfVxuXG4gIGdlbmVyYXRlQ2VsbHMocHV6emxlOiBJcHV6UHV6emxlKSB7XG4gICAgY29uc3QgY2VsbHNNYXAgPSB7fTtcblxuICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICBsZXQgY3VycmVudENsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICBmb3IgKGxldCBjID0gMDsgYyA8IHRoaXMuZGltZW5zaW9ucy53aWR0aDsgYysrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuXG4gICAgICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgICAgIGNhc2UgXCIjXCI6IGN1cnJlbnRDbHVlID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Q2x1ZSkge1xuICAgICAgICAgICAgICBjdXJyZW50Q2x1ZSA9IGNlbGw7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1BY3Jvc3NgXSA9IFtyICsgXCIsXCIgKyBjXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1BY3Jvc3NgXS5wdXNoKHIgKyBcIixcIiArIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgdGhpcy5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgIGxldCBjdXJyZW50Q2x1ZTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuXG4gICAgICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgICAgIGNhc2UgXCIjXCI6IGN1cnJlbnRDbHVlID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Q2x1ZSkge1xuICAgICAgICAgICAgICBjdXJyZW50Q2x1ZSA9IGNlbGw7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1Eb3duYF0gPSBbciArIFwiLFwiICsgY107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tRG93bmBdLnB1c2gociArIFwiLFwiICsgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjdXJyZW50Q2x1ZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjZWxsc01hcDtcbiAgfVxuXG4gIGFzeW5jIGZldGNoSXB1eih1cmw6IHN0cmluZyk6IFByb21pc2U8SXB1ekZpbGU+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZGF0YSA9IG5ldyBEYXRhKCk7XG4iLCAiaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcblxuY2xhc3MgU3RvcmU8VD4ge1xuICBzdGF0ZTogVDtcbiAgbGlzdGVuZXJzOiAoKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkgPT4gdm9pZClbXTtcblxuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGU6IFQpIHtcbiAgICB0aGlzLnN0YXRlID0gaW5pdGlhbFN0YXRlO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cblxuICB1cGRhdGUobmV3U3RhdGU6IFQpIHtcbiAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKG5ld1N0YXRlICE9PSBvbGRTdGF0ZSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IG5ld1N0YXRlO1xuICAgICAgdGhpcy5ub3RpZnlBbGwobmV3U3RhdGUsIG9sZFN0YXRlKTtcbiAgICB9XG4gIH1cblxuICBub3RpZnlBbGwobmV3U3RhdGU6IFQsIG9sZFN0YXRlOiBUKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcihuZXdTdGF0ZSwgb2xkU3RhdGUpKTtcbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkgPT4gdm9pZCkge1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGN1cnJlbnRDbHVlU3RvcmUgPSBuZXcgU3RvcmU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbmV4cG9ydCBjb25zdCBjdXJyZW50Q2VsbFN0b3JlID0gbmV3IFN0b3JlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG5jdXJyZW50Q2x1ZVN0b3JlLnN1YnNjcmliZSgobmV3VmFsdWUpID0+IHtcbiAgaWYgKG5ld1ZhbHVlKSBjdXJyZW50Q2VsbFN0b3JlLnVwZGF0ZShkYXRhLmNsdWVzW25ld1ZhbHVlXS5jZWxsc1swXSk7XG59KTtcbiIsICJpbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4uL3N0YXRlL2RhdGFcIjtcbmltcG9ydCB7IGN1cnJlbnRDbHVlU3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICA6aG9zdCB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICB3aWR0aDogMzAwcHg7XG4gICAgfVxuICA8L3N0eWxlPlxuXG4gIDxidXR0b24+cHJldjwvYnV0dG9uPlxuICA8ZGl2PlxuICAgIDxzdHJvbmc+PC9zdHJvbmc+XG4gICAgPHNwYW4+PC9zcGFuPlxuICA8L2Rpdj5cbiAgPGJ1dHRvbj5uZXh0PC9idXR0b24+XG5gO1xuXG5jbGFzcyBYV29yZE5hdiBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgc3Vic2NyaXB0aW9uOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnN0IGJ1dHRvbnMgPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIik7XG4gICAgY29uc3Qgc3Ryb25nID0gdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKFwic3Ryb25nXCIpO1xuICAgIGNvbnN0IHNwYW4gPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoXCJzcGFuXCIpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24gPSBjdXJyZW50Q2x1ZVN0b3JlLnN1YnNjcmliZSgobmV3VmFsKSA9PiB7XG4gICAgICBpZiAobmV3VmFsKSB7XG4gICAgICAgIHN0cm9uZyEudGV4dENvbnRlbnQgPSBuZXdWYWwuc3BsaXQoXCItXCIpLmpvaW4oXCIgXCIpO1xuICAgICAgICBzcGFuIS50ZXh0Q29udGVudCA9IGRhdGEuY2x1ZXNbbmV3VmFsXS5jbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYnV0dG9uc1swXS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgXyA9PiB7XG4gICAgICBpZiAoY3VycmVudENsdWVTdG9yZS5zdGF0ZSlcbiAgICAgICAgY3VycmVudENsdWVTdG9yZS51cGRhdGUoZGF0YS5nZXRQcmV2Q2x1ZShjdXJyZW50Q2x1ZVN0b3JlLnN0YXRlKSk7XG4gICAgfSk7XG5cbiAgICBidXR0b25zWzFdLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfID0+IHtcbiAgICAgIGlmIChjdXJyZW50Q2x1ZVN0b3JlLnN0YXRlKVxuICAgICAgICBjdXJyZW50Q2x1ZVN0b3JlLnVwZGF0ZShkYXRhLmdldE5leHRDbHVlKGN1cnJlbnRDbHVlU3RvcmUuc3RhdGUpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9uKCk7XG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwieC13b3JkLW5hdlwiLCBYV29yZE5hdik7XG4iLCAiaW1wb3J0IHR5cGUgeyBGb3JtYXR0ZWRDbHVlVmFsdWUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7IGRhdGEgfSBmcm9tIFwiLi4vc3RhdGUvZGF0YVwiO1xuaW1wb3J0IHsgY3VycmVudENsdWVTdG9yZSB9IGZyb20gXCIuLi9zdGF0ZS9zdG9yZVwiO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbnRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPHN0eWxlPlxuICAgIC5oaWdobGlnaHQge1xuICAgICAgYmFja2dyb3VuZDogeWVsbG93O1xuICAgIH1cbiAgPC9zdHlsZT5cbiAgPGRpdj5cbiAgICA8c3Ryb25nPmFjcm9zczwvc3Ryb25nPlxuICAgIDx1bD48L3VsPlxuICA8L2Rpdj5cbiAgPGRpdj5cbiAgICA8c3Ryb25nPmRvd248L3N0cm9uZz5cbiAgICA8dWw+PC91bD5cbiAgPC9kaXY+XG5gO1xuXG5jbGFzcyBYV29yZENsdWVzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBzdWJzY3JpcHRpb246ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgY29uc3QgdWxzID0gdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yQWxsKFwidWxcIik7XG4gICAgY29uc3QgY2x1ZXMgPSBkYXRhLmNsdWVzQnlEaXJlY3Rpb24oKTtcblxuICAgIHVsc1swXS5hcHBlbmQoLi4uY2x1ZXMuQWNyb3NzLm1hcCh0aGlzLmNyZWF0ZUNsdWVJdGVtKSk7XG4gICAgdWxzWzFdLmFwcGVuZCguLi5jbHVlcy5Eb3duLm1hcCh0aGlzLmNyZWF0ZUNsdWVJdGVtKSk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IGN1cnJlbnRDbHVlU3RvcmUuc3Vic2NyaWJlKChuZXdWYWx1ZSwgb2xkVmFsdWUpID0+IHtcbiAgICAgIGlmIChvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtvbGRWYWx1ZX1cIl1gKSFcbiAgICAgICAgICAuY2xhc3NMaXN0LnJlbW92ZShcImhpZ2hsaWdodFwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke25ld1ZhbHVlfVwiXWApIVxuICAgICAgICAuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodFwiKTtcbiAgICB9KTtcblxuICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGNsdWVzLkFjcm9zc1swXS5pZCk7XG4gIH1cblxuICBjcmVhdGVDbHVlSXRlbSh7IGlkLCBudW1iZXIsIGNsdWUgfTogRm9ybWF0dGVkQ2x1ZVZhbHVlKSB7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgbGkuZGF0YXNldC5pZCA9IGlkO1xuICAgIGxpLmlubmVySFRNTCA9IGA8c3Bhbj4ke251bWJlcn08L3NwYW4+PHNwYW4+JHtjbHVlfTwvc3Bhbj5gO1xuXG4gICAgbGkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGlkKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbGk7XG4gIH1cblxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbigpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZC1jbHVlc1wiLCBYV29yZENsdWVzKTtcbiIsICJpbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4uL3N0YXRlL2RhdGFcIjtcbmltcG9ydCB7IGN1cnJlbnRDZWxsU3RvcmUsIGN1cnJlbnRDbHVlU3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICAqIHsgYm94LXNpemluZzogYm9yZGVyLWJveDsgfVxuXG4gICAgOmhvc3Qge1xuICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgYmFja2dyb3VuZDogd2hpdGU7XG4gICAgfVxuXG4gICAgOmhvc3QoLmhpZ2hsaWdodCkge1xuICAgICAgYmFja2dyb3VuZDogeWVsbG93O1xuICAgIH1cblxuICAgIDpob3N0KFtibG9ja2VkXSkge1xuICAgICAgYmFja2dyb3VuZDogYmxhY2s7XG4gICAgfVxuXG4gICAgOmhvc3QoW2xhYmVsXSk6OmJlZm9yZSB7XG4gICAgICBjb250ZW50OiBhdHRyKGxhYmVsKTtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIHRvcDogMnB4O1xuICAgICAgbGVmdDogMnB4O1xuICAgIH1cblxuICAgIGlucHV0IHtcbiAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgYXNwZWN0LXJhdGlvOiAxIC8gMTtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgIG91dGxpbmU6IDA7XG4gICAgICBib3JkZXI6IDFweCBzb2xpZCBibGFjaztcbiAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXG4gICAgICAmOmZvY3VzIHtcbiAgICAgICAgYmFja2dyb3VuZDogcmVkO1xuICAgICAgfVxuICAgIH1cblxuICA8L3N0eWxlPlxuICA8aW5wdXQgdHlwZT1cInRleHRcIiAvPlxuYDtcblxuZXhwb3J0IGNsYXNzIFhXb3JkQ2VsbCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5pbnB1dCA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihcImlucHV0XCIpITtcbiAgICB0aGlzLmlkID0gdGhpcy5kYXRhc2V0LmlkITtcblxuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnREaXJlY3Rpb24gPSBjdXJyZW50Q2x1ZVN0b3JlLnN0YXRlPy5zcGxpdChcIi1cIilbMV0hO1xuXG4gICAgICBpZiAodGhpcy5pZCA9PT0gY3VycmVudENlbGxTdG9yZS5zdGF0ZSkge1xuICAgICAgICBjb25zdCBuZXh0RGlyZWN0aW9uID0gY3VycmVudERpcmVjdGlvbiA9PT0gXCJBY3Jvc3NcIiA/IFwiRG93blwiIDogXCJBY3Jvc3NcIjtcbiAgICAgICAgY3VycmVudENsdWVTdG9yZS51cGRhdGUoZGF0YS5jZWxsVG9DbHVlW3RoaXMuaWRdW25leHREaXJlY3Rpb25dKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGRhdGEuY2VsbFRvQ2x1ZVt0aGlzLmlkXVtjdXJyZW50RGlyZWN0aW9uIV0pO1xuICAgICAgfVxuICAgICAgY3VycmVudENlbGxTdG9yZS51cGRhdGUodGhpcy5pZCk7XG4gICAgfSk7XG5cbiAgICBjdXJyZW50Q2x1ZVN0b3JlLnN1YnNjcmliZSgobmV3VmFsdWUpID0+IHtcbiAgICAgIGlmIChkYXRhLmNsdWVzW25ld1ZhbHVlIV0uY2VsbHMuaW5kZXhPZih0aGlzLmlkKSA+PSAwKSB0aGlzLmhpZ2hsaWdodCgpO1xuICAgICAgZWxzZSB0aGlzLnVuaGlnaGxpZ2h0KCk7XG4gICAgfSk7XG5cbiAgICBjdXJyZW50Q2VsbFN0b3JlLnN1YnNjcmliZSgobmV3VmFsdWUpID0+IHtcbiAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdGhpcy5pZCkgdGhpcy5pbnB1dC5mb2N1cygpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0IGJsb2NrZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKFwiYmxvY2tlZFwiKTtcbiAgfVxuXG4gIHNldCBibG9ja2VkKHZhbCkge1xuICAgIGlmICh2YWwpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiYmxvY2tlZFwiLCBcIlwiKTtcbiAgICB9IGVsc2UgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoXCJibG9ja2VkXCIpO1xuICB9XG5cbiAgZ2V0IGxhYmVsKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcImxhYmVsXCIpITtcbiAgfVxuXG4gIHNldCBsYWJlbCh2YWw6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwibGFiZWxcIiwgdmFsKTtcbiAgfVxuXG4gIGhpZ2hsaWdodCgpIHtcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gIH1cblxuICB1bmhpZ2hsaWdodCgpIHtcbiAgICBpZiAodGhpcy5jbGFzc0xpc3QuY29udGFpbnMoXCJoaWdobGlnaHRcIikpIHtcbiAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShcImhpZ2hsaWdodFwiKTtcbiAgICB9XG4gIH1cblxuICBmb2N1cygpIHtcbiAgICB0aGlzLmlucHV0LmZvY3VzKCk7XG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwieC13b3JkLWNlbGxcIiwgWFdvcmRDZWxsKTtcbiIsICJpbXBvcnQgdHlwZSB7IElwdXpQdXp6bGVDZWxsIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4uL3N0YXRlL2RhdGFcIjtcbmltcG9ydCB7IGN1cnJlbnRDZWxsU3RvcmUsIGN1cnJlbnRDbHVlU3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcbmltcG9ydCB7IGNyZWF0ZVNlbGVjdG9yIH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCBcIi4vY2VsbFwiO1xuaW1wb3J0IHsgWFdvcmRDZWxsIH0gZnJvbSBcIi4vY2VsbFwiO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbnRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPHN0eWxlPlxuICAgIDpob3N0IHtcbiAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgfVxuICA8L3N0eWxlPlxuYDtcblxuY2xhc3MgWFdvcmRHcmlkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLnN0eWxlLmdyaWRUZW1wbGF0ZUNvbHVtbnMgPSBgcmVwZWF0KCR7ZGF0YS5kaW1lbnNpb25zLndpZHRofSwgMWZyKWA7XG5cbiAgICBmb3IgKGxldCByID0gMDsgciA8IGRhdGEuZGltZW5zaW9ucy5oZWlnaHQ7IHIrKykge1xuICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBkYXRhLmRpbWVuc2lvbnMud2lkdGg7IGMrKykge1xuICAgICAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQ2VsbChgJHtyfSwke2N9YCwgZGF0YS5wdXp6bGVbcl1bY10pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjcmVhdGVDZWxsKGlkOiBzdHJpbmcsIGNlbGxEYXRhOiBJcHV6UHV6emxlQ2VsbCkge1xuICAgIGNvbnN0IGNlbGxFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtY2VsbFwiKSBhcyBYV29yZENlbGw7XG4gICAgY2VsbEVsLmRhdGFzZXQuaWQgPSBpZDtcbiAgICBpZiAoY2VsbERhdGEgPT09IFwiI1wiKSBjZWxsRWwuYmxvY2tlZCA9IHRydWU7XG4gICAgZWxzZSBpZiAoK2NlbGxEYXRhID4gMCkgY2VsbEVsLmxhYmVsID0gY2VsbERhdGEudG9TdHJpbmcoKTtcblxuICAgIHJldHVybiBjZWxsRWw7XG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwieC13b3JkLWdyaWRcIiwgWFdvcmRHcmlkKVxuIiwgImltcG9ydCBcIi4vY29tcG9uZW50cy9uYXZcIjtcbmltcG9ydCBcIi4vY29tcG9uZW50cy9jbHVlc1wiO1xuaW1wb3J0IFwiLi9jb21wb25lbnRzL2dyaWRcIjtcbmltcG9ydCB7IGRhdGEgfSBmcm9tIFwiLi9zdGF0ZS9kYXRhXCI7XG5cbmNsYXNzIFhXb3JkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gIH1cblxuICBhc3luYyBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBhd2FpdCBkYXRhLmluaXQodGhpcy5zcmMpO1xuXG4gICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIngtd29yZC1uYXZcIik7XG4gICAgY29uc3QgZ3JpZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtZ3JpZFwiKTtcbiAgICBjb25zdCBjbHVlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtY2x1ZXNcIik7XG5cbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKG5hdik7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZChncmlkKTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKGNsdWVzKTtcbiAgfVxuXG4gIGdldCBzcmMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwic3JjXCIpITtcbiAgfVxuXG4gIHNldCBzcmModmFsOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZShcInNyY1wiLCB2YWwpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZFwiLCBYV29yZCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOztBQVFBLE1BQU0sT0FBTixNQUFXO0FBQUEsSUFDVDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBRUEsTUFBTSxLQUFLLFNBQWlCO0FBQzFCLFlBQU0sT0FBTyxNQUFNLEtBQUssVUFBVSxPQUFPO0FBRXpDLFdBQUssYUFBYSxLQUFLO0FBQ3ZCLFdBQUssU0FBUyxLQUFLO0FBRW5CLFlBQU0sY0FBYyxLQUFLLGNBQWMsS0FBSyxNQUFNO0FBQ2xELFdBQUssUUFBUSxLQUFLLFlBQVksS0FBSyxPQUFPLFdBQVc7QUFFckQsV0FBSyxhQUFhLEtBQUssZUFBZTtBQUFBLElBQ3hDO0FBQUEsSUFFQSxpQkFBaUI7QUFDZixZQUFNLGdCQUFrRSxDQUFDO0FBRXpFLGlCQUFXLENBQUMsUUFBUSxRQUFRLEtBQUssT0FBTyxRQUFRLEtBQUssS0FBSyxHQUFHO0FBQzNE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TSxNQUFNO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBRUEsaUJBQWUsT0FBTyxlQUFlLFNBQVM7OztBQzFHOUMsTUFBTUMsWUFBVyxTQUFTLGNBQWMsVUFBVTtBQUNsRCxFQUFBQSxVQUFTLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRckIsTUFBTSxZQUFOLGNBQXdCLFlBQVk7QUFBQSxJQUNsQyxjQUFjO0FBQ1osWUFBTTtBQUNOLFdBQUssYUFBYSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQ2xDLFdBQUssV0FBWSxZQUFZQSxVQUFTLFFBQVEsVUFBVSxJQUFJLENBQUM7QUFBQSxJQUMvRDtBQUFBLElBRUEsb0JBQW9CO0FBQ2xCLFdBQUssTUFBTSxzQkFBc0IsVUFBVSxLQUFLLFdBQVcsS0FBSztBQUVoRSxlQUFTLElBQUksR0FBRyxJQUFJLEtBQUssV0FBVyxRQUFRLEtBQUs7QUFDL0MsaUJBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxXQUFXLE9BQU8sS0FBSztBQUM5QyxlQUFLLFdBQVksWUFBWSxLQUFLLFdBQVcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFBQSxRQUM5RTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxXQUFXLElBQVksVUFBMEI7QUFDL0MsWUFBTSxTQUFTLFNBQVMsY0FBYyxhQUFhO0FBQ25ELGFBQU8sUUFBUSxLQUFLO0FBQ3BCLFVBQUksYUFBYSxJQUFLLFFBQU8sVUFBVTtBQUFBLGVBQzlCLENBQUMsV0FBVyxFQUFHLFFBQU8sUUFBUSxTQUFTLFNBQVM7QUFFekQsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBRUEsaUJBQWUsT0FBTyxlQUFlLFNBQVM7OztBQ3RDOUMsTUFBTSxRQUFOLGNBQW9CLFlBQVk7QUFBQSxJQUM5QixjQUFjO0FBQ1osWUFBTTtBQUNOLFdBQUssYUFBYSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQUEsSUFDcEM7QUFBQSxJQUVBLE1BQU0sb0JBQW9CO0FBQ3hCLFlBQU0sS0FBSyxLQUFLLEtBQUssR0FBRztBQUV4QixZQUFNLE1BQU0sU0FBUyxjQUFjLFlBQVk7QUFDL0MsWUFBTSxPQUFPLFNBQVMsY0FBYyxhQUFhO0FBQ2pELFlBQU0sUUFBUSxTQUFTLGNBQWMsY0FBYztBQUVuRCxXQUFLLFdBQVksWUFBWSxHQUFHO0FBQ2hDLFdBQUssV0FBWSxZQUFZLElBQUk7QUFDakMsV0FBSyxXQUFZLFlBQVksS0FBSztBQUFBLElBQ3BDO0FBQUEsSUFFQSxJQUFJLE1BQU07QUFDUixhQUFPLEtBQUssYUFBYSxLQUFLO0FBQUEsSUFDaEM7QUFBQSxJQUVBLElBQUksSUFBSSxLQUFhO0FBQ25CLFdBQUssYUFBYSxPQUFPLEdBQUc7QUFBQSxJQUM5QjtBQUFBLEVBQ0Y7QUFFQSxpQkFBZSxPQUFPLFVBQVUsS0FBSzsiLAogICJuYW1lcyI6IFsidGVtcGxhdGUiLCAidGVtcGxhdGUiLCAidGVtcGxhdGUiXQp9Cg==
