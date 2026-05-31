class State<T> {
  private data: T;

  constructor(initialData: T) {
    this.data = initialData;
  }

  update(data: T) {
    this.data = data;
  }
}

export const currentClue = new State<string>(null!);
