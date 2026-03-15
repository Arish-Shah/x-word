import { Data } from "./core/data";

class XWord extends HTMLElement {
  private data: Data;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    this.data = await Data.fetchIpuz(this.src);
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }
}

customElements.define("x-word", XWord);
