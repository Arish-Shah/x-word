const template = document.createElement("template");
template.innerHTML = `
  <style>
    li {
      &.selected {
        background: #333333;
      }
    }
  </style>
  <div>
    <strong>across</strong>
    <ul></ul>
  </div>
  <div>
    <strong>down</strong>
    <ul></ul>
  </div>
`;

class XWordClues extends HTMLElement {
  static observedAttributes = ["current"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const uls = this.shadowRoot.querySelectorAll("ul");
  }
}

customElements.define("x-word-clues", XWordClues);
