import { data } from "./data.js";

const template = document.createElement("template");
template.innerHTML = ``;

class XWord extends HTMLElement {
  static observedAttributes = ["src"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  async attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue !== newValue) {
      await data.init(newValue);
    }
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(val) {
    this.setAttribute("src", val);
  }
}

customElements.define("x-word", XWord);
