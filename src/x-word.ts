import { XWordGrid } from "./components/grid";
import { XWordClues } from "./components/clues";
import { Data } from "./core/data";
import "./components/grid";
import "./components/clues";
import "./core/styles";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 740px) {
      :host {
        flex-direction: row;
      }
    }
  </style>
`;

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    const data = await Data.init(this.src);

    const grid = document.createElement("x-word-grid") as XWordGrid;
    grid.dimensions = data.ipuz.dimensions;
    grid.puzzle = data.ipuz.puzzle;

    const clues = document.createElement("x-word-clues") as XWordClues;
    clues.clues = data.clues;

    this.shadowRoot!.appendChild(grid);
    this.shadowRoot!.appendChild(clues);
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(val: string) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
