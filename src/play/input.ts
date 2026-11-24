export type InputEvent =
  | { type: 'check'; value: string }
  | { type: 'tap'; place: number; row: 'top' | 'carry' }
  | { type: 'help' }
  | { type: 'choice'; value: string };

export class Aborted extends Error {}

/** A tiny event queue so the column flow can be written as straight-line async code. */
export class Input {
  private queue: InputEvent[] = [];
  private waiting: { resolve: (e: InputEvent) => void; reject: (e: Error) => void } | null = null;
  private dead = false;

  push(e: InputEvent) {
    if (this.dead) return;
    if (this.waiting) {
      const w = this.waiting;
      this.waiting = null;
      w.resolve(e);
    } else this.queue.push(e);
  }

  next(): Promise<InputEvent> {
    if (this.dead) return Promise.reject(new Aborted());
    const e = this.queue.shift();
    if (e) return Promise.resolve(e);
    return new Promise((resolve, reject) => { this.waiting = { resolve, reject }; });
  }

  flush() { this.queue = []; }

  destroy() {
    this.dead = true;
    this.waiting?.reject(new Aborted());
    this.waiting = null;
  }

  get alive() { return !this.dead; }
}
