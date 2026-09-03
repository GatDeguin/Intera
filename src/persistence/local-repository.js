const DEFAULT_KEY = 'intera.demo.state.v1';

export function createMemoryRepository(initialState) {
  let state = structuredClone(initialState);
  return {
    load() { return structuredClone(state); },
    save(next) { state = structuredClone(next); },
    reset(next) { state = structuredClone(next); return structuredClone(state); },
  };
}

export function createLocalRepository({ storage, seedFactory, key = DEFAULT_KEY }) {
  if (!storage) throw new Error('storage requerido');
  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) {
        const seed = seedFactory();
        storage.setItem(key, JSON.stringify(seed));
        return structuredClone(seed);
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion !== 1) throw new Error('schema mismatch');
        return parsed;
      } catch {
        const seed = seedFactory();
        storage.setItem(key, JSON.stringify(seed));
        return structuredClone(seed);
      }
    },
    save(next) { storage.setItem(key, JSON.stringify(next)); },
    reset(next = seedFactory()) { storage.setItem(key, JSON.stringify(next)); return structuredClone(next); },
  };
}
