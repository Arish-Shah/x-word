import type { FormattedClueValue } from "../types";
import { data } from "../state/data";
import { currentStore } from "../state/store";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    .highlight {
      background: yellow;
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
  subscription: () => void;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const uls = this.shadowRoot!.querySelectorAll("ul");
    const clues = data.cluesByDirection();

    uls[0].append(...clues.Across.map(this.createClueItem));
    uls[1].append(...clues.Down.map(this.createClueItem));

    this.subscription = currentStore.subscribe((newValue, oldValue) => {
      if (oldValue) {
        this.shadowRoot!.querySelector(`[data-id="${oldValue}"]`)!
          .classList.remove("highlight");
      }
      this.shadowRoot!.querySelector(`[data-id="${newValue}"]`)!
        .classList.add("highlight");
    });

    currentStore.update(clues.Across[0].id);
  }

  createClueItem({ id, number, clue }: FormattedClueValue) {
    const li = document.createElement("li");
    li.dataset.id = id;
    li.innerHTML = `<span>${number}</span><span>${clue}</span>`;

    li.addEventListener("click", () => {
      currentStore.update(id);
    });
    return li;
  }

  disconnectedCallback() {
    this.subscription();
  }
}

customElements.define("x-word-clues", XWordClues);
