import { IpuzDimensions, IpuzPuzzle } from "../core/types";

const template = document.createElement("template");
template.innerHTML = ``;

export class XWordGrid extends HTMLElement {
  dimensions!: IpuzDimensions;
  puzzle!: IpuzPuzzle;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.shadowRoot!.appendChild(svg);
  }
}

customElements.define("x-word-grid", XWordGrid);
