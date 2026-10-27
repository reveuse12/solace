const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/profile-store.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
vm.runInNewContext(source, { exports: loaded.exports });
const { createProfileStore } = loaded.exports;
function storage() {
  const values = new Map();
  return {
    values,
    async getItemAsync(key) { return values.get(key) ?? null; },
    async setItemAsync(key, value) { values.set(key, value); },
  };
}

test('completion survives a new store instance, with the trimmed name', async () => {
  const disk = storage();
  assert.equal(await createProfileStore(disk).load('user_a'), null);
  await createProfileStore(disk).complete('user_a', '  Prayag  ');
  const reopened = await createProfileStore(disk).load('user_a');
  assert.equal(reopened.name, 'Prayag');
  assert.equal(reopened.onboardingComplete, true);
});
test('switching accounts never inherits someone else’s onboarding', async () => {
  const disk = storage(); const store = createProfileStore(disk);
  await store.complete('user_a', 'A');
  assert.equal(await store.load('user_b'), null);
  await store.complete('user_b', 'B');
  assert.equal((await store.load('user_a')).name, 'A');
  assert.equal((await store.load('user_b')).name, 'B');
});
test('read failures are errors, not first-run state', async () => {
  const store = createProfileStore({ async getItemAsync() { throw new Error('locked'); } });
  await assert.rejects(store.load('user_a'), /locked/);
});
test('failed persistence never reports completed onboarding', async () => {
  const disk = storage(); disk.setItemAsync = async () => { throw new Error('unavailable'); };
  await assert.rejects(createProfileStore(disk).complete('user_a', 'A'), /unavailable/);
  assert.equal(await createProfileStore(disk).load('user_a'), null);
});
test('invalid saved data is preserved and produces an error instead of resetting onboarding', async () => {
  for (const value of ['{', 'null', '{}', '{"version":1,"name":"","onboardingComplete":true}', '{"version":2,"name":"A","onboardingComplete":true}']) {
    const disk = storage();
    await createProfileStore(disk).complete('user_a', 'A');
    const key = [...disk.values.keys()][0]; disk.values.set(key, value);
    await assert.rejects(createProfileStore(disk).load('user_a'));
    assert.equal(disk.values.get(key), value);
  }
});
test('empty/oversized names cannot commit; keys use SecureStore-safe characters', async () => {
  const disk = storage(); const store = createProfileStore(disk);
  await assert.rejects(store.complete('user_a', '   '));
  await assert.rejects(store.complete('user_a', 'x'.repeat(81)));
  assert.equal(disk.values.size, 0);
  await store.complete('user/a🙂', 'A');
  assert.match([...disk.values.keys()][0], /^[A-Za-z0-9._-]+$/);
  assert.equal((await store.load('user/a🙂')).name, 'A');
});
