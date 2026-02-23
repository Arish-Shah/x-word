const template = document.createElement("template");
template.innerHTML = ``;

class XWordGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
  }
}

customElements.define("x-word-grid", XWordGrid);
