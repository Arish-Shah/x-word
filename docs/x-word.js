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
    .selected {
      background: powderblue;
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
      this.subscription = currentStore.subscribe((curr, prev) => {
        if (prev)
          this.shadowRoot.querySelector(`[data-id="${prev}"]`).classList.remove("selected");
        this.shadowRoot.querySelector(`[data-id="${curr}"]`).classList.add("selected");
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

  // src/components/grid.ts
  var template3 = document.createElement("template");
  template3.innerHTML = `
  <style>
    :host {
      display: grid;
      width: 300px;
      border: 1px solid black;
    }

    div {
      border: 1px solid black;
      aspect-ratio: 1/1;

      &.blocked {
        background: black;
      }

      &.highlight {
        background: yellow;
      }

      &[data-label]::before {
      }
    }

  </style>
`;
  var XWordGrid = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template3.content.cloneNode(true));
    }
    connectedCallback() {
      this.style.gridTemplateColumns = `repeat(${data.dimensions.width}, 1fr)`;
      for (let r = 0; r < data.dimensions.height; r++) {
        for (let c = 0; c < data.dimensions.width; c++) {
          this.shadowRoot.appendChild(this.createCell(`${r},${c}`, data.puzzle[r][c]));
        }
      }
      currentStore.subscribe((newValue, oldValue) => {
        if (oldValue) this.clearHighlight(data.clues[oldValue].cells);
        if (newValue) this.addHighlight(data.clues[newValue].cells);
      });
    }
    createCell(id, cellData) {
      const div = document.createElement("div");
      div.dataset.id = id;
      div.textContent = "A";
      if (typeof cellData === "object") cellData = cellData.cell;
      if (cellData === "#") div.classList.add("blocked");
      else if (+cellData > 0) div.dataset.label = cellData.toString();
      return div;
    }
    clearHighlight(cells) {
      for (let cell of cells)
        this.shadowRoot.querySelector(`[data-id="${cell}"]`).classList.remove("highlight");
    }
    addHighlight(cells) {
      for (let cell of cells)
        this.shadowRoot.querySelector(`[data-id="${cell}"]`).classList.add("highlight");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3N0YXRlL2RhdGEudHMiLCAiLi4vc3JjL3N0YXRlL3N0b3JlLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL25hdi50cyIsICIuLi9zcmMvY29tcG9uZW50cy9jbHVlcy50cyIsICIuLi9zcmMvY29tcG9uZW50cy9ncmlkLnRzIiwgIi4uL3NyYy94LXdvcmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHtcbiAgSXB1ekZpbGUsXG4gIERpbWVuc2lvbnMsXG4gIEZvcm1hdHRlZENsdWVzLFxuICBJcHV6UHV6emxlLFxuICBJcHV6Q2x1ZXMsXG59IGZyb20gXCIuLi90eXBlc1wiO1xuXG5jbGFzcyBEYXRhIHtcbiAgZGltZW5zaW9uczogRGltZW5zaW9ucztcbiAgcHV6emxlOiBJcHV6UHV6emxlO1xuICBjbHVlczogRm9ybWF0dGVkQ2x1ZXM7XG5cbiAgYXN5bmMgaW5pdChpcHV6VXJsOiBzdHJpbmcpIHtcbiAgICBjb25zdCBpcHV6ID0gYXdhaXQgdGhpcy5mZXRjaElwdXooaXB1elVybCk7XG5cbiAgICB0aGlzLmRpbWVuc2lvbnMgPSBpcHV6LmRpbWVuc2lvbnM7XG4gICAgdGhpcy5wdXp6bGUgPSBpcHV6LnB1enpsZTtcbiAgICBjb25zdCBjbHVlVG9DZWxscyA9IHRoaXMuZ2VuZXJhdGVDZWxscyhpcHV6LnB1enpsZSk7XG4gICAgdGhpcy5jbHVlcyA9IHRoaXMuZm9ybWF0Q2x1ZXMoaXB1ei5jbHVlcywgY2x1ZVRvQ2VsbHMpO1xuICB9XG5cbiAgZ2V0UHJldkNsdWUoY2x1ZUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbHVlSWRzID0gT2JqZWN0LmtleXModGhpcy5jbHVlcyk7XG4gICAgY29uc3QgaW5kZXggPSBjbHVlSWRzLmluZGV4T2YoY2x1ZUlkKTtcbiAgICBpZiAoaW5kZXggPT09IDApIHJldHVybiBjbHVlSWRzW2NsdWVJZHMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGNsdWVJZHNbaW5kZXggLSAxXTtcbiAgfVxuXG4gIGdldE5leHRDbHVlKGNsdWVJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2x1ZUlkcyA9IE9iamVjdC5rZXlzKHRoaXMuY2x1ZXMpO1xuICAgIGNvbnN0IGluZGV4ID0gY2x1ZUlkcy5pbmRleE9mKGNsdWVJZCk7XG4gICAgaWYgKGluZGV4ID09PSBjbHVlSWRzLmxlbmd0aCAtIDEpIHJldHVybiBjbHVlSWRzWzBdO1xuICAgIHJldHVybiBjbHVlSWRzW2luZGV4ICsgMV07XG4gIH1cblxuICBmb3JtYXRDbHVlcyhjbHVlczogSXB1ekNsdWVzLCBjbHVlVG9DZWxsczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+KSB7XG4gICAgY29uc3QgZm9ybWF0ID0gKGRpcmVjdGlvbjogXCJBY3Jvc3NcIiB8IFwiRG93blwiKTogRm9ybWF0dGVkQ2x1ZXMgPT4ge1xuICAgICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhjbHVlc1tkaXJlY3Rpb25dLm1hcChjbHVlID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBgJHtjbHVlWzBdfS0ke2RpcmVjdGlvbn1gO1xuICAgICAgICByZXR1cm4gW2lkLCB7XG4gICAgICAgICAgaWQsXG4gICAgICAgICAgbnVtYmVyOiBjbHVlWzBdLFxuICAgICAgICAgIGNsdWU6IGNsdWVbMV0sXG4gICAgICAgICAgY2VsbHM6IGNsdWVUb0NlbGxzW2lkXVxuICAgICAgICB9XTtcbiAgICAgIH0pKTtcbiAgICB9O1xuICAgIHJldHVybiB7IC4uLmZvcm1hdChcIkFjcm9zc1wiKSwgLi4uZm9ybWF0KFwiRG93blwiKSB9O1xuICB9XG5cbiAgY2x1ZXNCeURpcmVjdGlvbigpIHtcbiAgICBjb25zdCBBY3Jvc3MgPSBPYmplY3QudmFsdWVzKHRoaXMuY2x1ZXMpLmZpbHRlcigoY2x1ZSkgPT5cbiAgICAgIGNsdWUuaWQuZW5kc1dpdGgoXCJBY3Jvc3NcIikpO1xuICAgIGNvbnN0IERvd24gPSBPYmplY3QudmFsdWVzKHRoaXMuY2x1ZXMpLmZpbHRlcigoY2x1ZSkgPT5cbiAgICAgIGNsdWUuaWQuZW5kc1dpdGgoXCJEb3duXCIpKTtcbiAgICByZXR1cm4geyBBY3Jvc3MsIERvd24gfTtcbiAgfVxuXG4gIGdlbmVyYXRlQ2VsbHMocHV6emxlOiBJcHV6UHV6emxlKSB7XG4gICAgY29uc3QgY2VsbHNNYXAgPSB7fTtcblxuICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICBsZXQgY3VycmVudENsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICBmb3IgKGxldCBjID0gMDsgYyA8IHRoaXMuZGltZW5zaW9ucy53aWR0aDsgYysrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuXG4gICAgICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgICAgIGNhc2UgXCIjXCI6IGN1cnJlbnRDbHVlID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Q2x1ZSkge1xuICAgICAgICAgICAgICBjdXJyZW50Q2x1ZSA9IGNlbGw7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1BY3Jvc3NgXSA9IFtyICsgXCIsXCIgKyBjXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1BY3Jvc3NgXS5wdXNoKHIgKyBcIixcIiArIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgdGhpcy5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgIGxldCBjdXJyZW50Q2x1ZTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuXG4gICAgICAgIHN3aXRjaCAoY2VsbCkge1xuICAgICAgICAgIGNhc2UgXCIjXCI6IGN1cnJlbnRDbHVlID0gbnVsbDsgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50Q2x1ZSkge1xuICAgICAgICAgICAgICBjdXJyZW50Q2x1ZSA9IGNlbGw7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1Eb3duYF0gPSBbciArIFwiLFwiICsgY107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tRG93bmBdLnB1c2gociArIFwiLFwiICsgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjdXJyZW50Q2x1ZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjZWxsc01hcDtcbiAgfVxuXG4gIGFzeW5jIGZldGNoSXB1eih1cmw6IHN0cmluZyk6IFByb21pc2U8SXB1ekZpbGU+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgZGF0YSA9IG5ldyBEYXRhKCk7XG4iLCAiY2xhc3MgU3RvcmU8VD4ge1xuICBzdGF0ZTogVDtcbiAgbGlzdGVuZXJzOiAoKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkgPT4gdm9pZClbXTtcblxuICBjb25zdHJ1Y3Rvcihpbml0aWFsU3RhdGU6IFQpIHtcbiAgICB0aGlzLnN0YXRlID0gaW5pdGlhbFN0YXRlO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cblxuICB1cGRhdGUobmV3U3RhdGU6IFQpIHtcbiAgICBjb25zdCBvbGRTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKG5ld1N0YXRlICE9PSBvbGRTdGF0ZSkge1xuICAgICAgdGhpcy5zdGF0ZSA9IG5ld1N0YXRlO1xuICAgICAgdGhpcy5ub3RpZnlBbGwobmV3U3RhdGUsIG9sZFN0YXRlKTtcbiAgICB9XG4gIH1cblxuICBub3RpZnlBbGwobmV3U3RhdGU6IFQsIG9sZFN0YXRlOiBUKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcihuZXdTdGF0ZSwgb2xkU3RhdGUpKTtcbiAgfVxuXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkgPT4gdm9pZCkge1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGN1cnJlbnRTdG9yZSA9IG5ldyBTdG9yZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiIsICJpbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4uL3N0YXRlL2RhdGFcIjtcbmltcG9ydCB7IGN1cnJlbnRTdG9yZSB9IGZyb20gXCIuLi9zdGF0ZS9zdG9yZVwiO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbnRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPHN0eWxlPlxuICAgIDpob3N0IHtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgfVxuXG4gICAgZGl2IHtcbiAgICAgIHdpZHRoOiAzMDBweDtcbiAgICB9XG4gIDwvc3R5bGU+XG5cbiAgPGJ1dHRvbj5wcmV2PC9idXR0b24+XG4gIDxkaXY+XG4gICAgPHN0cm9uZz48L3N0cm9uZz5cbiAgICA8c3Bhbj48L3NwYW4+XG4gIDwvZGl2PlxuICA8YnV0dG9uPm5leHQ8L2J1dHRvbj5cbmA7XG5cbmNsYXNzIFhXb3JkTmF2IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBzdWJzY3JpcHRpb246ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgY29uc3QgYnV0dG9ucyA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKTtcbiAgICBjb25zdCBzdHJvbmcgPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoXCJzdHJvbmdcIik7XG4gICAgY29uc3Qgc3BhbiA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihcInNwYW5cIik7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IGN1cnJlbnRTdG9yZS5zdWJzY3JpYmUoKG5ld1ZhbCkgPT4ge1xuICAgICAgaWYgKG5ld1ZhbCkge1xuICAgICAgICBzdHJvbmchLnRleHRDb250ZW50ID0gbmV3VmFsLnNwbGl0KFwiLVwiKS5qb2luKFwiIFwiKTtcbiAgICAgICAgc3BhbiEudGV4dENvbnRlbnQgPSBkYXRhLmNsdWVzW25ld1ZhbF0uY2x1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGJ1dHRvbnNbMF0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF8gPT4ge1xuICAgICAgaWYgKGN1cnJlbnRTdG9yZS5zdGF0ZSlcbiAgICAgICAgY3VycmVudFN0b3JlLnVwZGF0ZShkYXRhLmdldFByZXZDbHVlKGN1cnJlbnRTdG9yZS5zdGF0ZSkpO1xuICAgIH0pO1xuXG4gICAgYnV0dG9uc1sxXS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgXyA9PiB7XG4gICAgICBpZiAoY3VycmVudFN0b3JlLnN0YXRlKVxuICAgICAgICBjdXJyZW50U3RvcmUudXBkYXRlKGRhdGEuZ2V0TmV4dENsdWUoY3VycmVudFN0b3JlLnN0YXRlKSk7XG4gICAgfSk7XG4gIH1cblxuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbigpO1xuICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcIngtd29yZC1uYXZcIiwgWFdvcmROYXYpO1xuIiwgImltcG9ydCB0eXBlIHsgRm9ybWF0dGVkQ2x1ZVZhbHVlIH0gZnJvbSBcIi4uL3R5cGVzXCI7XG5pbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4uL3N0YXRlL2RhdGFcIjtcbmltcG9ydCB7IGN1cnJlbnRTdG9yZSB9IGZyb20gXCIuLi9zdGF0ZS9zdG9yZVwiO1xuXG5jb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbnRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPHN0eWxlPlxuICAgIC5zZWxlY3RlZCB7XG4gICAgICBiYWNrZ3JvdW5kOiBwb3dkZXJibHVlO1xuICAgIH1cbiAgPC9zdHlsZT5cbiAgPGRpdj5cbiAgICA8c3Ryb25nPmFjcm9zczwvc3Ryb25nPlxuICAgIDx1bD48L3VsPlxuICA8L2Rpdj5cbiAgPGRpdj5cbiAgICA8c3Ryb25nPmRvd248L3N0cm9uZz5cbiAgICA8dWw+PC91bD5cbiAgPC9kaXY+XG5gO1xuXG5jbGFzcyBYV29yZENsdWVzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBzdWJzY3JpcHRpb246ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgY29uc3QgdWxzID0gdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yQWxsKFwidWxcIik7XG4gICAgY29uc3QgY2x1ZXMgPSBkYXRhLmNsdWVzQnlEaXJlY3Rpb24oKTtcblxuICAgIHVsc1swXS5hcHBlbmQoLi4uY2x1ZXMuQWNyb3NzLm1hcCh0aGlzLmNyZWF0ZUNsdWVJdGVtKSk7XG4gICAgdWxzWzFdLmFwcGVuZCguLi5jbHVlcy5Eb3duLm1hcCh0aGlzLmNyZWF0ZUNsdWVJdGVtKSk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbiA9IGN1cnJlbnRTdG9yZS5zdWJzY3JpYmUoKGN1cnIsIHByZXYpID0+IHtcbiAgICAgIGlmIChwcmV2KVxuICAgICAgICB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtwcmV2fVwiXWApIVxuICAgICAgICAgIC5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIik7XG5cbiAgICAgIHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke2N1cnJ9XCJdYCkhXG4gICAgICAgIC5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7XG4gICAgfSk7XG5cbiAgICBjdXJyZW50U3RvcmUudXBkYXRlKGNsdWVzLkFjcm9zc1swXS5pZCk7XG4gIH1cblxuICBjcmVhdGVDbHVlSXRlbSh7IGlkLCBudW1iZXIsIGNsdWUgfTogRm9ybWF0dGVkQ2x1ZVZhbHVlKSB7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgbGkuZGF0YXNldC5pZCA9IGlkO1xuICAgIGxpLmlubmVySFRNTCA9IGA8c3Bhbj4ke251bWJlcn08L3NwYW4+PHNwYW4+JHtjbHVlfTwvc3Bhbj5gO1xuXG4gICAgbGkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGN1cnJlbnRTdG9yZS51cGRhdGUoaWQpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxpO1xuICB9XG5cbiAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24oKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtY2x1ZXNcIiwgWFdvcmRDbHVlcyk7XG4iLCAiaW1wb3J0IHR5cGUgeyBJcHV6UHV6emxlQ2VsbCB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50U3RvcmUgfSBmcm9tIFwiLi4vc3RhdGUvc3RvcmVcIjtcblxuY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxzdHlsZT5cbiAgICA6aG9zdCB7XG4gICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgd2lkdGg6IDMwMHB4O1xuICAgICAgYm9yZGVyOiAxcHggc29saWQgYmxhY2s7XG4gICAgfVxuXG4gICAgZGl2IHtcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIGJsYWNrO1xuICAgICAgYXNwZWN0LXJhdGlvOiAxLzE7XG5cbiAgICAgICYuYmxvY2tlZCB7XG4gICAgICAgIGJhY2tncm91bmQ6IGJsYWNrO1xuICAgICAgfVxuXG4gICAgICAmLmhpZ2hsaWdodCB7XG4gICAgICAgIGJhY2tncm91bmQ6IHllbGxvdztcbiAgICAgIH1cblxuICAgICAgJltkYXRhLWxhYmVsXTo6YmVmb3JlIHtcbiAgICAgIH1cbiAgICB9XG5cbiAgPC9zdHlsZT5cbmA7XG5cbmNsYXNzIFhXb3JkR3JpZCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zdHlsZS5ncmlkVGVtcGxhdGVDb2x1bW5zID0gYHJlcGVhdCgke2RhdGEuZGltZW5zaW9ucy53aWR0aH0sIDFmcilgO1xuXG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCBkYXRhLmRpbWVuc2lvbnMuaGVpZ2h0OyByKyspIHtcbiAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgZGF0YS5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUNlbGwoYCR7cn0sJHtjfWAsIGRhdGEucHV6emxlW3JdW2NdKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3VycmVudFN0b3JlLnN1YnNjcmliZSgobmV3VmFsdWUsIG9sZFZhbHVlKSA9PiB7XG4gICAgICBpZiAob2xkVmFsdWUpIHRoaXMuY2xlYXJIaWdobGlnaHQoZGF0YS5jbHVlc1tvbGRWYWx1ZV0uY2VsbHMpO1xuICAgICAgaWYgKG5ld1ZhbHVlKSB0aGlzLmFkZEhpZ2hsaWdodChkYXRhLmNsdWVzW25ld1ZhbHVlXS5jZWxscyk7XG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVDZWxsKGlkOiBzdHJpbmcsIGNlbGxEYXRhOiBJcHV6UHV6emxlQ2VsbCkge1xuICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZGl2LmRhdGFzZXQuaWQgPSBpZDtcbiAgICBkaXYudGV4dENvbnRlbnQgPSBcIkFcIjtcblxuICAgIGlmICh0eXBlb2YgY2VsbERhdGEgPT09IFwib2JqZWN0XCIpIGNlbGxEYXRhID0gY2VsbERhdGEuY2VsbDtcbiAgICBpZiAoY2VsbERhdGEgPT09IFwiI1wiKSBkaXYuY2xhc3NMaXN0LmFkZChcImJsb2NrZWRcIik7XG4gICAgZWxzZSBpZiAoK2NlbGxEYXRhID4gMCkgZGl2LmRhdGFzZXQubGFiZWwgPSBjZWxsRGF0YS50b1N0cmluZygpO1xuXG4gICAgcmV0dXJuIGRpdjtcbiAgfVxuXG4gIGNsZWFySGlnaGxpZ2h0KGNlbGxzOiBzdHJpbmdbXSkge1xuICAgIGZvciAobGV0IGNlbGwgb2YgY2VsbHMpXG4gICAgICB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtjZWxsfVwiXWApIVxuICAgICAgICAuY2xhc3NMaXN0LnJlbW92ZShcImhpZ2hsaWdodFwiKTtcbiAgfVxuXG4gIGFkZEhpZ2hsaWdodChjZWxsczogc3RyaW5nW10pIHtcbiAgICBmb3IgKGxldCBjZWxsIG9mIGNlbGxzKVxuICAgICAgdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7Y2VsbH1cIl1gKSFcbiAgICAgICAgLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIik7XG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwieC13b3JkLWdyaWRcIiwgWFdvcmRHcmlkKTtcbiIsICJpbXBvcnQgXCIuL2NvbXBvbmVudHMvbmF2XCI7XG5pbXBvcnQgXCIuL2NvbXBvbmVudHMvY2x1ZXNcIjtcbmltcG9ydCBcIi4vY29tcG9uZW50cy9ncmlkXCI7XG5pbXBvcnQgeyBkYXRhIH0gZnJvbSBcIi4vc3RhdGUvZGF0YVwiO1xuXG5jbGFzcyBYV29yZCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICB9XG5cbiAgYXN5bmMgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgYXdhaXQgZGF0YS5pbml0KHRoaXMuc3JjKTtcblxuICAgIGNvbnN0IG5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtbmF2XCIpO1xuICAgIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC13b3JkLWdyaWRcIik7XG4gICAgY29uc3QgY2x1ZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwieC13b3JkLWNsdWVzXCIpO1xuXG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZChuYXYpO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZChjbHVlcyk7XG4gIH1cblxuICBnZXQgc3JjKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcInNyY1wiKSE7XG4gIH1cblxuICBzZXQgc3JjKHZhbDogc3RyaW5nKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgdmFsKTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmRcIiwgWFdvcmQpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFRQSxNQUFNLE9BQU4sTUFBVztBQUFBLElBQ1Q7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBRUEsTUFBTSxLQUFLLFNBQWlCO0FBQzFCLFlBQU0sT0FBTyxNQUFNLEtBQUssVUFBVSxPQUFPO0FBRXpDLFdBQUssYUFBYSxLQUFLO0FBQ3ZCLFdBQUssU0FBUyxLQUFLO0FBQ25CLFlBQU0sY0FBYyxLQUFLLGNBQWMsS0FBSyxNQUFNO0FBQ2xELFdBQUssUUFBUSxLQUFLLFlBQVksS0FBSyxPQUFPLFdBQVc7QUFBQSxJQUN2RDtBQUFBLElBRUEsWUFBWSxRQUFnQjtBQUMxQixZQUFNLFVBQVUsT0FBTyxLQUFLLEtBQUssS0FBSztBQUN0QyxZQUFNLFFBQVEsUUFBUSxRQUFRLE1BQU07QUFDcEMsVUFBSSxVQUFVLEVBQUcsUUFBTyxRQUFRLFFBQVEsU0FBUyxDQUFDO0FBQ2xELGFBQU8sUUFBUSxRQUFRLENBQUM7QUFBQSxJQUMxQjtBQUFBLElBRUEsWUFBWSxRQUFnQjtBQUMxQixZQUFNLFVBQVUsT0FB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
