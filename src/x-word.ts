import { Data } from "./core/data";

const template = document.createElement("template");
template.innerHTML = ``;

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    const data = await Data.init(this.src);
  }

  get src() {
    return this.getAttribute("src")!;
  }

  set src(val: string) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
