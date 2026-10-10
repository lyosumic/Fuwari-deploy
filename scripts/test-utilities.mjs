import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { GithubCardComponent } from "../src/plugins/rehype-component-github-card.mjs";

const require = createRequire(import.meta.url);
const yaml = createRequire(require.resolve("@rollup/plugin-yaml"))("js-yaml");
function loadUtility(file, base = "/") {
  const source = readFileSync(new URL(`../src/utils/${file}`, import.meta.url), "utf8").replaceAll("import.meta.env.BASE_URL", JSON.stringify(base));
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports: module.exports, URL });
  return module.exports;
}
const { getBingTarget } = loadUtility("search-utils.ts");
assert.equal(getBingTarget("github.com/lyosumic"), "https://github.com/lyosumic");
assert.equal(getBingTarget("你好 world"), "https://www.bing.com/search?q=%E4%BD%A0%E5%A5%BD%20world");
assert.match(getBingTarget("javascript:alert(1)"), /^https:\/\/www.bing.com\/search/);
assert.match(getBingTarget("test@example.com"), /^https:\/\/www.bing.com\/search/);
const { isSafeContentUrl, attachmentUrl } = loadUtility("file-utils.ts", "/blog/");
assert.equal(isSafeContentUrl("/uploads/notes/课程笔记.pdf"), true);
for (const unsafe of ["javascript:alert(1)", "//example.com/test.pdf", "/uploads/../private.pdf", "/uploads/%2e%2e/private.pdf"]) assert.equal(isSafeContentUrl(unsafe), false);
assert.equal(attachmentUrl("/uploads/notes/file.pdf"), "/blog/uploads/notes/file.pdf");
assert.equal(attachmentUrl("https://example.com/file.pdf"), "https://example.com/file.pdf");
assert.equal(GithubCardComponent({ repo: "lyosumic/My-Blog" }, []).tagName, "a");
assert.equal(GithubCardComponent({ repo: "owner/repo');alert(1)//" }, []).tagName, "div");

const testRoot = mkdtempSync(path.join(tmpdir(), "osu-utilities-"));
try {
  const script = fileURLToPath(new URL("./new-post.js", import.meta.url));
  const run = (filename) => spawnSync(process.execPath, [script, filename], { cwd: testRoot, encoding: "utf8" });
  assert.equal(run("#draft").status, 0);
  const content = readFileSync(path.join(testRoot, "src/content/posts/#draft.md"), "utf8");
  assert.equal(yaml.load(content.split("---")[1]).title, "#draft");
  assert.notEqual(run("#draft").status, 0);
  assert.notEqual(run("../../escaped.md").status, 0);
  assert.equal(existsSync(path.join(testRoot, "src/escaped.md")), false);
  assert.notEqual(run(path.join(testRoot, "outside.md")).status, 0);
  assert.notEqual(run("unsupported.mdx").status, 0);
  assert.equal(run("nested/safe").status, 0);
} finally {
  // The only recursive deletion is our uniquely named test directory directly under tmpdir.
  assert.equal(path.dirname(path.resolve(testRoot)), path.resolve(tmpdir()));
  assert.ok(path.basename(testRoot).startsWith("osu-utilities-"));
  rmSync(testRoot, { recursive: true, force: true });
}
console.log("工具回归验证通过：搜索地址、附件 URL、GitHub 卡片输入，以及 Markdown 生成器的 YAML、覆盖保护和路径限制。");
