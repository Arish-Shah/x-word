// src/x-word.ts
class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  async connectedCallback() {
    const response = await fetch(this.src);
    const json = await response.json();
    console.log(json);
  }
  get src() {
    return this.getAttribute("src");
  }
  set src(val) {
    this.setAttribute("src", val);
  }
}
customElements.define("x-word", XWord);
