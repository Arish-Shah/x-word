import type { Ipuz } from "../types";

export class Data {
  constructor(src: string) {
    console.log(src);
    this.fetchIpuz(src).then(data => console.log(data));
  }

  async fetchIpuz(url: string): Promise<Ipuz> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ipuz: ${response.statusText}`);
    }
    return response.json() as Promise<Ipuz>;
  }
}
