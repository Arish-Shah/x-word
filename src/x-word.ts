import "./components/clues";
import "./components/grid";
import { data } from "./state/data";

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    await data.init(this.src);

    const grid = document.createElement("x-word-grid");
    const clues = document.createElement("x-word-clues");

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
