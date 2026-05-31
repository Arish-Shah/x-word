import type { ParsedClue, ParsedClues } from "../core/types";
import { currentClue } from "../core/state";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    ul {
      list-style-type: none;
    }
  </style>
  <div>
    <h3>across</h3>
    <ul></ul>
  </div>
  <div>
    <h3>down</h3>
    <ul></ul>
  </div>
`;

export class XWordClues extends HTMLElement {
  clues!: ParsedClues;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const uls = this.shadowRoot!.querySelectorAll("ul");
    uls[0].append(...Object.entries(this.clues.Across).map(this.createClue));
    uls[1].append(...Object.entries(this.clues.Down).map(this.createClue));
  }

  createClue([id, clue]: [string, ParsedClue]) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${clue.number}</span><span>${clue.clue}</span>
    `;
    li.addEventListener("click", _ => currentClue.update(id));
    return li;
  }
}

customElements.define("x-word-clues", XWordClues);
