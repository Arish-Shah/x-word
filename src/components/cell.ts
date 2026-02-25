import { data } from "../state/data";
import { currentCellStore, currentClueStore } from "../state/store";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    * { box-sizing: border-box; }

    :host {
      position: relative;
      background: white;
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

      &:focus {
        background: red;
      }
    }

  </style>
  <input type="text" />
`;

export class XWordCell extends HTMLElement {
  input: HTMLInputElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.input = this.shadowRoot!.querySelector("input")!;
    this.id = this.dataset.id!;

    this.input.addEventListener("click", () => {
      const currentDirection = currentClueStore.state?.split("-")[1]!;

      if (this.id === currentCellStore.state) {
        const nextDirection = currentDirection === "Across" ? "Down" : "Across";
        currentClueStore.update(data.cellToClue[this.id][nextDirection]);
      } else {
        currentClueStore.update(data.cellToClue[this.id][currentDirection!]);
      }
      currentCellStore.update(this.id);
    });

    currentClueStore.subscribe((newValue) => {
      if (data.clues[newValue!].cells.indexOf(this.id) >= 0) this.highlight();
      else this.unhighlight();
    });

    currentCellStore.subscribe((newValue) => {
      if (newValue === this.id) this.input.focus();
    });
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
    this.classList.add("highlight");
  }

  unhighlight() {
    if (this.classList.contains("highlight")) {
      this.classList.remove("highlight");
    }
  }

  focus() {
    this.input.focus();
  }
}

customElements.define("x-word-cell", XWordCell);
