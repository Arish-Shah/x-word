import type { Ipuz } from "../types";
import { State } from "./state";

export class Data {
  private state: State;

  constructor(id: string, ipuz: Ipuz) {
    this.state = new State(id, ipuz.solution);
  }

  static async fetchIpuz(url: string) {
    const response = await fetch(url);
    const ipuz = await response.json();
    return new Data(url, ipuz);
  }
}
