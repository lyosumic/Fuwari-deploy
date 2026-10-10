import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

export const VERSION = '0.1.0';
export const WRANGLER = '4.149.0';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, '.deploy.local.json');

export function validateConfig(config) {
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(config.workerName || '')) throw new Error('Worker 名称只能包含小写字母、数字和连字符，并以字母开头。');
  const url = new URL(config.siteUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('网站地址必须是 HTTPS 根地址，例如 https://blog.example.com/。');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository || '')) throw new Error('仓库格式必须为 owner/repo。');
  if (config.oauthClientId && !/^[A-Za-z0-9_-]+$/.test(config.oauthClientId)) throw new Error('OAuth Client ID 格式无效。');
  return { workerName: config.workerName, siteUrl: url.origin + '/', repository: config.repository, oauthClientId: config.oauthClientId || '' };
}

export function checkAssets(directory) {
  let count = 0;
  function visit(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else {
        if (statSync(file).size > 25 * 1024 * 1024) throw new Error(`静态附件超过 Cloudflare 25 MiB 限制：${file}`);
        count++;
      }
    }
  }
  visit(directory);
  if (!existsSync(join(directory, 'index.html'))) throw new Error('构建未生成 dist/index.html。');
  if (count > 20000) throw new Error('静态文件数超过免费计划的 20,000 个限制。');
  return count;
}

export function makeWorkerConfig(config) {
  return {
    name: config.workerName, main: '../server/worker.js', compatibility_date: '2026-10-07',
    workers_dev: true, keep_vars: true,
    vars: { ADMIN_ORIGIN: new URL(config.siteUrl).origin, GITHUB_CLIENT_ID: config.oauthClientId, GITHUB_OAUTH_SCOPE: 'repo', GITHUB_REPOSITORY: config.repository },
    assets: { directory: '../dist', binding: 'ASSETS', run_worker_first: ['/auth', '/auth/*'] },
  };
}

function run(command, args, env = {}, probe = false) {
  const result = spawnSync(command, args, { cwd: root, stdio: probe ? 'pipe' : 'inherit', env: { ...process.env, ...env }, shell: false });
  if (result.error) throw result.error;
  if (!probe && result.status !== 0) throw new Error(`命令执行失败 (${result.status})：${command}`);
  return result.status;
}

function npm(args, env = {}, probe = false) {
  if (process.platform !== 'win32') return run('npm', args, env, probe);
  const locations = [join(dirname(process.execPath), 'npm.cmd')];
  const found = spawnSync('where.exe', ['npm.cmd'], { encoding: 'utf8' });
  if (found.status === 0) locations.push(...found.stdout.trim().split(/\r?\n/));
  const cli = locations.map(p => join(dirname(p), 'node_modules', 'npm', 'bin', 'npm-cli.js')).find(existsSync);
  if (!cli) throw new Error('找不到 npm。请安装包含 npm 的 Node.js 22 LTS。');
  return run(process.execPath, [cli, ...args], env, probe);
}

async function configure() {
  if (!process.stdin.isTTY) throw new Error('首次运行需要交互终端；CI 请设置 DEPLOY_WORKER_NAME、SITE_URL、DEPLOY_REPOSITORY。');
  const previous = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  async function ask(label, fallback) { return (await rl.question(`${label} [${fallback}]: `)).trim() || fallback; }
  try {
    const config = validateConfig({
      workerName: await ask('新 Worker 名称（不要使用现有生产 Worker）', previous.workerName || 'fuwari-deploy'),
      siteUrl: await ask('网站完整 HTTPS 地址（首次可填 Worker 的 workers.dev 地址）', previous.siteUrl || ''),
      repository: await ask('后台写入的 GitHub 仓库', previous.repository || 'lyosumic/Fuwari-deploy'),
      oauthClientId: await ask('GitHub OAuth Client ID（仅部署静态页面可留空）', previous.oauthClientId || ''),
    });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    return config;
  } finally { rl.close(); }
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log(`Fuwari Deploy ${VERSION}\n双击 deploy.cmd，或 node tools/deploy.mjs\n--configure 重新配置；--check 仅检查；--dry-run 构建并打包但不上传；--non-interactive CI 模式。\n首次需要 Node.js 22+、网络和 Cloudflare 账号。密钥只交给 Wrangler 或平台。`);
    return;
  }
  for (const arg of args) if (!['--configure', '--check', '--dry-run', '--non-interactive'].includes(arg)) throw new Error(`未知参数：${arg}`);
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('请安装 Node.js 22 LTS 或更新版本。');
  let config;
  if (process.env.DEPLOY_WORKER_NAME || process.env.DEPLOY_REPOSITORY) {
    config = validateConfig({ workerName: process.env.DEPLOY_WORKER_NAME, siteUrl: process.env.SITE_URL, repository: process.env.DEPLOY_REPOSITORY, oauthClientId: process.env.GITHUB_CLIENT_ID });
  } else if (!args.includes('--configure') && existsSync(configPath)) {
    config = validateConfig(JSON.parse(readFileSync(configPath, 'utf8')));
  } else {
    if (args.includes('--non-interactive')) throw new Error('缺少 CI 部署变量。');
    config = await configure();
  }
  console.log(`Fuwari Deploy ${VERSION} → ${config.workerName}\n地址：${config.siteUrl}\n后台仓库：${config.repository}`);
  if (args.includes('--check')) return;
  if (args.includes('--non-interactive') && !args.includes('--dry-run') && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) throw new Error('CI 需要 CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID。');
  npm(['exec', '--yes', '--package=pnpm@9.14.4', '--', 'pnpm', 'install', '--frozen-lockfile']);
  npm(['exec', '--yes', '--package=pnpm@9.14.4', '--', 'pnpm', 'build'], { SITE_URL: config.siteUrl });
  console.log(`静态资源检查通过：${checkAssets(join(root, 'dist'))} 个文件。`);
  // Only update generated output; the author's CMS source stays unchanged.
  const cmsPath = join(root, 'dist', 'admin', 'config.yml');
  const cms = readFileSync(cmsPath, 'utf8');
  if (!/^  repo: .+$/m.test(cms)) throw new Error('未找到后台仓库设置。');
  writeFileSync(cmsPath, cms.replace(/^  repo: .+$/m, `  repo: ${config.repository}`));
  const state = join(root, '.deploy');
  mkdirSync(state, { recursive: true });
  const workerFile = join(state, 'wrangler.json');
  writeFileSync(workerFile, JSON.stringify(makeWorkerConfig(config), null, 2) + '\n');
  const wrangler = ['exec', '--yes', `--package=wrangler@${WRANGLER}`, '--', 'wrangler'];
  if (!args.includes('--dry-run') && !process.env.CLOUDFLARE_API_TOKEN) {
    // Reuse Wrangler's existing login; suppress account details from the probe.
    if (npm([...wrangler, 'whoami', '--json'], {}, true) !== 0) npm([...wrangler, 'login']);
  }
  npm([...wrangler, 'deploy', '--config', workerFile, ...(args.includes('--dry-run') ? ['--dry-run', '--outdir', join(state, 'dry-run')] : [])]);
  console.log(args.includes('--dry-run') ? '预演通过，未上传。' : `部署成功。打开 ${config.siteUrl} 检查网站。自定义域名需在 Cloudflare 绑定。`);
  if (config.oauthClientId) console.log('启用后台登录：为此 Worker 设置 GITHUB_CLIENT_SECRET，并将 OAuth 回调设为网站地址 + auth/callback。详见 README。');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`部署失败：${error.message}`); process.exitCode = 1; });
}
