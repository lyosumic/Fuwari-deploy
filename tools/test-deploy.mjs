import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateConfig, makeWorkerConfig, checkAssets } from './deploy.mjs';
const config = validateConfig({ workerName: 'fuwari-deploy', siteUrl: 'https://blog.example.com', repository: 'owner/blog' });
assert.equal(config.siteUrl, 'https://blog.example.com/');
for (const siteUrl of ['http://example.com', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com/?token=x']) assert.throws(() => validateConfig({ ...config, siteUrl }));
for (const workerName of ['../my-blog', 'my blog', 'x;echo injected', '-invalid']) assert.throws(() => validateConfig({ ...config, workerName }));
assert.throws(() => validateConfig({ ...config, repository: 'owner/blog\nmalicious' }));
const worker = makeWorkerConfig(config);
assert.equal(worker.vars.GITHUB_REPOSITORY, 'owner/blog');
assert.equal(worker.vars.ADMIN_ORIGIN, 'https://blog.example.com');
assert.equal(worker.assets.directory, '../dist');
assert.equal(JSON.stringify(worker).includes('SECRET'), false);
const temp = mkdtempSync(join(tmpdir(), 'fuwari-deploy-test-'));
assert.ok(temp.startsWith(join(tmpdir(), 'fuwari-deploy-test-')), 'Test cleanup must stay inside its own temporary directory');
try {
  assert.throws(() => checkAssets(temp), /index.html/);
  writeFileSync(join(temp, 'index.html'), '<html>ok</html>');
  assert.equal(checkAssets(temp), 1);
  writeFileSync(join(temp, 'oversized.pdf'), Buffer.alloc(25 * 1024 * 1024 + 1));
  assert.throws(() => checkAssets(temp), /25 MiB/);
} finally { rmSync(temp, { recursive: true, force: true }); }
const fail = spawnSync(process.execPath, ['tools/deploy.mjs', '--non-interactive', '--check'], { encoding: 'utf8', env: { ...process.env, DEPLOY_WORKER_NAME: 'invalid name', DEPLOY_REPOSITORY: 'owner/blog', SITE_URL: 'https://example.com' } });
assert.equal(fail.status, 1);
assert.match(fail.stderr, /部署失败/);
console.log('Deployment tests passed: validation, asset limits, secret exclusion and failure exit.');
