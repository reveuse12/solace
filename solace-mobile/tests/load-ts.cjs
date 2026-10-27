const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
module.exports = function createLoader(overrides = {}, env = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(file);
    if (overrides[absolute]) return overrides[absolute];
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const target = { exports: {} }; cache.set(absolute, target);
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(source, {
      exports: target.exports, module: target, Error, TypeError, RangeError, process: { env }, fetch: global.fetch, URL, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, console,
      require(name) {
        if (Object.hasOwn(overrides, name)) return overrides[name];
        if (!name.startsWith('.')) return require(name);
        const base = path.resolve(path.dirname(absolute), name);
        const found = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')].find((entry) => fs.existsSync(entry) && fs.statSync(entry).isFile());
        if (!found) throw new Error('Missing test module '+name);
        return load(found);
      },
    }, { filename: absolute });
    return target.exports;
  }
  return load;
};
