import { XWordBoard } from "./components/board";
import { Data } from "./utils/data";

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get src() {
    return this.getAttribute("src")!;
  }

  async connectedCallback() {
    const data = new Data();
    await data.init(this.src);

    const board = document.createElement("x-word-board") as XWordBoard;
    this.shadowRoot!.appendChild(board);
  }

  set src(val: string) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
