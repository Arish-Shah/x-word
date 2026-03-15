import { IpuzSolution } from "../types";

export class State {
  private current: string;
  private solution: string;

  constructor(id: string, data: IpuzSolution) {
    this.solution = data
      .map(row => row.map(cell => cell ?? "#").join(""))
      .join(",");
    this.current = localStorage.getItem(id) ?? this.solution.replace(/[A-Z]/g, "_");
  }

  setCell(index: string, value: string) {
  }
}
