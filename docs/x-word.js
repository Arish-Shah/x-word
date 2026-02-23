(() => {
  // src/state/data.ts
  var Data = class {
    dimensions;
    clues;
    cells;
    cluesMap;
    async init(ipuzUrl) {
      const ipuz = await this.fetchIpuz(ipuzUrl);
      this.dimensions = ipuz.dimensions;
      this.cells = this.generateCells(ipuz.puzzle);
      this.clues = this.formatClues(ipuz.clues);
      this.cluesMap = this.generateCluesMap();
      console.log(this.cluesMap);
    }
    generateCluesMap() {
      const cluesMap = Object.fromEntries(this.clues.Across.map((clue) => {
        return [clue.id, { ...clue, cells: this.cells[clue.id] }];
      }));
      return cluesMap;
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
    formatClues(clues) {
      const Across = clues.Across.map((clue) => {
        if (Array.isArray(clue)) {
          return { id: clue[0] + "-Across", number: clue[0], clue: clue[1] };
        } else {
          return { ...clue, id: clue.number + "-Across" };
        }
      });
      const Down = clues.Down.map((clue) => {
        if (Array.isArray(clue)) {
          return { id: clue[0] + "-Down", number: clue[0], clue: clue[1] };
        } else {
          return { ...clue, id: clue.number + "-Down" };
        }
      });
      return { Across, Down };
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3N0YXRlL2RhdGEudHMiLCAiLi4vc3JjL3N0YXRlL3N0b3JlLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2NsdWVzLnRzIiwgIi4uL3NyYy9jb21wb25lbnRzL2dyaWQudHMiLCAiLi4vc3JjL3gtd29yZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUge1xuICBJcHV6RmlsZSxcbiAgRGltZW5zaW9ucyxcbiAgSXB1ekNsdWVzLFxuICBGb3JtYXR0ZWRDbHVlcyxcbiAgSXB1elB1enpsZSxcbiAgRm9ybWF0dGVkQ2x1ZSxcbn0gZnJvbSBcIi4uL3R5cGVzXCI7XG5cbmNsYXNzIERhdGEge1xuICBkaW1lbnNpb25zOiBEaW1lbnNpb25zO1xuICBjbHVlczogRm9ybWF0dGVkQ2x1ZXM7XG4gIGNlbGxzOiBSZWNvcmQ8c3RyaW5nLCAoc3RyaW5nIHwgbnVsbCk+O1xuICBjbHVlc01hcDogUmVjb3JkPHN0cmluZywgRm9ybWF0dGVkQ2x1ZT47XG5cbiAgYXN5bmMgaW5pdChpcHV6VXJsOiBzdHJpbmcpIHtcbiAgICBjb25zdCBpcHV6ID0gYXdhaXQgdGhpcy5mZXRjaElwdXooaXB1elVybCk7XG4gICAgdGhpcy5kaW1lbnNpb25zID0gaXB1ei5kaW1lbnNpb25zO1xuXG4gICAgdGhpcy5jZWxscyA9IHRoaXMuZ2VuZXJhdGVDZWxscyhpcHV6LnB1enpsZSk7XG4gICAgdGhpcy5jbHVlcyA9IHRoaXMuZm9ybWF0Q2x1ZXMoaXB1ei5jbHVlcyk7XG5cbiAgICB0aGlzLmNsdWVzTWFwID0gdGhpcy5nZW5lcmF0ZUNsdWVzTWFwKCk7XG4gICAgY29uc29sZS5sb2codGhpcy5jbHVlc01hcCk7XG4gIH1cblxuICBnZW5lcmF0ZUNsdWVzTWFwKCkge1xuICAgIGNvbnN0IGNsdWVzTWFwID0gT2JqZWN0LmZyb21FbnRyaWVzKHRoaXMuY2x1ZXMuQWNyb3NzLm1hcChjbHVlID0+IHtcbiAgICAgIHJldHVybiBbY2x1ZS5pZCwgeyAuLi5jbHVlLCBjZWxsczogdGhpcy5jZWxsc1tjbHVlLmlkXSB9XTtcbiAgICB9KSk7XG4gICAgcmV0dXJuIGNsdWVzTWFwO1xuICB9XG5cbiAgZ2VuZXJhdGVDZWxscyhwdXp6bGU6IElwdXpQdXp6bGUpIHtcbiAgICBjb25zdCBjZWxsc01hcCA9IHt9O1xuXG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCB0aGlzLmRpbWVuc2lvbnMuaGVpZ2h0OyByKyspIHtcbiAgICAgIGxldCBjdXJyZW50Q2x1ZTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgdGhpcy5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgICAgbGV0IGNlbGwgPSBwdXp6bGVbcl1bY107XG4gICAgICAgIGlmICh0eXBlb2YgY2VsbCA9PT0gXCJvYmplY3RcIikgY2VsbCA9IGNlbGwuY2VsbDtcblxuICAgICAgICBzd2l0Y2ggKGNlbGwpIHtcbiAgICAgICAgICBjYXNlIFwiI1wiOiBjdXJyZW50Q2x1ZSA9IG51bGw7IGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudENsdWUpIHtcbiAgICAgICAgICAgICAgY3VycmVudENsdWUgPSBjZWxsO1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tQWNyb3NzYF0gPSBbciArIFwiLFwiICsgY107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjZWxsc01hcFtgJHtjdXJyZW50Q2x1ZX0tQWNyb3NzYF0ucHVzaChyICsgXCIsXCIgKyBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIGZvciAobGV0IGMgPSAwOyBjIDwgdGhpcy5kaW1lbnNpb25zLndpZHRoOyBjKyspIHtcbiAgICAgIGxldCBjdXJyZW50Q2x1ZTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IHIgPSAwOyByIDwgdGhpcy5kaW1lbnNpb25zLmhlaWdodDsgcisrKSB7XG4gICAgICAgIGxldCBjZWxsID0gcHV6emxlW3JdW2NdO1xuICAgICAgICBpZiAodHlwZW9mIGNlbGwgPT09IFwib2JqZWN0XCIpIGNlbGwgPSBjZWxsLmNlbGw7XG5cbiAgICAgICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICAgICAgY2FzZSBcIiNcIjogY3VycmVudENsdWUgPSBudWxsOyBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDbHVlKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRDbHVlID0gY2VsbDtcbiAgICAgICAgICAgICAgY2VsbHNNYXBbYCR7Y3VycmVudENsdWV9LURvd25gXSA9IFtyICsgXCIsXCIgKyBjXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNlbGxzTWFwW2Ake2N1cnJlbnRDbHVlfS1Eb3duYF0ucHVzaChyICsgXCIsXCIgKyBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY3VycmVudENsdWUgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjZWxsc01hcDtcbiAgfVxuXG4gIGZvcm1hdENsdWVzKGNsdWVzOiBJcHV6Q2x1ZXMpIHtcbiAgICBjb25zdCBBY3Jvc3MgPSBjbHVlcy5BY3Jvc3MubWFwKGNsdWUgPT4ge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2x1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHsgaWQ6IGNsdWVbMF0gKyBcIi1BY3Jvc3NcIiwgbnVtYmVyOiBjbHVlWzBdLCBjbHVlOiBjbHVlWzFdIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4geyAuLi5jbHVlLCBpZDogY2x1ZS5udW1iZXIgKyBcIi1BY3Jvc3NcIiB9O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgRG93biA9IGNsdWVzLkRvd24ubWFwKGNsdWUgPT4ge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2x1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHsgaWQ6IGNsdWVbMF0gKyBcIi1Eb3duXCIsIG51bWJlcjogY2x1ZVswXSwgY2x1ZTogY2x1ZVsxXSB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHsgLi4uY2x1ZSwgaWQ6IGNsdWUubnVtYmVyICsgXCItRG93blwiIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyBBY3Jvc3MsIERvd24gfSBzYXRpc2ZpZXMgRm9ybWF0dGVkQ2x1ZXM7XG4gIH1cblxuICBhc3luYyBmZXRjaElwdXoodXJsOiBzdHJpbmcpOiBQcm9taXNlPElwdXpGaWxlPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGRhdGEgPSBuZXcgRGF0YSgpO1xuIiwgImNsYXNzIFN0b3JlPFQ+IHtcbiAgc3RhdGU6IFQ7XG4gIGxpc3RlbmVyczogKChuZXdTdGF0ZTogVCwgb2xkU3RhdGU6IFQpID0+IHZvaWQpW107XG5cbiAgY29uc3RydWN0b3IoaW5pdGlhbFN0YXRlOiBUKSB7XG4gICAgdGhpcy5zdGF0ZSA9IGluaXRpYWxTdGF0ZTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgdXBkYXRlKG5ld1N0YXRlOiBUKSB7XG4gICAgY29uc3Qgb2xkU3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChuZXdTdGF0ZSAhPT0gb2xkU3RhdGUpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICAgIHRoaXMubm90aWZ5QWxsKG5ld1N0YXRlLCBvbGRTdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgbm90aWZ5QWxsKG5ld1N0YXRlOiBULCBvbGRTdGF0ZTogVCkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIobmV3U3RhdGUsIG9sZFN0YXRlKSk7XG4gIH1cblxuICBzdWJzY3JpYmUobGlzdGVuZXI6IChuZXdTdGF0ZTogVCwgb2xkU3RhdGU6IFQpID0+IHZvaWQpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjdXJyZW50Q2x1ZVN0b3JlID0gbmV3IFN0b3JlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuIiwgImltcG9ydCB0eXBlIHsgRm9ybWF0dGVkQ2x1ZSB9IGZyb20gXCIuLi90eXBlc1wiO1xuaW1wb3J0IHsgZGF0YSB9IGZyb20gXCIuLi9zdGF0ZS9kYXRhXCI7XG5pbXBvcnQgeyBjdXJyZW50Q2x1ZVN0b3JlIH0gZnJvbSBcIi4uL3N0YXRlL3N0b3JlXCI7XG5cbmNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xudGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8c3R5bGU+XG4gICAgLnNlbGVjdGVkIHtcbiAgICAgIGJhY2tncm91bmQ6IHBvd2RlcmJsdWU7XG4gICAgfVxuICA8L3N0eWxlPlxuICA8ZGl2PlxuICAgIDxzdHJvbmc+YWNyb3NzPC9zdHJvbmc+XG4gICAgPHVsPjwvdWw+XG4gIDwvZGl2PlxuICA8ZGl2PlxuICAgIDxzdHJvbmc+ZG93bjwvc3Ryb25nPlxuICAgIDx1bD48L3VsPlxuICA8L2Rpdj5cbmA7XG5cbmNsYXNzIFhXb3JkQ2x1ZXMgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgfVxuXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnN0IHVscyA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvckFsbChcInVsXCIpO1xuXG4gICAgdWxzWzBdLmFwcGVuZCguLi5kYXRhLmNsdWVzLkFjcm9zcy5tYXAodGhpcy5jcmVhdGVDbHVlSXRlbSkpO1xuICAgIHVsc1sxXS5hcHBlbmQoLi4uZGF0YS5jbHVlcy5Eb3duLm1hcCh0aGlzLmNyZWF0ZUNsdWVJdGVtKSk7XG5cbiAgICBjdXJyZW50Q2x1ZVN0b3JlLnN1YnNjcmliZSgoY3VyciwgcHJldikgPT4ge1xuICAgICAgaWYgKHByZXYpXG4gICAgICAgIHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcihgW2RhdGEtaWQ9XCIke3ByZXZ9XCJdYCkhXG4gICAgICAgICAgLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcblxuICAgICAgdGhpcy5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1pZD1cIiR7Y3Vycn1cIl1gKSFcbiAgICAgICAgLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcbiAgICB9KTtcblxuICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGRhdGEuY2x1ZXMuQWNyb3NzWzBdLmlkKTtcbiAgfVxuXG4gIGNyZWF0ZUNsdWVJdGVtKHsgaWQsIG51bWJlciwgY2x1ZSB9OiBGb3JtYXR0ZWRDbHVlKSB7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgbGkuZGF0YXNldC5pZCA9IGlkO1xuICAgIGxpLmlubmVySFRNTCA9IGA8c3Bhbj4ke251bWJlcn08L3NwYW4+PHNwYW4+JHtjbHVlfTwvc3Bhbj5gO1xuXG4gICAgbGkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIGN1cnJlbnRDbHVlU3RvcmUudXBkYXRlKGlkKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsaTtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtY2x1ZXNcIiwgWFdvcmRDbHVlcyk7XG4iLCAiY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG50ZW1wbGF0ZS5pbm5lckhUTUwgPSBgYDtcblxuY2xhc3MgWFdvcmRHcmlkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgdGhpcy5zaGFkb3dSb290IS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gIH1cblxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4LXdvcmQtZ3JpZFwiLCBYV29yZEdyaWQpO1xuIiwgImltcG9ydCBcIi4vY29tcG9uZW50cy9jbHVlc1wiO1xuaW1wb3J0IFwiLi9jb21wb25lbnRzL2dyaWRcIjtcbmltcG9ydCB7IGRhdGEgfSBmcm9tIFwiLi9zdGF0ZS9kYXRhXCI7XG5cbmNsYXNzIFhXb3JkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gIH1cblxuICBhc3luYyBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBhd2FpdCBkYXRhLmluaXQodGhpcy5zcmMpO1xuXG4gICAgY29uc3QgZ3JpZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtZ3JpZFwiKTtcbiAgICBjb25zdCBjbHVlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ4LXdvcmQtY2x1ZXNcIik7XG5cbiAgICB0aGlzLnNoYWRvd1Jvb3QhLmFwcGVuZENoaWxkKGdyaWQpO1xuICAgIHRoaXMuc2hhZG93Um9vdCEuYXBwZW5kQ2hpbGQoY2x1ZXMpO1xuICB9XG5cbiAgZ2V0IHNyYygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoXCJzcmNcIikhO1xuICB9XG5cbiAgc2V0IHNyYyh2YWw6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwic3JjXCIsIHZhbCk7XG4gIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwieC13b3JkXCIsIFhXb3JkKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBU0EsTUFBTSxPQUFOLE1BQVc7QUFBQSxJQUNUO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQSxNQUFNLEtBQUssU0FBaUI7QUFDMUIsWUFBTSxPQUFPLE1BQU0sS0FBSyxVQUFVLE9BQU87QUFDekMsV0FBSyxhQUFhLEtBQUs7QUFFdkIsV0FBSyxRQUFRLEtBQUssY0FBYyxLQUFLLE1BQU07QUFDM0MsV0FBSyxRQUFRLEtBQUssWUFBWSxLQUFLLEtBQUs7QUFFeEMsV0FBSyxXQUFXLEtBQUssaUJBQWlCO0FBQ3RDLGNBQVEsSUFBSSxLQUFLLFFBQVE7QUFBQSxJQUMzQjtBQUFBLElBRUEsbUJBQW1CO0FBQ2pCLFlBQU0sV0FBVyxPQUFPLFlBQVksS0FBSyxNQUFNLE9BQU8sSUFBSSxVQUFRO0FBQ2hFLGVBQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxHQUFHLE1BQU0sT0FBTyxLQUFLLE1BQU0sS0FBSyxFQUFFLEVBQUUsQ0FBQztBQUFBLE1BQzFELENBQUMsQ0FBQztBQUNGLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFFQSxjQUFjLFFBQW9CO0FBQ2hDLFlBQU0sV0FBVyxDQUFDO0FBRWxCLGVBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxX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VTtBQUFBLE1BQzdCLENBQUM7QUFFRCx1QkFBaUIsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUFBLElBQ2pEO0FBQUEsSUFFQSxlQUFlLEVBQUUsSUFBSSxRQUFRLEtBQUssR0FBa0I7QUFDbEQsWUFBTSxLQUFLLFNBQVMsY0FBYyxJQUFJO0FBQ3RDLFNBQUcsUUFBUSxLQUFLO0FBQ2hCLFNBQUcsWUFBWSxTQUFTLE1BQU0sZ0JBQWdCLElBQUk7QUFFbEQsU0FBRyxpQkFBaUIsU0FBUyxNQUFNO0FBQ2pDLHlCQUFpQixPQUFPLEVBQUU7QUFBQSxNQUM1QixDQUFDO0FBRUQsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBRUEsaUJBQWUsT0FBTyxnQkFBZ0IsVUFBVTs7O0FDM0RoRCxNQUFNQSxZQUFXLFNBQVMsY0FBYyxVQUFVO0FBQ2xELEVBQUFBLFVBQVMsWUFBWTtBQUVyQixNQUFNLFlBQU4sY0FBd0IsWUFBWTtBQUFBLElBQ2xDLGNBQWM7QUFDWixZQUFNO0FBQ04sV0FBSyxhQUFhLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDbEMsV0FBSyxXQUFZLFlBQVlBLFVBQVMsUUFBUSxVQUFVLElBQUksQ0FBQztBQUFBLElBQy9EO0FBQUEsSUFFQSxvQkFBb0I7QUFBQSxJQUNwQjtBQUFBLEVBQ0Y7QUFFQSxpQkFBZSxPQUFPLGVBQWUsU0FBUzs7O0FDVjlDLE1BQU0sUUFBTixjQUFvQixZQUFZO0FBQUEsSUFDOUIsY0FBYztBQUNaLFlBQU07QUFDTixXQUFLLGFBQWEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUFBLElBQ3BDO0FBQUEsSUFFQSxNQUFNLG9CQUFvQjtBQUN4QixZQUFNLEtBQUssS0FBSyxLQUFLLEdBQUc7QUFFeEIsWUFBTSxPQUFPLFNBQVMsY0FBYyxhQUFhO0FBQ2pELFlBQU0sUUFBUSxTQUFTLGNBQWMsY0FBYztBQUVuRCxXQUFLLFdBQVksWUFBWSxJQUFJO0FBQ2pDLFdBQUssV0FBWSxZQUFZLEtBQUs7QUFBQSxJQUNwQztBQUFBLElBRUEsSUFBSSxNQUFNO0FBQ1IsYUFBTyxLQUFLLGFBQWEsS0FBSztBQUFBLElBQ2hDO0FBQUEsSUFFQSxJQUFJLElBQUksS0FBYTtBQUNuQixXQUFLLGFBQWEsT0FBTyxHQUFHO0FBQUEsSUFDOUI7QUFBQSxFQUNGO0FBRUEsaUJBQWUsT0FBTyxVQUFVLEtBQUs7IiwKICAibmFtZXMiOiBbInRlbXBsYXRlIl0KfQo=
