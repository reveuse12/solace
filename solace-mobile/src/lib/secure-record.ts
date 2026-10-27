export type SecureStorage = { getItemAsync: (key: string) => Promise<string | null>; setItemAsync: (key: string, value: string) => Promise<void>; deleteItemAsync: (key: string) => Promise<void> };
const pendingByKey = new Map<string, Promise<unknown>>();
export function createSecureRecord<T>(storage: SecureStorage, key: string, validate: (value: unknown) => T, maxChunks = 64) {
  function queue<R>(action: () => Promise<R>): Promise<R> {
    const task = (pendingByKey.get(key) || Promise.resolve()).catch(() => {}).then(action);
    pendingByKey.set(key, task);
    void task.finally(() => { if (pendingByKey.get(key) === task) pendingByKey.delete(key); }).catch(() => {});
    return task;
  }
  async function read(): Promise<T | null> {
      const slot = await storage.getItemAsync(`${key}.pointer`);
      if (slot === null) return null;
      if (slot !== "a" && slot !== "b") throw new Error("Your saved draft couldn't be read.");
      const count = Number(await storage.getItemAsync(`${key}.${slot}.count`));
      if (!Number.isInteger(count) || count < 1 || count > maxChunks) throw new Error("Your saved draft is incomplete.");
      const chunks = await Promise.all(Array.from({ length: count }, (_, i) => storage.getItemAsync(`${key}.${slot}.${i}`)));
      if (chunks.some(chunk => chunk === null)) throw new Error("Your saved draft is incomplete.");
      return validate(JSON.parse(chunks.join("")));
  }
  async function clear() {
    await storage.deleteItemAsync(`${key}.pointer`);
    await Promise.all(["a", "b"].flatMap(slot => [
      storage.deleteItemAsync(`${key}.${slot}.count`),
      ...Array.from({ length: maxChunks }, (_, i) => storage.deleteItemAsync(`${key}.${slot}.${i}`)),
    ]));
  }
  return {
    load: () => queue(read),
    save: (value: T) => queue(async () => {
      const points = Array.from(JSON.stringify(value));
      const chunks: string[] = [];
      for (let offset = 0; offset < points.length; offset += 400) chunks.push(points.slice(offset, offset + 400).join(""));
      if (!chunks.length || chunks.length > maxChunks) throw new Error("Your draft is too large to save on this phone.");
      const slot = await storage.getItemAsync(`${key}.pointer`) === "a" ? "b" : "a";
      for (let i = 0; i < chunks.length; i++) await storage.setItemAsync(`${key}.${slot}.${i}`, chunks[i]);
      await storage.setItemAsync(`${key}.${slot}.count`, String(chunks.length));
      await storage.setItemAsync(`${key}.pointer`, slot);
    }),
    clear: () => queue(clear),
    clearIf: (matches: (value: T) => boolean) => queue(async () => {
      const value = await read();
      if (!value || !matches(value)) return false;
      await clear(); return true;
    }),
  };
}
export const safeStorageId = (value: string) => Array.from(value, c => c.codePointAt(0)!.toString(16)).join("-");
