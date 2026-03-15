// src/core/state.ts
class State {
  current;
  solution;
  constructor(id, data) {
    this.solution = data.map((row) => row.map((cell) => cell ?? "#").join("")).join(",");
    this.current = localStorage.getItem(id) ?? this.solution.replace(/[A-Z]/g, "_");
  }
  setCell(index, value) {}
}

// src/core/data.ts
class Data {
  state;
  constructor(id, ipuz) {
    this.state = new State(id, ipuz.solution);
  }
  static async fetchIpuz(url) {
    const response = await fetch(url);
    const ipuz = await response.json();
    return new Data(url, ipuz);
  }
}

// src/x-word.ts
class XWord extends HTMLElement {
  data;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  async connectedCallback() {
    this.data = await Data.fetchIpuz(this.src);
  }
  get src() {
    return this.getAttribute("src");
  }
  set src(value) {
    this.setAttribute("src", value);
  }
}
customElements.define("x-word", XWord);
