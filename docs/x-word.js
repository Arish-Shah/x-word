(() => {
  // src/state/data.ts
  var Data = class {
    dimensions;
    puzzle;
    clues;
    async init(ipuzUrl) {
      const ipuz = await this.fetchIpuz(ipuzUrl);
      this.dimensions = ipuz.dimensions;
      this.puzzle = ipuz.puzzle;
      const clueToCells = this.generateCells(ipuz.puzzle);
      this.clues = this.formatClues(ipuz.clues, clueToCells);
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
  var currentStore = new Store(null);

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
      this.subscription = currentStore.subscribe((newVal) => {
        if (newVal) {
          strong.textContent = newVal.split("-").join(" ");
          span.textContent = data.clues[newVal].clue;
        }
      });
      buttons[0].addEventListener("click", (_) => {
        if (currentStore.state)
          currentStore.update(data.getPrevClue(currentStore.state));
      });
      buttons[1].addEventListener("click", (_) => {
        if (currentStore.state)
          currentStore.update(data.getNextClue(currentStore.state));
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
      this.subscription = currentStore.subscribe((newValue, oldValue) => {
        if (oldValue) {
          this.shadowRoot.querySelector(`[data-id="${oldValue}"]`).classList.remove("highlight");
        }
        this.shadowRoot.querySelector(`[data-id="${newValue}"]`).classList.add("highlight");
      });
      currentStore.update(clues.Across[0].id);
    }
    createClueItem({ id, number, clue }) {
      const li = document.createElement("li");
      li.dataset.id = id;
      li.innerHTML = `<span>${number}</span><span>${clue}</span>`;
      li.addEventListener("click", () => {
        currentStore.update(id);
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
    }

  </style>
  <input type="text" />
`;
  var XWordCell = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template3.content.cloneNode(true));
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
      currentStore.subscribe((newValue, oldValue) => {
        const indices = [];
        if (newValue) indices.push(...data.clues[newValue].cells);
        if (oldValue) indices.push(...data.clues[oldValue].cells);
        this.highlightCells(indices);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3N0YXRlL2RhdGEudHMiLCAiLi4vc3JjL3N0YXRlL3N0b3JlLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL25hdi50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jbHVlcy50cyIsICIuLi9zcmMvdXRpbC50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jZWxsLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2dyaWQudHMiLCAiLi4vc3JjL3gtd29yZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUge1xuICBJcHV6RmlsZSxcbiAgRGltZW5zaW9ucyxcbiAgRm9ybWF0dGVkQ2x1ZXMsXG4gIElwdXpQdXp6bGUsXG4gIElwdXpDbHVlcyxcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmNsYXNzIERhdGEge1xuICBkaW1lbnNpb25zOiBEaW1lbnNpb25zO1xuICBwdXp6bGU6IElwdXpQdXp6bGU7XG4gIGNsdWVzOiBGb3JtYXR0ZWRDbHVlcztcblxuICBhc3luYyBpbml0KGlwdXpVcmw6IHN0cmluZykge1xuICAgIGNvbnN0IGlwdXogPSBhd2FpdCB0aGlzLmZldGNoSXB1eihpcHV6VXJsKTtcblxuICAgIHRoaXMuZGltZW5zaW9ucyA9IGlwdXouZGltZW5zaW9ucztcbiAgICB0aGlzLnB1enpsZSA9IGlwdXoucHV6emxlO1xuXG4gICAgY29uc3QgY2x1ZVRvQ2VsbHMgPSB0aGlzLmdlbmVyYXRlQ2VsbHMoaXB1ei5wdXp6bGUpO1xuICAgIHRoaXMuY2x1ZXMgPSB0aGlzLmZvcm1hdENsdWVzKGlwdXouY2x1ZXMsIGNsdWVUb0NlbGxzKTtcbiAgfVxuXG4gIGdldFByZXZDbHVlKGNsdWVJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2x1ZUlkcyA9IE9iamVjdC5rZXlzKHRoaXMuY2x1ZXMpO1xuICAgIGNvbnN0IGluZGV4ID0gY2x1ZUlkcy5pbmRleE9mKGNsdWVJZCk7XG4gICAgaWYgKGluZGV4ID09PSAwKSByZXR1cm4gY2x1ZUlkc1tjbHVlSWRzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBjbHVlSWRzW2luZGV4IC0gMV07XG4gIH1cblxuICBnZXROZXh0Q2x1ZShjbHVlSWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGNsdWVJZHMgPSBPYmplY3Qua2V5cyh0aGlzLmNsdWVzKTtcbiAgICBjb25zdCBpbmRleCA9IGNsdWVJZHMuaW5kZXhPZihjbHVlSWQpO1xuICAgIGlmIChpbmRleCA9PT0gY2x1ZUlkcy5sZW5ndGggLSAxKSByZXR1cm4gY2x1ZUlkc1swXTtcbiAgICByZXR1cm4gY2x1ZUlkc1tpbmRleCArIDFdO1xuICB9XG5cbiAgZm9ybWF0Q2x1ZXMoY2x1ZXM6IElwdXpDbHVlcywgY2x1ZVRvQ2VsbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPikge1xuICAgIGNvbnN0IGZvcm1hdCA9IChkaXJlY3Rpb246IFwiQWNyb3NzXCIgfCBcIkRvd25cIik6IEZvcm1hdHRlZENsdWVzID0+IHtcbiAgICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoY2x1ZXNbZGlyZWN0aW9uXS5tYXAoY2x1ZSA9PiB7XG4gICAgICAgIGNvbnN0IGlkID0gYCR7Y2x1ZVswXX0tJHtkaXJlY3Rpb259YDtcbiAgICAgICAgcmV0dXJuIFtpZCwge1xuICAgICAgICAgIGlkLFxuICAgICAgICAgIG51bWJlcjogY2x1ZVswXSxcbiAgICAgICAgICBjbHVlOiBjbHVlWzFdLFxuICAgICAgICAgIGNlbGxzOiBjbHVlVG9DZWxsc1tpZF1cbiAgICAgICAgfV07XG4gICAgICB9KSk7XG4gICAgfTtcbiAgICByZXR1cm4geyAuLi5mb3JtYXQoXCJBY3Jvc3NcIiksIC4uLmZvcm1hdChcIkRvd25cIikgfTtcbiAgfVxuXG4gIGNsdWVzQnlEaXJlY3Rpb24oKSB7XG4gICAgY29uc3QgQWNyb3NzID0gT2JqZWN0LnZhbHVlcyh0aGlzLmNsdWVzKS5maWx0ZXIoKGNsdWUpID0+XG4gICAgICBjbHVlLmlkLmVuZHNXaXRoKFwiQWNyb3NzXCIpKTtcbiAgICBjb25zdCBEb3duID0gT2JqZWN0LnZhbHVlcyh0aGlzLmNsdWVzKS5maWx0ZXIoKGNsdWUpID0+XG4gICAgICBjbHVlLmlkLmVuZHNXaXRoKFwiRG93blwiKSk7XG4gICAgcmV0dXJuIHsgQWNyb3NzLCBEb3duIH07XG4gIH1cblxuICBnZW5lcmF0ZUNlbGxzKHB1enpsZTogSXB1elB1enpsZSkge1xuICAgIGNvbnN0IGNlbGxzTWFwID0ge307XG5cbiAgICBmb3IgKGxldCByID0gMDsgciA8IHRoaXMuZGltZW5zaW9ucy5oZWlnaHQ7IHIrKykge1xuICAgICAgbGV0IGN1cnJlbnRDbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCB0aGlzLmRpbWVuc2lvbnMud2lkdGg7IGMrKykge1xuICAgICAgICBsZXQgY2VsbCA9IHB1enpsZVtyXVtjXTtcblxuICAgICAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgICAgICBjYXNlIFwiI1wiOiBjdXJyZW50Q2x1ZSA9IG51bGw7IGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudENsdWUpIHtcbiAgICAgICAgICAgICAgY3VycmVudENsdWUgPSBjZWxsO1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tQWNyb3NzYF0gPSBbciArIFwiLFwiICsgY107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tQWNyb3NzYF0ucHVzaChyICsgXCIsXCIgKyBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGN1cnJlbnRDbHVlID0gbnVsbDtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBjID0gMDsgYyA8IHRoaXMuZGltZW5zaW9ucy53aWR0aDsgYysrKSB7XG4gICAgICBsZXQgY3VycmVudENsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICBmb3IgKGxldCByID0gMDsgciA8IHRoaXMuZGltZW5zaW9ucy5oZWlnaHQ7IHIrKykge1xuICAgICAgICBsZXQgY2VsbCA9IHB1enpsZVtyXVtjXTtcblxuICAgICAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgICAgICBjYXNlIFwiI1wiOiBjdXJyZW50Q2x1ZSA9IG51bGw7IGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudENsdWUpIHtcbiAgICAgICAgICAgICAgY3VycmVudENsdWUgPSBjZWxsO1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tRG93bmBdID0gW3IgKyBcIixcIiArIGNdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2VsbHNNYXBbYCR7Y3VycmVudENsdWV9LURvd25gXS5wdXNoKHIgKyBcIixcIiArIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY2VsbHNNYXA7XG4gIH1cblxuICBhc3luYyBmZXRjaElwdXoodXJsOiBzdHJpbmcpOiBQcm9taXNlPElwdXpGaWxlPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGRhdGEgPSBuZXcgRGF0YSgpO1xuIiwgImNsYXNzIFN0b3JlPFQ+IHtcbiAgc3RhdGU6IFQ7XG4gIGxpc3RlbmVyczogKChuZXdTdGF0ZTogVCwgb2xkU3RhdGU6IFQpID0+IHZvaWQpW107XG5cbiAgY29uc3RydWN0b3IoaW5pdGlhbFN0YXRlOiBUKSB7XG4gICAgdGhpcy5zdGF0ZSA9IGluaXRpYWxTdGF0ZTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgdXBkYXRlKG5ld1N0YXRlOiBUKSB7XG4gICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChuZXdTdGF0ZSAhPT0gb2xkU3RhdGUpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICAgIHRoaXMubm90aWZ5QWxsKG5ld1N0YXRlLCBvbGRTdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgbm90aWZ5QWxsKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIobmV3U3RhdGUsIG9sZFN0YXRlKSk7XG4gIH1cblxuICBzdWJzY3JpYmUobGlzdGVuZXI6IChuZXdTdGF0ZTogVCwgb2xkU3RhdGU6IFQpID0+IHZvaWQpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjdXJyZW50U3RvcmUgPSBuZXcgU3RvcmU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4iLCAiaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50U3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICA6aG9zdCB7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgIH1cblxuICAgIGRpdiB7XG4gICAgICB3aWR0aDogMzAwcHg7XG4gICAgfVxuICA8L3N0eWxlPlxuXG4gIDxidXR0b24+cHJldjwvYnV0dG9uPlxuICA8ZGl2PlxuICAgIDxzdHJvbmc+PC9zdHJvbmc+XG4gICAgPHNwYW4+PC9zcGFuPlxuICA8L2Rpdj5cbiAgPGJ1dHRvbj5uZXh0PC9idXR0b24+XG5gO1xuXG5jbGFzcyBYV29yZE5hdiBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgc3Vic2NyaXB0aW9uOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnN0IGJ1dHRvbnMgPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIik7XG4gICAgY29uc3Qgc3Ryb25nID0gdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKFwic3Ryb25nXCIpO1xuICAgIGNvbnN0IHNwYW4gPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoXCJzcGFuXCIpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24gPSBjdXJyZW50U3RvcmUuc3Vic2NyaWJlKChuZXdWYWwpID0+IHtcbiAgICAgIGlmIChuZXdWYWwpIHtcbiAgICAgICAgc3Ryb25nIS50ZXh0Q29udGVudCA9IG5ld1ZhbC5zcGxpdChcIi1cIikuam9pbihcIiBcIik7XG4gICAgICAgIHNwYW4hLnRleHRDb250ZW50ID0gZGF0YS5jbHVlc1tuZXdWYWxdLmNsdWU7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBidXR0b25zWzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfID0+IHtcbiAgICAgIGlmIChjdXJyZW50U3RvcmUuc3RhdGUpXG4gICAgICAgIGN1cnJlbnRTdG9yZS51cGRhdGUoZGF0YS5nZXRQcmV2Q2x1ZShjdXJyZW50U3RvcmUuc3RhdGUpKTtcbiAgICB9KTtcblxuICAgIGJ1dHRvbnNbMV0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF8gPT4ge1xuICAgICAgaWYgKGN1cnJlbnRTdG9yZS5zdGF0ZSlcbiAgICAgICAgY3VycmVudFN0b3JlLnVwZGF0ZShkYXRhLmdldE5leHRDbHVlKGN1cnJlbnRTdG9yZS5zdGF0ZSkpO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24oKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtbmF2XCIsIFhXb3JkTmF2KTtcbiIsICJpbXBvcnQgdHlwZSB7IEZvcm1hdHRlZENsdWVWYWx1ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50U3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICAuaGlnaGxpZ2h0IHtcbiAgICAgIGJhY2tncm91bmQ6IHllbGxvdztcbiAgICB9XG4gIDwvc3R5bGU+XG4gIDxkaXY+XG4gICAgPHN0cm9uZz5hY3Jvc3M8L3N0cm9uZz5cbiAgICA8dWw+PC91bD5cbiAgPC9kaXY+XG4gIDxkaXY+XG4gICAgPHN0cm9uZz5kb3duPC9zdHJvbmc+XG4gICAgPHVsPjwvdWw+XG4gIDwvZGl2PlxuYDtcblxuY2xhc3MgWFdvcmRDbHVlcyBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgc3Vic2NyaXB0aW9uOiAoKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnN0IHVscyA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvckFsbChcInVsXCIpO1xuICAgIGNvbnN0IGNsdWVzID0gZGF0YS5jbHVlc0J5RGlyZWN0aW9uKCk7XG5cbiAgICB1bHNbMF0uYXBwZW5kKC4uLmNsdWVzLkFjcm9zcy5tYXAodGhpcy5jcmVhdGVDbHVlSXRlbSkpO1xuICAgIHVsc1sxXS5hcHBlbmQoLi4uY2x1ZXMuRG93bi5tYXAodGhpcy5jcmVhdGVDbHVlSXRlbSkpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24gPSBjdXJyZW50U3RvcmUuc3Vic2NyaWJlKChuZXdWYWx1ZSwgb2xkVmFsdWUpID0+IHtcbiAgICAgIGlmIChvbGRWYWx1ZSkge1xuICAgICAgICB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtvbGRWYWx1ZX1cIl1gKSFcbiAgICAgICAgICAuY2xhc3NMaXN0LnJlbW92ZShcImhpZ2hsaWdodFwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke25ld1ZhbHVlfVwiXWApIVxuICAgICAgICAuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodFwiKTtcbiAgICB9KTtcblxuICAgIGN1cnJlbnRTdG9yZS51cGRhdGUoY2x1ZXMuQWNyb3NzWzBdLmlkKTtcbiAgfVxuXG4gIGNyZWF0ZUNsdWVJdGVtKHsgaWQsIG51bWJlciwgY2x1ZSB9OiBGb3JtYXR0ZWRDbHVlVmFsdWUpIHtcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICBsaS5kYXRhc2V0LmlkID0gaWQ7XG4gICAgbGkuaW5uZXJIVE1MID0gYDxzcGFuPiR7bnVtYmVyfTwvc3Bhbj48c3Bhbj4ke2NsdWV9PC9zcGFuPmA7XG5cbiAgICBsaS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgY3VycmVudFN0b3JlLnVwZGF0ZShpZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGxpO1xuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24oKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtY2x1ZXNcIiwgWFdvcmRDbHVlcyk7XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlbGVjdG9yKGluZGljZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IGxlZnQgPSAnW2RhdGEtaWQ9XCInO1xuICBjb25zdCByaWdodCA9ICdcIl0nO1xuICByZXR1cm4gbGVmdCArIGluZGljZXMuam9pbihgJHtyaWdodH0sICR7bGVmdH1gKSArIHJpZ2h0O1xufVxuIiwgImNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xudGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8c3R5bGU+XG4gICAgKiB7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IH1cblxuICAgIDpob3N0IHtcbiAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB9XG5cbiAgICA6aG9zdCguaGlnaGxpZ2h0KSB7XG4gICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7XG4gICAgfVxuXG4gICAgOmhvc3QoW2Jsb2NrZWRdKSB7XG4gICAgICBiYWNrZ3JvdW5kOiBibGFjaztcbiAgICB9XG5cbiAgICA6aG9zdChbbGFiZWxdKTo6YmVmb3JlIHtcbiAgICAgIGNvbnRlbnQ6IGF0dHIobGFiZWwpO1xuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgdG9wOiAycHg7XG4gICAgICBsZWZ0OiAycHg7XG4gICAgfVxuXG4gICAgaW5wdXQge1xuICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICBhc3BlY3QtcmF0aW86IDEgLyAxO1xuICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgb3V0bGluZTogMDtcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIGJsYWNrO1xuICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgfVxuXG4gIDwvc3R5bGU+XG4gIDxpbnB1dCB0eXBlPVwidGV4dFwiIC8+XG5gO1xuXG5jbGFzcyBYV29yZENlbGwgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGdldCBibG9ja2VkKCkge1xuICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShcImJsb2NrZWRcIik7XG4gIH1cblxuICBzZXQgYmxvY2tlZCh2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImJsb2NrZWRcIiwgXCJcIik7XG4gICAgfSBlbHNlIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwiYmxvY2tlZFwiKTtcbiAgfVxuXG4gIGdldCBsYWJlbCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoXCJsYWJlbFwiKSE7XG4gIH1cblxuICBzZXQgbGFiZWwodmFsOiBzdHJpbmcpIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZShcImxhYmVsXCIsIHZhbCk7XG4gIH1cblxuICBoaWdobGlnaHQoKSB7XG4gICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKFwiaGlnaGxpZ2h0XCIpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZC1jZWxsXCIsIFhXb3JkQ2VsbCk7XG4iLCAiaW1wb3J0IHR5cGUgeyBJcHV6UHV6emxlQ2VsbCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50U3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcbmltcG9ydCB7IGNyZWF0ZVNlbGVjdG9yIH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCBcIi4vY2VsbFwiO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbnRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPHN0eWxlPlxuICAgIDpob3N0IHtcbiAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgfVxuICA8L3N0eWxlPlxuYDtcblxuY2xhc3MgWFdvcmRHcmlkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLnN0eWxlLmdyaWRUZW1wbGF0ZUNvbHVtbnMgPSBgcmVwZWF0KCR7ZGF0YS5kaW1lbnNpb25zLndpZHRofSwgMWZyKWA7XG5cbiAgICBmb3IgKGxldCByID0gMDsgciA8IGRhdGEuZGltZW5zaW9ucy5oZWlnaHQ7IHIrKykge1xuICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBkYXRhLmRpbWVuc2lvbnMud2lkdGg7IGMrKykge1xuICAgICAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQ2VsbChgJHtyfSwke2N9YCwgZGF0YS5wdXp6bGVbcl1bY10pKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdXJyZW50U3RvcmUuc3Vic2NyaWJlKChuZXdWYWx1ZSwgb2xkVmFsdWUpID0+IHtcbiAgICAgIGNvbnN0IGluZGljZXM6IHN0cmluZ1tdID0gW107XG4gICAgICBpZiAobmV3VmFsdWUpIGluZGljZXMucHVzaCguLi5kYXRhLmNsdWVzW25ld1ZhbHVlXS5jZWxscyk7XG4gICAgICBpZiAob2xkVmFsdWUpIGluZGljZXMucHVzaCguLi5kYXRhLmNsdWVzW29sZFZhbHVlXS5jZWxscyk7XG4gICAgICB0aGlzLmhpZ2hsaWdodENlbGxzKGluZGljZXMpO1xuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlQ2VsbChpZDogc3RyaW5nLCBjZWxsRGF0YTogSXB1elB1enpsZUNlbGwpIHtcbiAgICBjb25zdCBjZWxsRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC13b3JkLWNlbGxcIikgYXMgWFdvcmRDZWxsO1xuICAgIGNlbGxFbC5kYXRhc2V0LmlkID0gaWQ7XG4gICAgaWYgKGNlbGxEYXRhID09PSBcIiNcIikgY2VsbEVsLmJsb2NrZWQgPSB0cnVlO1xuICAgIGVsc2UgaWYgKCtjZWxsRGF0YSA+IDApIGNlbGxFbC5sYWJlbCA9IGNlbGxEYXRhLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4gY2VsbEVsO1xuICB9XG5cbiAgaGlnaGxpZ2h0Q2VsbHMoaW5kaWNlczogc3RyaW5nW10pIHtcbiAgICBjb25zdCBjZWxscyA9IHRoaXMuc2hhZG93Um9vdCFcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKGNyZWF0ZVNlbGVjdG9yKGluZGljZXMpKSBhcyBOb2RlTGlzdE9mPFhXb3JkQ2VsbD47XG4gICAgY2VsbHMuZm9yRWFjaChjZWxsID0+IGNlbGwuaGlnaGxpZ2h0KCkpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZC1ncmlkXCIsIFhXb3JkR3JpZClcbiIsICJpbXBvcnQgXCIuL2NvbXBvbmVudHMvbmF2XCI7XG5pbXBvcnQgXCIuL2NvbXBvbmVudHMvY2x1ZXNcIjtcbmltcG9ydCBcIi4vY29tcG9uZW50cy9ncmlkXCI7XG5pbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4vc3RhdGUvZGF0YVwiO1xuXG5jbGFzcyBYV29yZCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgYXdhaXQgZGF0YS5pbml0KHRoaXMuc3JjKTtcblxuICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtbmF2XCIpO1xuICAgIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC13b3JkLWdyaWRcIik7XG4gICAgY29uc3QgY2x1ZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC13b3JkLWNsdWVzXCIpO1xuXG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZChuYXYpO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZChjbHVlcyk7XG4gIH1cblxuICBnZXQgc3JjKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcInNyY1wiKSE7XG4gIH1cblxuICBzZXQgc3JjKHZhbDogc3RyaW5nKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgdmFsKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmRcIiwgWFdvcmQpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFRQSxNQUFNLE9BQU4sTUFBVztBQUFBLElBQ1Q7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBRUEsTUFBTSxLQUFLLFNBQWlCO0FBQzFCLFlBQU0sT0FBTyxNQUFNLEtBQUssVUFBVSxPQUFPO0FBRXpDLFdBQUssYUFBYSxLQUFLO0FBQ3ZCLFdBQUssU0FBUyxLQUFLO0FBRW5CLFlBQU0sY0FBYyxLQUFLLGNBQWMs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
