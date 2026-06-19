/**
 * Strict finite state machine driving the cinematic flow.
 * Each state is { enter(ctx), exit(ctx) } — async-friendly.
 * Transitions are serialized: a new transition waits for the current to settle.
 */
export class StateMachine {
  constructor(states, { onChange } = {}) {
    this.states = states;
    this.current = null;
    this.currentName = null;
    this.history = [];
    this.onChange = onChange;
    this._busy = false;
    this._queue = [];
  }

  async go(name, payload = {}) {
    if (!this.states[name]) throw new Error(`[FSM] estado desconocido: ${name}`);
    if (this._busy) {
      // serialize: keep only the latest queued request
      this._queue = [{ name, payload }];
      return;
    }
    this._busy = true;

    try {
      const prev = this.current;
      const prevName = this.currentName;
      if (prev?.exit) await this._settle(prev.exit({ to: name, payload }));

      if (prevName) this.history.push(prevName);
      this.current = this.states[name];
      this.currentName = name;
      this.onChange?.(name, prevName);

      if (this.current.enter) await this._settle(this.current.enter({ from: prevName, payload }));
    } catch (err) {
      console.error(`[FSM] transición a "${name}" falló:`, err);
    } finally {
      // always release the lock so a failed/lost transition can't deadlock the flow
      this._busy = false;
    }

    if (this._queue.length) {
      const next = this._queue.shift();
      this.go(next.name, next.payload);
    }
  }

  /**
   * Await a transition's enter/exit, but never block longer than MAX_SETTLE.
   * Enter/exit usually resolve a GSAP tween; if rAF is paused (e.g. a hidden
   * tab freezes the ticker) that tween never completes — the timeout guarantees
   * the flow keeps moving and self-heals when animations resume.
   */
  _settle(maybePromise) {
    if (!maybePromise || typeof maybePromise.then !== 'function') return Promise.resolve();
    let t;
    const guard = new Promise((r) => { t = setTimeout(r, 1200); });
    return Promise.race([Promise.resolve(maybePromise).catch(() => {}), guard])
      .finally(() => clearTimeout(t));
  }

  /** Go back to the previous state (used by "Volver al index"). */
  back() {
    const prev = this.history.pop();
    if (prev) this.go(prev);
  }

  is(name) { return this.currentName === name; }
}
