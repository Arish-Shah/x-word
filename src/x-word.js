import "./components/clues.js";

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const xWordClues = document.createElement("x-word-clues");

    this.shadowRoot.appendChild(xWordClues);
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(val) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
