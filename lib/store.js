class Store {
  constructor() {
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      },
    };
  }

  update(newData) {
    this.data = { ...this.data, ...newData };
    this.subscribers.forEach(callback => callback(this.data));
  }
}

class PositionStore extends Store {
  data = {
    direction: "",
    cell: "",
  };
}

const positionStore = new PositionStore();
