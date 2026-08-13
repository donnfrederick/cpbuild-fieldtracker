export function localStorageHelper<T>(key: string) {
  const set = (value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const get = (): T | null => {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  };

  const update = (updater: (currentValue: T | null) => T): void => {
    const current = get();
    const updated = updater(current);
    set(updated);
  };

  const clear = (): void => {
    localStorage.removeItem(key);
  };

  return { set, get, update, clear };
}
