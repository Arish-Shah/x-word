import type { ParsedClue, ParsedClues } from "../core/types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :host {
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    h3 {
      font-size: 1rem;
      padding: 0.25rem 0;
      border-top: 1px solid var(--x-word-button);
    }

    h3::after {
      content: "";
      display: block;
      height: 1px;
      opacity: 0.15;
      background: var(--x-word-fg);
      margin-top: 1rem;
    }

    ul {
      list-style-type: none;
    }

    li {
      cursor: pointer;
      padding: 0.5rem 0;
      display: flex;
      gap: 0.5rem;

      &.selected {
        background: var(--x-word-highlight);
      }
    }

    span:first-of-type {
      width: 1.5rem;
      flex-shrink: 0;
      text-align: right;
      font-weight: bold;
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
    if (id === "6A") li.className = "selected";
    return li;
  }
}

customElements.define("x-word-clues", XWordClues);
