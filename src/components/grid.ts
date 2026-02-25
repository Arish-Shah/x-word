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
  }

  createCell(id: string, cellData: IpuzPuzzleCell) {
    const cellEl = document.createElement("x-word-cell") as XWordCell;
    cellEl.dataset.id = id;
    if (cellData === "#") cellEl.blocked = true;
    else if (+cellData > 0) cellEl.label = cellData.toString();

    return cellEl;
  }
}

customElements.define("x-word-grid", XWordGrid)
