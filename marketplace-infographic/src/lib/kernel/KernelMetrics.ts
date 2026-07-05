/** Metrics service — execution timing and counters. */
export class KernelMetrics {
  private readonly counters = new Map<string, number>();
  private readonly timings = new Map<string, number[]>();

  increment(name: string, delta = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + delta);
  }

  recordTiming(name: string, ms: number): void {
    const arr = this.timings.get(name) ?? [];
    arr.push(ms);
    this.timings.set(name, arr);
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  getAverageTiming(name: string): number {
    const arr = this.timings.get(name) ?? [];
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  snapshot(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      counters: Object.fromEntries(this.counters),
      avgTimings: Object.fromEntries(
        [...this.timings.keys()].map((k) => [k, this.getAverageTiming(k)]),
      ),
    });
  }

  flush(): Readonly<Record<string, unknown>> {
    const snap = this.snapshot();
    this.counters.clear();
    this.timings.clear();
    return snap;
  }
}
