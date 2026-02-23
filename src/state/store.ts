class Store<T> {
  state: T;
  listeners: ((newState: T, oldState: T) => void)[];

  constructor(initialState: T) {
    this.state = initialState;
    this.listeners = [];
  }

  update(newState: T) {
    const oldState = this.state;
    if (newState !== oldState) {
      this.state = newState;
      this.notifyAll(newState, oldState);
    }
  }

  notifyAll(newState: T, oldState: T) {
    this.listeners.forEach(listener => listener(newState, oldState));
  }

  subscribe(listener: (newState: T, oldState: T) => void) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      this.listeners.splice(index, 1);
    };
  }
}

export const currentClueStore = new Store<string | null>(null);
