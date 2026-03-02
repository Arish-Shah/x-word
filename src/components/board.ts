export class XWordBoard extends HTMLElement {
  static observedAttributes = ["cell", "direction", "state"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get cell() {
    return this.getAttribute("cell")!;
  }

  set cell(val: string) {
    this.setAttribute("cell", val);
  }

  get direction() {
    return this.getAttribute("direction")!;
  }

  set direction(val: string) {
    this.setAttribute("direction", val);
  }

  get state() {
    return this.getAttribute("state")!;
  }

  set state(val: string) {
    this.setAttribute("state", val);
  }
}

customElements.define("x-word-board", XWordBoard);
