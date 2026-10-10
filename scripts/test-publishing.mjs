import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = `publishing-test-${randomUUID()}`;
const files = [];
const backups = new Map();
const read = (file) => readFileSync(path.join(root, "dist", file), "utf8");
function fixture(file, content) {
  const target = path.join(root, file);
  assert.equal(existsSync(target), false, `测试文件冲突：${target}`);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  files.push(target);
  return target;
}
function build() {
  const result = spawnSync(process.execPath, ["node_modules/astro/astro.js", "build", "--force"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) process.stderr.write(result.stdout + result.stderr);
  assert.equal(result.status, 0, "生产构建失败");
}
function entry(type, title, draft = false) {
  const extra = type === "notes" ? `category: [测试学期, 测试课程]\npdf: /uploads/${slug}.pdf\n`
    : type === "projects" ? `source: /uploads/${slug}.zip\ntechnologies: [Astro]\nrepository: https://github.com/example/project\n` : "";
  return `---\ntitle: ${JSON.stringify(title)}\npublished: 2026-10-06\ndraft: ${draft}\n${type === "posts" ? 'category: "  __proto__  "\nimage: ./missing-test-cover.png\n' : ""}${extra}---\n${type === "notes" ? "" : "测试正文。\n\n```js\nconsole.log('source');\n```\n"}`;
}
const pages = { posts: `posts/${slug}/index.html`, notes: `notes/${slug}/index.html`, projects: `projects/${slug}/index.html` };
const entries = {};
try {
  // A valid one-page PDF for the PDF-only note scenario.
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Length 42 >>\nstream\nBT /F1 14 Tf 30 100 Td (PDF note test) Tj ET\nendstream"];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fixture(`public/uploads/${slug}.pdf`, pdf);
  fixture(`public/uploads/${slug}.zip`, Buffer.from("504b0506000000000000000000000000000000000000", "hex"));
  for (const type of Object.keys(pages)) {
    entries[type] = fixture(`src/content/${type}/${slug}.md`, entry(type, `${slug}-${type}`));
    fixture(`src/content/${type}/${slug}-draft.md`, entry(type, `${slug}-hidden-${type}`, true));
  }
  writeFileSync(entries.posts, entry("posts", `${slug}-posts </script>`));
  for (const type of ["notes", "projects"]) {
    const draftPath = path.join(root, `src/content/${type}/${slug}-draft.md`);
    writeFileSync(draftPath, readFileSync(draftPath, "utf8").replace(`/uploads/${slug}.`, `/uploads/absent-${slug}.`));
  }
  build();
  const snapshot = JSON.parse(read("content-status.json"));
  for (const [type, page] of Object.entries(pages)) {
    assert.match(read(page), new RegExp(`${slug}-${type}`));
    assert.equal(existsSync(path.join(root, "dist", type, `${slug}-draft`, "index.html")), false);
    assert.ok(snapshot.content[type].some((item) => item.title.startsWith(`${slug}-${type}`)));
    assert.equal(snapshot.content[type].some((item) => item.title.includes(`${slug}-hidden`)), false);
  }
  assert.match(read("index.html"), new RegExp(`${slug}-posts`));
  assert.match(read("archive/index.html"), new RegExp(`${slug}-posts`));
  assert.match(read("rss.xml"), new RegExp(`${slug}-posts`));
  assert.doesNotMatch(read("rss.xml"), new RegExp(`${slug}-hidden`));
  assert.match(read(pages.notes), new RegExp(`/uploads/${slug}\\.pdf`));
  assert.match(read(pages.notes), /<iframe/);
  assert.match(read(pages.projects), new RegExp(`/uploads/${slug}\\.zip`));
  const jsonLd = read(pages.posts).match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(jsonLd, "文章结构化数据应存在");
  assert.equal(JSON.parse(jsonLd[1]).headline, `${slug}-posts </script>`);
  assert.match(read("index.html"), /图片暂不可用/);
  assert.match(read("archive/index.html"), /__proto__/);
  assert.doesNotMatch(read("archive/index.html"), /  __proto__  /);
  assert.ok(existsSync(path.join(root, "dist/uploads", `${slug}.pdf`)));
  assert.ok(existsSync(path.join(root, "dist/uploads", `${slug}.zip`)));
  for (const type of Object.keys(pages)) writeFileSync(entries[type], entry(type, `${slug}-updated-${type}`));
  build();
  for (const [type, page] of Object.entries(pages)) assert.match(read(page), new RegExp(`${slug}-updated-${type}`));

  // Keep byte-for-byte backups while exercising an entirely empty public blog.
  function hidePosts(directory) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) hidePosts(file);
      else if (item.name.endsWith(".md")) {
        const source = readFileSync(file, "utf8");
        const frontmatter = source.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
        if (!frontmatter) continue;
        backups.set(file, source);
        const metadata = /^draft:/m.test(frontmatter[2]) ? frontmatter[2].replace(/^draft:.*$/m, "draft: true") : `${frontmatter[2]}\ndraft: true`;
        writeFileSync(file, source.replace(frontmatter[0], `${frontmatter[1]}${metadata}${frontmatter[3]}`));
      }
    }
  }
  hidePosts(path.join(root, "src/content/posts"));
  build();
  assert.match(read("index.html"), /还没有公开的文章/);
  assert.equal(JSON.parse(read("content-status.json")).content.posts.length, 0);
} finally {
  for (const [file, original] of backups) writeFileSync(file, original);
  // Remove only files created by this run, including after failed assertions.
  for (const file of files) if (existsSync(file)) unlinkSync(file);
  build();
}
for (const page of Object.values(pages)) assert.equal(existsSync(path.join(root, "dist", page)), false);
const cleaned = JSON.parse(read("content-status.json"));
for (const items of Object.values(cleaned.content)) assert.equal(items.some((item) => item.title.includes(slug)), false);
console.log("发布回归验证通过：博客、PDF-only 笔记和项目的新增/修改/删除，正式环境隐藏草稿，RSS/归档与附件输出。测试内容已清理。");
