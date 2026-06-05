import type { Subscriber } from "./types";

export class Signal<T> {
  private _value: T;
  private subscribers: Subscriber<T>[];

  constructor(initialValue: T) {
    this._value = initialValue;
    this.subscribers = [];
  }

  get value() {
    return this._value;
  }

  set value(newValue: T) {
    const previous = this._value;
    this._value = newValue;
    this.subscribers.forEach(sub => sub(this._value, previous));
  }

  subscribe(callback: Subscriber<T>) {
    this.subscribers.push(callback);

    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      },
    };
  }
}

export const currentClue = new Signal<string>(null!);
