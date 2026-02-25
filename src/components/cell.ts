const template = document.createElement("template");
template.innerHTML = `
  <style>
    * { box-sizing: border-box; }

    :host {
      position: relative;
    }

    :host(.highlight) {
      background: yellow;
    }

    :host([blocked]) {
      background: black;
    }

    :host([label])::before {
      content: attr(label);
      position: absolute;
      top: 2px;
      left: 2px;
    }

    input {
      width: 100%;
      aspect-ratio: 1 / 1;
      text-align: center;
      outline: 0;
      border: 1px solid black;
      background: transparent;
    }

  </style>
  <input type="text" />
`;

class XWordCell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  get blocked() {
    return this.hasAttribute("blocked");
  }

  set blocked(val) {
    if (val) {
      this.setAttribute("blocked", "");
    } else this.removeAttribute("blocked");
  }

  get label() {
    return this.getAttribute("label")!;
  }

  set label(val: string) {
    this.setAttribute("label", val);
  }

  highlight() {
    this.classList.toggle("highlight");
  }
}

customElements.define("x-word-cell", XWordCell);
