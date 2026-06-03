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
    this._value = newValue;
    this.subscribers.forEach(sub => sub(this._value));
  }

  subscribe(callback: Subscriber<T>) {
    this.subscribers.push(callback);

    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
}
