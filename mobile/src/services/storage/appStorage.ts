import { Platform } from 'react-native';

const PREFIX = 'meditalk:';

type NativeFs = {
  File: new (...uris: any[]) => {
    exists: boolean;
    uri: string;
    text(): Promise<string>;
    write(content: string): void;
    create(options?: { overwrite?: boolean; intermediates?: boolean }): void;
    delete(): void;
    copy(destination: any, options?: { overwrite?: boolean }): Promise<void>;
  };
  Paths: { document: any };
};

/** Lazy so web never pulls the native file-system module in. */
let nativeFs: NativeFs | null = null;
const getFs = (): NativeFs | null => {
  if (Platform.OS === 'web') return null;
  if (!nativeFs) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nativeFs = require('expo-file-system') as NativeFs;
    } catch (e) {
      console.warn('expo-file-system unavailable, storage disabled:', e);
      return null;
    }
  }
  return nativeFs;
};

const fileForKey = (fs: NativeFs, key: string) =>
  new fs.File(fs.Paths.document, `meditalk-${key}.json`);

/**
 * Minimal persistent key/value store used for settings that must survive an
 * app restart (language, voice, notification prefs, profile photo).
 */
export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(PREFIX + key);
      }
      const fs = getFs();
      if (!fs) return null;
      const file = fileForKey(fs, key);
      if (!file.exists) return null;
      return await file.text();
    } catch (e) {
      console.warn('appStorage.getItem failed:', e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PREFIX + key, value);
        return;
      }
      const fs = getFs();
      if (!fs) return;
      const file = fileForKey(fs, key);
      if (file.exists) {
        file.write(value);
      } else {
        file.create({ overwrite: true, intermediates: true });
        file.write(value);
      }
    } catch (e) {
      console.warn('appStorage.setItem failed:', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(PREFIX + key);
        return;
      }
      const fs = getFs();
      if (!fs) return;
      const file = fileForKey(fs, key);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('appStorage.removeItem failed:', e);
    }
  },

  async getObject<T>(key: string): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setObject(key: string, value: unknown): Promise<void> {
    try {
      await this.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('appStorage.setObject failed:', e);
    }
  },

  /**
   * Copies a picked image out of the temp cache into app storage so the URI
   * stays valid across restarts. Falls back to the original URI on failure.
   */
  async saveImageFile(sourceUri: string, fileName: string): Promise<string> {
    try {
      if (Platform.OS === 'web' || !sourceUri.startsWith('file:')) return sourceUri;
      const fs = getFs();
      if (!fs) return sourceUri;
      const source = new fs.File(sourceUri);
      const destination = new fs.File(fs.Paths.document, fileName);
      await source.copy(destination, { overwrite: true });
      return destination.uri;
    } catch (e) {
      console.warn('appStorage.saveImageFile failed:', e);
      return sourceUri;
    }
  },
};
