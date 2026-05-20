import type { ParsedClues } from "../core/types";

const template = document.createElement("template");
template.innerHTML = `
`;

export class XWordClues extends HTMLElement {
  clues!: ParsedClues;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    console.log(this.clues);
  }
}

customElements.define("x-word-clues", XWordClues);
