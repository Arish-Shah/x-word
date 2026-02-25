import { data } from "../state/data";
import { currentClueStore } from "../state/store";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
    }

    div {
      width: 300px;
    }
  </style>

  <button>prev</button>
  <div>
    <strong></strong>
    <span></span>
  </div>
  <button>next</button>
`;

class XWordNav extends HTMLElement {
  subscription: () => void;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const buttons = this.shadowRoot!.querySelectorAll("button");
    const strong = this.shadowRoot!.querySelector("strong");
    const span = this.shadowRoot!.querySelector("span");

    this.subscription = currentClueStore.subscribe((newVal) => {
      if (newVal) {
        strong!.textContent = newVal.split("-").join(" ");
        span!.textContent = data.clues[newVal].clue;
      }
    });

    buttons[0].addEventListener("click", _ => {
      if (currentClueStore.state)
        currentClueStore.update(data.getPrevClue(currentClueStore.state));
    });

    buttons[1].addEventListener("click", _ => {
      if (currentClueStore.state)
        currentClueStore.update(data.getNextClue(currentClueStore.state));
    });
  }

  disconnectedCallback() {
    this.subscription();
  }
}

customElements.define("x-word-nav", XWordNav);
