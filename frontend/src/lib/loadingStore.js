class LoadingStore {
  count = 0;
  listeners = new Set();

  inc() { this.count++; this.emit(); }
  dec() { this.count = Math.max(0, this.count - 1); this.emit(); }
  emit() { for (const l of this.listeners) l(this.count); }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  get isLoading() { return this.count > 0; }
}

export const loadingStore = new LoadingStore();