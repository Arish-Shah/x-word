import type { IpuzDimensions, IpuzPuzzle } from "../core/types";
import { coords, getCellValue } from "../core/util";

const template = document.createElement("template");
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

export class XWordGrid extends HTMLElement {
  private CELL_SIZE = 32;
  dimensions!: IpuzDimensions;
  puzzle!: IpuzPuzzle;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const { height, width } = this.dimensions;
    const gridHeight = (height * this.CELL_SIZE) + height + 1;
    const gridWidth = (width * this.CELL_SIZE) + width + 1;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${gridWidth} ${gridHeight}`);

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        svg.appendChild(this.createCell(r, c));
      }
    }

    this.shadowRoot!.appendChild(svg);
  }

  createCell(r: number, c: number) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.dataset.coord = coords([r, c]);

    let cell = getCellValue(this.puzzle[r][c]);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String((this.CELL_SIZE * c) + c + 1));
    rect.setAttribute("y", String((this.CELL_SIZE * r) + r + 1));
    rect.setAttribute("width", String(this.CELL_SIZE));
    rect.setAttribute("height", String(this.CELL_SIZE));

    if (cell === "#") rect.classList.add("blocked");
    else if (cell === null) rect.classList.add("hidden");

    g.appendChild(rect);

    return g;
  }
}

customElements.define("x-word-grid", XWordGrid);
