import type { Ipuz } from "../types";

export class Data {
  private ipuz: Ipuz;

  async init(ipuzUrl: string) {
    this.ipuz = await this.fetchIpuz(ipuzUrl);
  }

  getDimensions() {
    return this.ipuz.dimensions;
  }

  async fetchIpuz(url: string) {
    const response = await fetch(url);
    return await response.json() as Promise<Ipuz>;
  }
}
