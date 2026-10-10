import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const yamlRequire = createRequire(require.resolve("@rollup/plugin-yaml"));
const yaml = yamlRequire("js-yaml");
const importer = {};
vm.runInNewContext(readFileSync(new URL("../public/admin/import-markdown.js", import.meta.url), "utf8"), importer);
const parse = (value) => JSON.parse(JSON.stringify(importer.parseMarkdownImport(value, yaml.load)));
const taxonomy = {};
vm.runInNewContext(readFileSync(new URL("../public/admin/taxonomy.js", import.meta.url), "utf8"), taxonomy);

assert.deepEqual(parse("# 纯正文\n\n---\n继续"), { body: "# 纯正文\n\n---\n继续", metadata: {} });
assert.deepEqual(parse('\uFEFF---\r\ntitle: "包含:冒号"\r\ncategory: [学期, 课程]\r\n---\r\n# 正文\r\n\r\n---\r\n尾部'), {
  metadata: { title: "包含:冒号", category: ["学期", "课程"] }, body: "# 正文\n\n---\n尾部",
});
assert.throws(() => parse("---\ntitle: 缺少结束标记\n正文"), /结束标记/);
assert.throws(() => parse("---\n- 不是对象\n---\n正文"), /YAML 对象/);
assert.throws(() => parse("---\ntitle: [\n---\n正文"));
assert.equal(parse("---\n---\n").body, "");

const tagsModule = { exports: {} };
const tagsSource = ts.transpileModule(readFileSync(new URL("../src/utils/tags-utils.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
vm.runInNewContext(tagsSource, {
  exports: tagsModule.exports,
  require: createRequire(new URL("../src/utils/tags-utils.ts", import.meta.url)),
});
const normalize = (tags, rules) => Array.from(tagsModule.exports.normalizeTags(tags, rules));
assert.deepEqual(normalize(["A", " B ", "A", "C"], [{ from: "A", to: "B" }, { from: "C", to: "" }]), ["B"]);
assert.deepEqual(normalize(["A", "B"], [{ from: "A", to: "B" }, { from: "B", to: "C" }]), ["B", "C"]);
assert.deepEqual(normalize(["__proto__", "constructor"], []), ["__proto__", "constructor"]);
assert.deepEqual(normalize(["A"], [{ from: "A" }]), []);
assert.throws(() => normalize([], [{ from: " A ", to: "B" }, { from: "A", to: "C" }]), /重复/);

const config = yaml.load(readFileSync(new URL("../public/admin/config.yml", import.meta.url), "utf8"));
assert.equal(config.backend.repo, "lyosumic/My-Blog");
assert.equal(config.backend.branch, "main");
assert.equal(config.backend.name, "github");
assert.equal(config.backend.base_url, "https://localhost.invalid");
assert.equal(config.backend.auth_endpoint, "auth");
assert.equal(config.backend.auth_scope, "repo");
assert.equal(config.backend.site_domain, undefined);
assert.equal(config.local_backend, undefined);
const notes = config.collections.find((collection) => collection.name === "notes");
assert.equal(notes.nested.subfolders, false);
assert.equal(notes.fields.find((field) => field.name === "category").min, 1);
assert.equal(notes.fields.find((field) => field.name === "draft").default, false);
assert.equal(notes.fields.find((field) => field.name === "pdf").widget, "file");
assert.equal(notes.fields.find((field) => field.name === "pdf").required, true);
assert.equal(notes.fields.find((field) => field.name === "body"), undefined);
assert.equal(notes.editor.preview, false);
const pdfPattern = new RegExp(notes.fields.find((field) => field.name === "pdf").pattern[0]);
// Decap's file widget validates the basename, while preSave checks the full URL.
assert.equal(pdfPattern.test("lecture.pdf"), true);
assert.equal(pdfPattern.test("/uploads/notes/lecture.pdf"), true);
assert.equal(pdfPattern.test("https://example.com/lecture.PDF?download=1"), true);
assert.equal(pdfPattern.test("/uploads/notes/lecture.txt"), false);
for (const name of ["posts", "notes", "projects"]) {
  const collection = config.collections.find((item) => item.name === name);
  assert.equal(collection.create, true);
  assert.equal(collection.delete, true);
  assert.equal(collection.fields.find((field) => field.name === "draft").default, false);
}
const projects = config.collections.find((item) => item.name === "projects");
assert.equal(projects.fields.find((field) => field.name === "source").widget, "file");
const posts = config.collections.find((item) => item.name === "posts");
for (const fieldName of ["tags", "category"]) assert.equal(posts.fields.find((field) => field.name === fieldName).widget, "taxonomy");

// Exercise the real save hook with the immutable field API used by Decap.
class Fields {
  constructor(data) { this.data = data; }
  get(key) { return this.data[key]; }
  has(key) { return Object.hasOwn(this.data, key); }
  set(key, value) { return new Fields({ ...this.data, [key]: value }); }
  delete(key) { const data = { ...this.data }; delete data[key]; return new Fields(data); }
}
const events = {};
let initialized;
vm.runInNewContext(readFileSync(new URL("../public/admin/init.js", import.meta.url), "utf8"), {
  window: { CMS: { registerEventListener: ({ name, handler }) => { events[name] = handler; }, init(options) { initialized = options; } }, location: { origin: "https://blog.example.com", hostname: "blog.example.com" }, jsyaml: {}, parseMarkdownImport() {}, TaxonomyChoices: taxonomy.TaxonomyChoices },
  document: { getElementById: () => ({}), body: {} },
  MutationObserver: class { observe() {} disconnect() {} },
});
assert.equal(initialized.config.backend.base_url, "https://blog.example.com");
assert.equal(initialized.config.backend.site_domain, "blog.example.com");
assert.equal(initialized.config.backend.auth_endpoint, "auth");
const save = (data) => events.preSave({ entry: new Fields({ data: new Fields(data) }) }).data;
assert.equal(save({ pdf: "/uploads/notes/lecture.pdf", body: "", updated: "", draft: false }).pdf, "/uploads/notes/lecture.pdf");
assert.equal(Object.hasOwn(save({ pdf: "/uploads/notes/lecture.pdf", updated: "" }), "updated"), false);
assert.equal(save({ pdf: "/uploads/notes/lecture.pdf", draft: true }).draft, true);
assert.throws(() => save({ pdf: "", body: "# Legacy Markdown" }), /PDF/);
assert.throws(() => events.preSave({ entry: new Fields({ data: new Fields({ title: "Missing PDF" }) }), collection: new Fields({ name: "notes" }) }), /PDF/);
assert.equal(save({ pdf: "https://example.com/lecture.PDF?download=1" }).pdf, "https://example.com/lecture.PDF?download=1");
assert.throws(() => save({ pdf: "/uploads/notes/file.txt", body: "" }), /PDF/);
assert.throws(() => save({ pdf: "", body: "" }), /PDF/);
assert.throws(() => save({ source: "javascript:alert(1)" }), /附件/);
assert.throws(() => save({ source: "/uploads/../secret.zip" }), /附件/);
assert.equal(save({ source: "/uploads/projects/code.zip" }).source, "/uploads/projects/code.zip");
const migrated = save({ published: "2026-10-06", tags: ["旧标签", "Astro", "Astro"], category: "  旧分类  " });
assert.deepEqual(Array.from(migrated.tags), ["旧标签", "Astro"]);
assert.deepEqual(Array.from(migrated.category), ["旧分类"]);

// Run the actual custom widget's add/remove and pending-input validation methods.
const widgets = {};
const taxonomyEvents = {};
const stored = new Map();
const editor = {
  CMS: { registerWidget: (name, control, preview) => { widgets[name] = { control, preview }; }, registerEventListener: ({ name, handler }) => { taxonomyEvents[name] = handler; } },
  createClass: (definition) => definition, h: (tag, props, ...children) => ({ tag, props, children }),
  localStorage: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) },
  location: { href: "https://example.com/admin/#/collections/posts" }, URL,
  fetch: async () => ({ ok: true, json: async () => ({ tags: ["旧标签", "Astro"], categories: ["旧分类", "多分类"] }) }),
};
vm.runInNewContext(readFileSync(new URL("../public/admin/taxonomy.js", import.meta.url), "utf8"), editor);
await editor.TaxonomyChoices.load();
assert.ok(editor.TaxonomyChoices.options("tags").includes("旧标签"));
const control = { props: { value: ["旧标签"], field: new Fields({ kind: "tags" }), forID: "tags" }, setState(update) { Object.assign(this.state, update); } };
for (const [name, method] of Object.entries(widgets.taxonomy.control)) control[name] = method.bind(control);
control.state = control.getInitialState();
control.props.onChange = (value) => { control.props.value = value; };
control.state.query = "Astro，Python, Astro";
assert.ok(control.isValid().error);
control.addQuery();
assert.deepEqual(Array.from(control.props.value), ["旧标签", "Astro", "Python"]);
assert.equal(control.isValid(), true);
control.toggle("旧标签");
assert.deepEqual(Array.from(control.props.value), ["Astro", "Python"]);
taxonomyEvents.postSave({ entry: new Fields({ data: new Fields({ published: "2026-10-06", tags: control.props.value, category: ["新分类"] }) }) });
assert.ok(editor.TaxonomyChoices.options("tags").includes("Python"));
assert.ok(editor.TaxonomyChoices.options("categories").includes("新分类"));
assert.ok([...stored.values()].some((value) => value.includes("Python")));
for (const collection of config.collections) {
  for (const file of collection.files || []) readFileSync(new URL(`../${file.file}`, import.meta.url));
}
console.log("管理后台验证通过：多标签/多分类添加删除、历史选项、待确认输入校验、旧分类迁移，以及原有内容管理功能。");
