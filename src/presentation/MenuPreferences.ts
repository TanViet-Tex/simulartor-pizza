type MotionSource = Pick<MediaQueryList, 'matches' | 'addEventListener' | 'removeEventListener'>;
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const MOTION_KEY = 'pizza.reduced-motion';
function browserStorage(): PreferenceStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}

/** A shared presentation preference. Sessions and gameplay remain independent. */
export class MenuPreferences {
  private override?: boolean;
  private readonly listeners = new Set<() => void>();
  constructor(private readonly systemMotion: MotionSource | undefined = typeof window === 'undefined'
    ? undefined : window.matchMedia('(prefers-reduced-motion: reduce)'), private readonly storage = browserStorage()) {
    try {
      const stored = storage?.getItem(MOTION_KEY);
      if (stored === 'true' || stored === 'false') this.override = stored === 'true';
    } catch { /* A blocked preference store must not interrupt gameplay. */ }
  }

  get reducedMotion(): boolean { return this.override ?? this.systemMotion?.matches ?? false; }

  setReducedMotion(value: boolean | undefined): void {
    const previous = this.reducedMotion;
    this.override = value;
    try {
      if (value === undefined) this.storage?.removeItem(MOTION_KEY);
      else this.storage?.setItem(MOTION_KEY, String(value));
    } catch { /* Keep the current-session preference when storage is unavailable. */ }
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
