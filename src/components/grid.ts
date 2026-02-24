import type { IpuzPuzzleCell } from "../types";
import { data } from "../state/data";
import { currentStore } from "../state/store";

const template = document.createElement("template");
template.innerHTML = `
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

class XWordGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.style.gridTemplateColumns = `repeat(${data.dimensions.width}, 1fr)`;

    for (let r = 0; r < data.dimensions.height; r++) {
      for (let c = 0; c < data.dimensions.width; c++) {
        this.shadowRoot!.appendChild(this.createCell(`${r},${c}`, data.puzzle[r][c]));
      }
    }

    currentStore.subscribe((newValue, oldValue) => {
      if (oldValue) this.clearHighlight(data.clues[oldValue].cells);
      if (newValue) this.addHighlight(data.clues[newValue].cells);
    });
  }

  createCell(id: string, cellData: IpuzPuzzleCell) {
    const div = document.createElement("div");
    div.dataset.id = id;
    div.textContent = "A";

    if (typeof cellData === "object") cellData = cellData.cell;
    if (cellData === "#") div.classList.add("blocked");
    else if (+cellData > 0) div.dataset.label = cellData.toString();

    return div;
  }

  clearHighlight(cells: string[]) {
    for (let cell of cells)
      this.shadowRoot!.querySelector(`[data-id="${cell}"]`)!
        .classList.remove("highlight");
  }

  addHighlight(cells: string[]) {
    for (let cell of cells)
      this.shadowRoot!.querySelector(`[data-id="${cell}"]`)!
        .classList.add("highlight");
  }
}

customElements.define("x-word-grid", XWordGrid);
