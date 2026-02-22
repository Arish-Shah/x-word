import { data } from "./data.js";
import "./components/clues.js";
import "./components/grid.js";

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    await data.init(this.src);

    const xWordGrid = document.createElement("x-word-grid");
    const xWordClues = document.createElement("x-word-clues");

    this.shadowRoot.appendChild(xWordGrid);
    this.shadowRoot.appendChild(xWordClues);
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(val) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
