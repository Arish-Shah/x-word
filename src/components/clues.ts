import type { FormattedClue } from "../types";
import { data } from "../state/data";
import { currentClueStore } from "../state/store";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    .selected {
      background: powderblue;
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
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const uls = this.shadowRoot!.querySelectorAll("ul");

    uls[0].append(...data.clues.Across.map(this.createClueItem));
    uls[1].append(...data.clues.Down.map(this.createClueItem));

    currentClueStore.subscribe((curr, prev) => {
      if (prev)
        this.shadowRoot!.querySelector(`[data-id="${prev}"]`)!
          .classList.remove("selected");

      this.shadowRoot!.querySelector(`[data-id="${curr}"]`)!
        .classList.add("selected");
    });

    currentClueStore.update(data.clues.Across[0].id);
  }

  createClueItem({ id, number, clue }: FormattedClue) {
    const li = document.createElement("li");
    li.dataset.id = id;
    li.innerHTML = `<span>${number}</span><span>${clue}</span>`;

    li.addEventListener("click", () => {
      currentClueStore.update(id);
    });

    return li;
  }
}

customElements.define("x-word-clues", XWordClues);
