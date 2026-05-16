const template = document.createElement("template");
template.innerHTML = `<h1>hello from x-word!</h1>`;

class XWord extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }
}

customElements.define("x-word", XWord);
