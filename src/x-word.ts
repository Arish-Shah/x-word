import { Data } from "./core/data";

class XWord extends HTMLElement {
  private data: Data;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.data = new Data(this.src);
  }

  connectedCallback() {
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(val: string) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
