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

    h1 {
      font-size: 1.25rem;
      margin: 1rem 0;
    }

    @media (min-width: 740px) {
      :host {
        flex-direction: row;
      }
    }
  </style>

  <div class="container"></div>
  <div class="container"></div>
`;

class XWord extends HTMLElement {
  data!: Data;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    this.data = await Data.init(this.src);
    this.render();
  }

  render() {
    const containers = this.shadowRoot!.querySelectorAll(".container");

    const heading = document.createElement("h1");
    heading.textContent = this.data.ipuz.title || "crossword";

    const grid = document.createElement("x-word-grid") as XWordGrid;
    grid.dimensions = this.data.ipuz.dimensions;
    grid.puzzle = this.data.ipuz.puzzle;

    const clues = document.createElement("x-word-clues") as XWordClues;
    clues.clues = this.data.clues;

    containers[0].appendChild(heading);
    containers[0].appendChild(grid);
    containers[1].appendChild(clues);
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(val: string) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
