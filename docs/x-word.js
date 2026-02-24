(() => {
  // src/state/data.ts
  var Data = class {
    dimensions;
    clues;
    async init(ipuzUrl) {
      const ipuz = await this.fetchIpuz(ipuzUrl);
      const clueToCells = this.generateCells(ipuz.puzzle);
      this.dimensions = ipuz.dimensions;
      this.clues = this.formatClues(ipuz.clues, clueToCells);
    }
    formatClues(clues, clueToCells) {
      const format = (direction) => {
        return Object.fromEntries(clues[direction].map((clue) => {
          if (Array.isArray(clue)) {
            const id = `${clue[0]}-${direction}`;
            return [id, { id, number: clue[0], clue: clue[1], cells: clueToCells[id] }];
          } else {
            const id = `${clue.number}-${direction}`;
            return [id, { id, ...clue, cells: clueToCells[id] }];
          }
        }));
      };
      return { ...format("Across"), ...format("Down") };
    }
    directionalClues() {
    }
    generateCells(puzzle) {
      const cellsMap = {};
      for (let r = 0; r < this.dimensions.height; r++) {
        let currentClue = null;
        for (let c = 0; c < this.dimensions.width; c++) {
          let cell = puzzle[r][c];
          if (typeof cell === "object") cell = cell.cell;
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
          if (typeof cell === "object") cell = cell.cell;
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

  // src/components/clues.ts
  var template = document.createElement("template");
  template.innerHTML = `
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
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    connectedCallback() {
      const uls = this.shadowRoot.querySelectorAll("ul");
      uls[0].append(...data.clues.Across.map(this.createClueItem));
      uls[1].append(...data.clues.Down.map(this.createClueItem));
      currentClueStore.subscribe((curr, prev) => {
        if (prev)
          this.shadowRoot.querySelector(`[data-id="${prev}"]`).classList.remove("selected");
        this.shadowRoot.querySelector(`[data-id="${curr}"]`).classList.add("selected");
      });
      currentClueStore.update(data.clues.Across[0].id);
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
  };
  customElements.define("x-word-clues", XWordClues);

  // src/components/grid.ts
  var template2 = document.createElement("template");
  template2.innerHTML = ``;
  var XWordGrid = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template2.content.cloneNode(true));
    }
    connectedCallback() {
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
      const grid = document.createElement("x-word-grid");
      const clues = document.createElement("x-word-clues");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3N0YXRlL2RhdGEudHMiLCAiLi4vc3JjL3N0YXRlL3N0b3JlLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2NsdWVzLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2dyaWQudHMiLCAiLi4vc3JjL3gtd29yZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUge1xuICBJcHV6RmlsZSxcbiAgRGltZW5zaW9ucyxcbiAgRm9ybWF0dGVkQ2x1ZXMsXG4gIElwdXpQdXp6bGUsXG4gIElwdXpDbHVlcyxcbiAgRm9ybWF0dGVkQ2x1ZVZhbHVlLFxufSBmcm9tIFwiLi4vdHlwZXNcIjtcblxuY2xhc3MgRGF0YSB7XG4gIGRpbWVuc2lvbnM6IERpbWVuc2lvbnM7XG4gIGNsdWVzOiBGb3JtYXR0ZWRDbHVlcztcblxuICBhc3luYyBpbml0KGlwdXpVcmw6IHN0cmluZykge1xuICAgIGNvbnN0IGlwdXogPSBhd2FpdCB0aGlzLmZldGNoSXB1eihpcHV6VXJsKTtcbiAgICBjb25zdCBjbHVlVG9DZWxscyA9IHRoaXMuZ2VuZXJhdGVDZWxscyhpcHV6LnB1enpsZSk7XG5cbiAgICB0aGlzLmRpbWVuc2lvbnMgPSBpcHV6LmRpbWVuc2lvbnM7XG4gICAgdGhpcy5jbHVlcyA9IHRoaXMuZm9ybWF0Q2x1ZXMoaXB1ei5jbHVlcywgY2x1ZVRvQ2VsbHMpO1xuICB9XG5cbiAgZm9ybWF0Q2x1ZXMoY2x1ZXM6IElwdXpDbHVlcywgY2x1ZVRvQ2VsbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPikge1xuICAgIGNvbnN0IGZvcm1hdCA9IChkaXJlY3Rpb246IFwiQWNyb3NzXCIgfCBcIkRvd25cIik6IEZvcm1hdHRlZENsdWVzID0+IHtcbiAgICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoY2x1ZXNbZGlyZWN0aW9uXS5tYXAoY2x1ZSA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNsdWUpKSB7XG4gICAgICAgICAgY29uc3QgaWQgPSBgJHtjbHVlWzBdfS0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgIHJldHVybiBbaWQsIHsgaWQsIG51bWJlcjogY2x1ZVswXSwgY2x1ZTogY2x1ZVsxXSwgY2VsbHM6IGNsdWVUb0NlbGxzW2lkXSB9XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBpZCA9IGAke2NsdWUubnVtYmVyfS0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgIHJldHVybiBbaWQsIHsgaWQsIC4uLmNsdWUsIGNlbGxzOiBjbHVlVG9DZWxsc1tpZF0gfV07XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHsgLi4uZm9ybWF0KFwiQWNyb3NzXCIpLCAuLi5mb3JtYXQoXCJEb3duXCIpIH07XG4gIH1cblxuICBkaXJlY3Rpb25hbENsdWVzKCkge1xuICAgIC8vIGhlcmVcbiAgfVxuXG4gIGdlbmVyYXRlQ2VsbHMocHV6emxlOiBJcHV6UHV6emxlKSB7XG4gICAgY29uc3QgY2VsbHNNYXAgPSB7fTtcblxuICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICBsZXQgY3VycmVudENsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICBmb3IgKGxldCBjID0gMDsgYyA8IHRoaXMuZGltZW5zaW9ucy53aWR0aDsgYysrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuICAgICAgICBpZiAodHlwZW9mIGNlbGwgPT09IFwib2JqZWN0XCIpIGNlbGwgPSBjZWxsLmNlbGw7XG5cbiAgICAgICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICAgICAgY2FzZSBcIiNcIjogY3VycmVudENsdWUgPSBudWxsOyBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDbHVlKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRDbHVlID0gY2VsbDtcbiAgICAgICAgICAgICAgY2VsbHNNYXBbYCR7Y3VycmVudENsdWV9LUFjcm9zc2BdID0gW3IgKyBcIixcIiArIGNdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2VsbHNNYXBbYCR7Y3VycmVudENsdWV9LUFjcm9zc2BdLnB1c2gociArIFwiLFwiICsgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjdXJyZW50Q2x1ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgYyA9IDA7IGMgPCB0aGlzLmRpbWVuc2lvbnMud2lkdGg7IGMrKykge1xuICAgICAgbGV0IGN1cnJlbnRDbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0OyByKyspIHtcbiAgICAgICAgbGV0IGNlbGwgPSBwdXp6bGVbcl1bY107XG4gICAgICAgIGlmICh0eXBlb2YgY2VsbCA9PT0gXCJvYmplY3RcIikgY2VsbCA9IGNlbGwuY2VsbDtcblxuICAgICAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgICAgICBjYXNlIFwiI1wiOiBjdXJyZW50Q2x1ZSA9IG51bGw7IGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudENsdWUpIHtcbiAgICAgICAgICAgICAgY3VycmVudENsdWUgPSBjZWxsO1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tRG93bmBdID0gW3IgKyBcIixcIiArIGNdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY2VsbHNNYXBbYCR7Y3VycmVudENsdWV9LURvd25gXS5wdXNoKHIgKyBcIixcIiArIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY2VsbHNNYXA7XG4gIH1cblxuICBhc3luYyBmZXRjaElwdXoodXJsOiBzdHJpbmcpOiBQcm9taXNlPElwdXpGaWxlPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGRhdGEgPSBuZXcgRGF0YSgpO1xuIiwgImNsYXNzIFN0b3JlPFQ+IHtcbiAgc3RhdGU6IFQ7XG4gIGxpc3RlbmVyczogKChuZXdTdGF0ZTogVCwgb2xkU3RhdGU6IFQpID0+IHZvaWQpW107XG5cbiAgY29uc3RydWN0b3IoaW5pdGlhbFN0YXRlOiBUKSB7XG4gICAgdGhpcy5zdGF0ZSA9IGluaXRpYWxTdGF0ZTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgdXBkYXRlKG5ld1N0YXRlOiBUKSB7XG4gICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChuZXdTdGF0ZSAhPT0gb2xkU3RhdGUpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICAgIHRoaXMubm90aWZ5QWxsKG5ld1N0YXRlLCBvbGRTdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgbm90aWZ5QWxsKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIobmV3U3RhdGUsIG9sZFN0YXRlKSk7XG4gIH1cblxuICBzdWJzY3JpYmUobGlzdGVuZXI6IChuZXdTdGF0ZTogVCwgb2xkU3RhdGU6IFQpID0+IHZvaWQpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjdXJyZW50Q2x1ZVN0b3JlID0gbmV3IFN0b3JlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuIiwgImltcG9ydCB0eXBlIHsgRm9ybWF0dGVkQ2x1ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50Q2x1ZVN0b3JlIH0gZnJvbSBcIi4uL3N0YXRlL3N0b3JlXCI7XG5cbmNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xudGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8c3R5bGU+XG4gICAgLnNlbGVjdGVkIHtcbiAgICAgIGJhY2tncm91bmQ6IHBvd2RlcmJsdWU7XG4gICAgfVxuICA8L3N0eWxlPlxuICA8ZGl2PlxuICAgIDxzdHJvbmc+YWNyb3NzPC9zdHJvbmc+XG4gICAgPHVsPjwvdWw+XG4gIDwvZGl2PlxuICA8ZGl2PlxuICAgIDxzdHJvbmc+ZG93bjwvc3Ryb25nPlxuICAgIDx1bD48L3VsPlxuICA8L2Rpdj5cbmA7XG5cbmNsYXNzIFhXb3JkQ2x1ZXMgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnN0IHVscyA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvckFsbChcInVsXCIpO1xuXG4gICAgdWxzWzBdLmFwcGVuZCguLi5kYXRhLmNsdWVzLkFjcm9zcy5tYXAodGhpcy5jcmVhdGVDbHVlSXRlbSkpO1xuICAgIHVsc1sxXS5hcHBlbmQoLi4uZGF0YS5jbHVlcy5Eb3duLm1hcCh0aGlzLmNyZWF0ZUNsdWVJdGVtKSk7XG5cbiAgICBjdXJyZW50Q2x1ZVN0b3JlLnN1YnNjcmliZSgoY3VyciwgcHJldikgPT4ge1xuICAgICAgaWYgKHByZXYpXG4gICAgICAgIHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke3ByZXZ9XCJdYCkhXG4gICAgICAgICAgLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcblxuICAgICAgdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7Y3Vycn1cIl1gKSFcbiAgICAgICAgLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcbiAgICB9KTtcblxuICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGRhdGEuY2x1ZXMuQWNyb3NzWzBdLmlkKTtcbiAgfVxuXG4gIGNyZWF0ZUNsdWVJdGVtKHsgaWQsIG51bWJlciwgY2x1ZSB9OiBGb3JtYXR0ZWRDbHVlKSB7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgbGkuZGF0YXNldC5pZCA9IGlkO1xuICAgIGxpLmlubmVySFRNTCA9IGA8c3Bhbj4ke251bWJlcn08L3NwYW4+PHNwYW4+JHtjbHVlfTwvc3Bhbj5gO1xuXG4gICAgbGkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGlkKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsaTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtY2x1ZXNcIiwgWFdvcmRDbHVlcyk7XG4iLCAiY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgYDtcblxuY2xhc3MgWFdvcmRHcmlkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtZ3JpZFwiLCBYV29yZEdyaWQpO1xuIiwgImltcG9ydCBcIi4vY29tcG9uZW50cy9jbHVlc1wiO1xuaW1wb3J0IFwiLi9jb21wb25lbnRzL2dyaWRcIjtcbmltcG9ydCB7IGRhdGEgfSBmcm9tIFwiLi9zdGF0ZS9kYXRhXCI7XG5cbmNsYXNzIFhXb3JkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gIH1cblxuICBhc3luYyBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBhd2FpdCBkYXRhLmluaXQodGhpcy5zcmMpO1xuXG4gICAgY29uc3QgZ3JpZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtZ3JpZFwiKTtcbiAgICBjb25zdCBjbHVlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtY2x1ZXNcIik7XG5cbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKGdyaWQpO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQoY2x1ZXMpO1xuICB9XG5cbiAgZ2V0IHNyYygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoXCJzcmNcIikhO1xuICB9XG5cbiAgc2V0IHNyYyh2YWw6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwic3JjXCIsIHZhbCk7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
