import * as Types from "../types.js";
import { data } from "../data.js";
import { clueStore } from "../store.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    li {
      &.selected {
        background: #333333;
      }
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
  static observedAttributes = ["current"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const uls = this.shadowRoot.querySelectorAll("ul");

    uls[0].append(...Object.keys(data.clues.Across).map(id => {
      return this.createClueItem(id, data.clues.Across[id]);
    }));

    uls[1].append(...Object.keys(data.clues.Down).map(id => {
      return this.createClueItem(id, data.clues.Down[id]);
    }));

    clueStore.subscribe((newValue, oldValue) => {
      console.log(newValue, oldValue);
    });

    clueStore.update(Object.keys(data.clues.Across)[0]);
  }

  /**
   * @param {string} id
   * @param {Types.FormattedClue} clue
   */
  createClueItem(id, clue) {
    const li = document.createElement("li");
    li.dataset.id = id;
    li.innerHTML = `<span>${clue.number}</span><span>${clue.text}</span>`;

    li.addEventListener("click", () => {
      clueStore.update(id);
    });

    return li;
  }
}

customElements.define("x-word-clues", XWordClues);
