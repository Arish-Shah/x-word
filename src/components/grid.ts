import type { IpuzPuzzleCell } from "../types";
import { data } from "../state/data";
import { currentCellStore, currentClueStore } from "../state/store";
import { createSelector } from "../util";
import "./cell";
import { XWordCell } from "./cell";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: grid;
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

    currentClueStore.subscribe((newValue, oldValue) => {
      const indices: string[] = [];
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

  createCell(id: string, cellData: IpuzPuzzleCell) {
    const cellEl = document.createElement("x-word-cell") as XWordCell;
    cellEl.dataset.id = id;
    if (cellData === "#") cellEl.blocked = true;
    else if (+cellData > 0) cellEl.label = cellData.toString();

    return cellEl;
  }

  highlightCells(indices: string[]) {
    const cells = this.shadowRoot!
      .querySelectorAll(createSelector(indices)) as NodeListOf<XWordCell>;
    cells.forEach(cell => cell.highlight());
  }

  focusCell(index: string) {
    (this.shadowRoot!.querySelector(`[data-id="${index}"]`) as XWordCell)
      .focus();
  }
}

customElements.define("x-word-grid", XWordGrid)
