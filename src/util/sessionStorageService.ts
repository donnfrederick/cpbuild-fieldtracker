export class SessionStorageService {
  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Failed to set sessionStorage item "${key}":`, error);
    }
  }

  getItem<T>(key: string): T | null {
    const value = sessionStorage.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse sessionStorage item "${key}":`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }
}
