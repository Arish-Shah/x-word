// @ts-check

/** @template T */
class Store {
  /** @param {T} initialState  */
  constructor(initialState) {
    this.state = initialState;
    this.listeners = [];
  }

  /** @param {T} newState  */
  update(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.notifyAll(newState, oldState);
    }
  }

  /**
   * @param {T} newState
   * @param {T} oldState
   */
  notifyAll(newState, oldState) {
    this.listeners.forEach(listener => listener(newState, oldState));
  }

  /**
   * @param {(newState: T, oldState: T) => void} listener
   * @returns {() => void} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      this.listeners.splice(index, 1);
    };
  }
}


/** @type {Store<string|null>} */
export const clueStore = new Store(null);
