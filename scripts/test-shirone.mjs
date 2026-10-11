import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeMusicTracks, mergeMusicTracks, buildMetingUrl, fetchMetingTracks, safeMediaUrl } from '../src/utils/music-sources.ts';
import { decryptProtectedContent } from '../src/utils/password-protection.ts';
import { assignPostRoutes, cleanPostPath } from '../src/utils/post-routes.ts';
import { uiConfig } from '../src/ui-config.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const id = `shirone-test-${randomUUID()}`;
const files = [];
const extrasPath = path.join(root, 'src/data/site-extras.json');
const extras = readFileSync(extrasPath);
function fixture(relative, content) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(path.resolve(root) + path.sep));
  assert.equal(existsSync(file), false);
  mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, content); files.push(file); return file;
}
function build() {
  const result = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build', '--force'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) process.stderr.write(result.stdout + result.stderr);
  assert.equal(result.status, 0, 'Shirone fixture build must succeed');
}
const read = relative => readFileSync(path.join(root, 'dist', relative), 'utf8');
try {
  const routePost = (slug, data = {}) => ({id: `${slug}.md`,slug,data:{published:new Date('2026-10-11T05:06:07Z'),...data}});
  assert.equal(assignPostRoutes([routePost('one',{alias:'old'})])[0].data.routeUrl,'/posts/old/');
  assert.equal(assignPostRoutes([routePost('one',{alias:'old',permalink:'stories/one'})])[0].data.routeUrl,'/stories/one/');
  assert.throws(() => assignPostRoutes([routePost('one',{alias:'two'}),routePost('two')]));
  assert.throws(() => assignPostRoutes([routePost('one',{permalink:'admin/settings'})]));
  assert.throws(() => cleanPostPath('../private'));
  const template = {...uiConfig.permalink};
  try {
    uiConfig.permalink.enable = true; uiConfig.permalink.format = 'journal/%year%/%monthnum%/%day%/%post_id%-%postname%';
    assert.equal(assignPostRoutes([routePost('one')])[0].data.routeUrl,'/journal/2026/10/11/1-one/');
    uiConfig.permalink.format = '%unknown%'; assert.throws(() => assignPostRoutes([routePost('one')]));
  } finally { Object.assign(uiConfig.permalink,template); }
  const local = normalizeMusicTracks([{id:'',title:'One',source:'https://example.com/one.mp3'},{id:'',title:'Two',source:'https://example.com/two.mp3'}]);
  assert.equal(local.length, 2); assert.notEqual(local[0].id, local[1].id);
  assert.equal(safeMediaUrl('javascript:alert(1)'), undefined); assert.equal(safeMediaUrl('//example.com/file.mp3'), undefined);
  const remote = await fetchMetingTracks('https://example.com/api', async () => new Response(JSON.stringify([{id:1,name:'Remote',url:'https://example.com/remote.mp3'},{id:2,name:'Duplicate',url:local[0].source}])));
  assert.equal(mergeMusicTracks(local,remote).length, 3);
  await assert.rejects(() => fetchMetingTracks('https://example.com/api', async () => new Response('',{status:503})));
  assert.equal(buildMetingUrl({id:''}),undefined);
  assert.throws(() => buildMetingUrl({id:'1',api:'http://example.com/:id'}));
  assert.equal(new URL(buildMetingUrl({id:'a & b',server:'netease',api:'https://example.com/?id=:id&server=:server'})).searchParams.get('id'),'a & b');
  const markdown = `---\ntitle: ${id}\npublished: 2026-10-10\npinned: true\ntags: [功能测试]\ncategory: 测试\nalias: ${id}-alias\npermalink: stories/${id}\nseries: ${id}\nseriesOrder: 2\n---\n==高亮标记==\n\n::: collapse 折叠标题\n\n折叠正文。\n\n:::\n\n::: tabs\n\n@tab 第一项\n\n第一项正文。\n\n@tab 第二项\n\n第二项正文。\n\n:::\n\n\`\`\`mermaid\ngraph TD\n  A[开始] --> B[完成]\n\`\`\`\n`;
  fixture(`src/content/posts/${id}.md`, markdown);
  fixture(`src/content/posts/${id}-encrypted.md`, `---\ntitle: ${id}-protected\npublished: 2026-10-10\nencrypted: true\npassword: fixture-password\n---\nPRIVATE-CONTENT-${id}\n\n## PRIVATE-HEADING-${id}\n`);
  fixture(`src/content/posts/${id}-mdx.mdx`, `---\ntitle: ${id}-mdx\npublished: 2026-10-10\n---\nexport const greeting = "MDX works";\n\n<div>{greeting}</div>\n`);
  fixture(`src/content/series/${id}.md`, `---\ntitle: ${id}-series\ndefaultCategory: [系列分类]\n---\n系列总览。\n`);
  fixture(`src/content/posts/${id}-series-first.md`, `---\ntitle: ${id}-first\npublished: 2026-10-09\nseries: ${id}\nseriesOrder: 1\n---\nIntroduction.\n`);
  const data = JSON.parse(extras);
  for (const type of ['moments', 'albums', 'compass', 'timeline', 'devices', 'skills', 'games']) data[type].push({ id, title: `${id}-${type}`, category: '测试', date: '2026-10-10', description: '功能验证', url: 'https://example.com', level: 80, images: type === 'albums' ? [{ src: '/avatar.jpeg', alt: '测试照片' }] : [] });
  data.albums.push({id:`${id}-private`,title:'Private album',password:'private-album-password',images:[{src:`/avatar.jpeg?private=${id}`,title:`PRIVATE-PHOTO-${id}`}]});
  data.albums.push({id:`${id}-hidden`,title:`HIDDEN-ALBUM-${id}`,hidden:true,images:[]});
  data.moments.push({id:`${id}-draft`,title:`DRAFT-MOMENT-${id}`,draft:true});
  writeFileSync(extrasPath, JSON.stringify(data));
  build();
  const page = read(`posts/${id}/index.html`);
  assert.ok(read(`posts/${id}-alias/index.html`).includes(id));
  assert.ok(read(`stories/${id}/index.html`).includes('rel="canonical"'));
  assert.ok(read('index.html').includes(`/stories/${id}/`));
  assert.ok(JSON.parse(read('content-status.json')).content.posts.some(post=>post.url===`/stories/${id}/`));
  assert.ok(read('rss.xml').includes(`/stories/${id}/`));
  assert.ok(read('atom.xml').includes(`/stories/${id}/`));
  assert.ok(read(`series/${id}/index.html`).indexOf(`${id}-first`) < read(`series/${id}/index.html`).indexOf(`/stories/${id}/`));
  assert.equal(read('moments/index.html').includes(`DRAFT-MOMENT-${id}`),false);
  const album = read(`albums/${id}-private/index.html`);
  assert.ok(existsSync(path.join(root,'dist/albums',`${id}-hidden`,'index.html')));
  assert.equal(read('albums/index.html').includes(`HIDDEN-ALBUM-${id}`),false);
  assert.equal(album.includes(`PRIVATE-PHOTO-${id}`),false); assert.equal(album.includes('private-album-password'),false);
  assert.equal(album.includes(`?private=${id}`),false);
  assert.equal(read('albums/index.html').includes(`?private=${id}`),false);
  assert.match(page, /m3-marker/);
  assert.match(page, /折叠标题/);
  assert.ok(page.includes('data-option-group'), 'Tabs must render an interactive option group');
  assert.match(page, /data-mermaid/);
  assert.match(read(`posts/${id}-mdx/index.html`), /MDX works/);
  const protectedHtml = read(`posts/${id}-encrypted/index.html`);
  assert.match(protectedHtml, /data-payload/);
  assert.equal(protectedHtml.includes(`PRIVATE-CONTENT-${id}`), false);
  assert.equal(protectedHtml.includes(`PRIVATE-HEADING-${id}`), false);
  assert.equal(protectedHtml.includes('fixture-password'), false);
  const rawPayload = protectedHtml.match(/data-payload="([^"]+)"/)?.[1];
  assert.ok(rawPayload, 'Encrypted payload must be present');
  const payload = JSON.parse(rawPayload.replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&amp;', '&'));
  const decrypted = await decryptProtectedContent(payload, 'fixture-password', `post:${id}-encrypted`);
  assert.ok(decrypted.includes(`PRIVATE-CONTENT-${id}`));
  await assert.rejects(() => decryptProtectedContent(payload, 'wrong-password'));
  for (const feed of ['rss.xml', 'atom.xml', 'archive/index.html', 'index.html']) {
    const content = read(feed);
    assert.equal(content.includes(`PRIVATE-CONTENT-${id}`), false, feed);
    assert.equal(content.includes('fixture-password'), false, feed);
  }
  for (const type of ['moments', 'albums', 'compass', 'timeline', 'devices', 'skills', 'games']) assert.ok(read(`${type}/index.html`).includes(`${id}-${type}`), type);
  const config = readFileSync(path.join(root, 'public/admin/config.yml'), 'utf8');
  assert.match(config, /name: site_extras/);
  assert.match(config, /name: passwordHint/);
  writeFileSync(path.join(root, '.astro/shirone-fixture-report.json'), JSON.stringify({ id }));
  console.log('Shirone regression passed: MDX, Mermaid, highlights, collapse/tabs, encrypted output isolation, new modules and editor config');
} finally {
  writeFileSync(extrasPath, extras);
  for (const file of files) { assert.ok(file.startsWith(path.resolve(root) + path.sep)); if (existsSync(file)) unlinkSync(file); }
}
