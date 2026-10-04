type MotionSource = Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>;

/** A shared presentation preference. Sessions and gameplay remain independent. */
export class MenuPreferences {
  private override?: boolean;
  private readonly listeners = new Set<() => void>();
  constructor(private readonly systemMotion: MotionSource | undefined = typeof window === 'undefined'
    ? undefined : window.matchMedia('(prefers-reduced-motion: reduce)')) {}

  get reducedMotion(): boolean { return this.override ?? this.systemMotion?.matches ?? false; }

  setReducedMotion(value: boolean | undefined): void {
    const previous = this.reducedMotion;
    this.override = value;
    if (previous !== this.reducedMotion) this.notify();
  }

  subscribe(listener: () => void): () => void {
    if (!this.listeners.size) this.systemMotion?.addEventListener('change', this.systemChanged);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.systemMotion?.removeEventListener('change', this.systemChanged);
    };
  }

  destroy(): void {
    this.systemMotion?.removeEventListener('change', this.systemChanged);
    this.listeners.clear();
  }

  private systemChanged = (): void => { if (this.override === undefined) this.notify(); };
  private notify(): void { for (const listener of this.listeners) listener(); }
}
