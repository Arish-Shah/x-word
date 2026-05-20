import type { XWordClues } from "./components/clues";
import { Data } from "./core/data";
import "./components/clues";

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const data = await Data.init(this.src);

    const cluesEl = document.createElement("x-word-clues") as XWordClues;
    cluesEl.clues = data.clues;

    this.shadowRoot!.appendChild(cluesEl);
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(val: string) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
