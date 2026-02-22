import { data } from "../data.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: grid;
      max-width: 300px;
      border: 1px solid black;
    }

    div {
      border: 2px solid black;
      margin-left: -1px;
      aspect-ratio: 1/1;

      &.highlight {
        background: yellow;
      }

      &.selected {
        background: red;
      }
    }
  </style>
`;

class XWordGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.host.style.gridTemplateColumns =
      `repeat(${data.dimensions.width}, 1fr)`;

    for (let r = 0; r < data.dimensions.height; r++) {
      for (let c = 0; c < data.dimensions.width; c++) {
        this.shadowRoot.appendChild(this.createCell([r, c]));
      }
    }
  }

  /** @param {[number, number]} param0  */
  createCell([r, c]) {
    const div = document.createElement("div");
    div.dataset.id = r + "," + c;
    return div;
  }
}

customElements.define("x-word-grid", XWordGrid);
