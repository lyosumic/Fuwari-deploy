import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { handleOAuth } from "../server/github-oauth.js";
import worker from "../server/worker.js";

const origin = "https://blog.example.com";
const env = { ADMIN_ORIGIN: origin, GITHUB_CLIENT_ID: "test-client", GITHUB_CLIENT_SECRET: "test-secret" };
const request = (path, cookie) => new Request(`${origin}${path}`, { headers: cookie ? { Cookie: cookie } : {} });
let calls = [];
const token = 'test-token</script><script>alert("x")</script>';
const fetcher = async (url, options) => {
  calls.push({ url, options });
  if (url === "https://github.com/login/oauth/access_token") return Response.json({ access_token: token });
  assert.equal(url, "https://api.github.com/repos/lyosumic/My-Blog");
  assert.equal(options.headers.Authorization, `Bearer ${token}`);
  return Response.json({ permissions: { push: true } });
};
const noFetch = () => { throw new Error("不应该访问 GitHub"); };

assert.equal((await worker.fetch(request("/auth?provider=github"), {})).status, 503);
for (const ADMIN_ORIGIN of ["http://blog.example.com", `${origin}/admin/`, `${origin}?next=evil`, "https://name:password@blog.example.com"]) {
  assert.equal((await handleOAuth(request("/auth?provider=github"), { ...env, ADMIN_ORIGIN }, noFetch)).status, 503);
}
assert.equal((await handleOAuth(new Request("https://preview.example.com/auth?provider=github"), env, noFetch)).status, 403);
assert.equal((await handleOAuth(new Request(`${origin}/auth`, { method: "POST" }), env, noFetch)).status, 405);
assert.equal((await handleOAuth(request("/auth/unknown"), env, noFetch)).status, 404);
assert.equal((await handleOAuth(request("/auth?provider=gitlab"), env, noFetch)).status, 400);
assert.equal((await handleOAuth(request("/auth?provider=github"), { ...env, GITHUB_CLIENT_SECRET: "" }, noFetch)).status, 503);

const start = await worker.fetch(request("/auth?provider=github&scope=repo&redirect_uri=https://evil.example&site_id=evil.example"), env);
assert.equal(start.status, 302);
const target = new URL(start.headers.get("Location"));
assert.equal(target.origin, "https://github.com");
assert.equal(target.searchParams.get("redirect_uri"), `${origin}/auth/callback`);
assert.equal(target.searchParams.get("scope"), "public_repo");
assert.equal(target.searchParams.get("client_id"), env.GITHUB_CLIENT_ID);
const state = target.searchParams.get("state");
const cookie = start.headers.get("Set-Cookie").split(";")[0];
assert.match(start.headers.get("Set-Cookie"), /HttpOnly; Secure; SameSite=Lax/);
assert.match(start.headers.get("Set-Cookie"), /Max-Age=600/);
assert.equal(start.headers.get("Cache-Control"), "no-store");
const privateStart = await handleOAuth(request("/auth?provider=github"), { ...env, GITHUB_OAUTH_SCOPE: "repo" }, noFetch);
assert.equal(new URL(privateStart.headers.get("Location")).searchParams.get("scope"), "repo");

const callbackPath = `/auth/callback?state=${state}&code=test-code`;
assert.equal((await handleOAuth(request(callbackPath), env, noFetch)).status, 400);
assert.equal((await handleOAuth(request(`${callbackPath}bad`, "__Host-decap_oauth_state=wrong"), env, noFetch)).status, 400);
const expired = `${Date.now() - 700_000}.${"a".repeat(64)}`;
assert.equal((await handleOAuth(request(`/auth/callback?state=${expired}&code=test-code`, `__Host-decap_oauth_state=${expired}`), env, noFetch)).status, 400);
assert.equal((await handleOAuth(request(`/auth/callback?state=${state}&error=access_denied`, cookie), env, noFetch)).status, 400);
assert.equal((await handleOAuth(request(`/auth/callback?state=${state}`, cookie), env, noFetch)).status, 400);

const success = await handleOAuth(request(callbackPath, cookie), env, fetcher);
assert.equal(success.status, 200);
const configured = await handleOAuth(request(callbackPath, cookie), { ...env, GITHUB_REPOSITORY: "lyosumic/Fuwari-deploy" }, async (url) => {
  if (url === "https://github.com/login/oauth/access_token") return Response.json({ access_token: "configured-repository-token" });
  assert.equal(url, "https://api.github.com/repos/lyosumic/Fuwari-deploy");
  return Response.json({ permissions: { push: true } });
});
assert.equal(configured.status, 200, "部署后台和 OAuth 权限检查必须指向同一仓库");
assert.equal(calls.length, 2);
const exchange = calls[0].options.body;
assert.equal(exchange.get("code"), "test-code");
assert.equal(exchange.get("client_secret"), env.GITHUB_CLIENT_SECRET);
assert.equal(exchange.get("redirect_uri"), `${origin}/auth/callback`);
assert.match(success.headers.get("Set-Cookie"), /Max-Age=0/);
assert.equal(success.headers.get("Cache-Control"), "no-store");
assert.match(success.headers.get("Content-Security-Policy"), /default-src 'none'/);
const html = await success.text();
assert.equal(html.includes(env.GITHUB_CLIENT_SECRET), false);
assert.equal(html.includes(token), false, "嵌入的凭据必须转义 HTML");
const script = html.match(/<script nonce="([a-f0-9]+)">([\s\S]*?)<\/script>/);
assert.ok(script);
assert.ok(success.headers.get("Content-Security-Policy").includes(`nonce-${script[1]}`));

// Execute the actual popup script and verify the Decap handshake and origin/source checks.
const sent = [];
const listeners = new Map();
const opener = { postMessage: (data, targetOrigin) => sent.push({ data, targetOrigin }) };
const window = { opener, addEventListener: (name, handler) => listeners.set(name, handler), removeEventListener: (name) => listeners.delete(name) };
vm.runInNewContext(script[2], { window, document: { getElementById: () => ({}) } });
assert.deepEqual(sent, [{ data: "authorizing:github", targetOrigin: origin }]);
const receive = listeners.get("message");
for (const event of [
  { origin: "https://evil.example", source: opener, data: "authorizing:github" },
  { origin, source: {}, data: "authorizing:github" },
  { origin, source: opener, data: "incorrect-message" },
]) receive(event);
assert.equal(sent.length, 1);
receive({ origin, source: opener, data: "authorizing:github" });
assert.equal(sent[1].targetOrigin, origin);
assert.deepEqual(JSON.parse(sent[1].data.slice("authorization:github:success:".length)), { token, provider: "github" });
assert.equal(listeners.has("message"), false);

const denied = await handleOAuth(request(callbackPath, cookie), env, async (url) => url.includes("access_token") ? Response.json({ access_token: "denied-token" }) : Response.json({ permissions: { push: false } }));
assert.equal(denied.status, 403);
assert.equal((await denied.text()).includes("denied-token"), false);
const upstreamError = await handleOAuth(request(callbackPath, cookie), env, async () => Response.json({ error: "bad_verification_code", error_description: env.GITHUB_CLIENT_SECRET }));
assert.equal(upstreamError.status, 502);
assert.equal((await upstreamError.text()).includes(env.GITHUB_CLIENT_SECRET), false);
assert.equal((await handleOAuth(request(callbackPath, cookie), env, async () => { throw new Error(env.GITHUB_CLIENT_SECRET); })).status, 502);
assert.equal((await worker.fetch(request("/auth/callback"), env)).status, 400);
const wrangler = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url)));
assert.deepEqual(wrangler.assets.run_worker_first, ["/auth", "/auth/*"]);
assert.equal(wrangler.assets.binding, "ASSETS");
assert.equal(wrangler.vars.GITHUB_OAUTH_SCOPE, "repo", "私有博客仓库需要 repo 授权范围");
const assetRequest = request("/admin/");
const assetResponse = new Response("static-admin");
assert.equal(await worker.fetch(assetRequest, { ASSETS: { fetch: (value) => { assert.equal(value, assetRequest); return assetResponse; } } }), assetResponse);
console.log("OAuth 验证通过：正式域名限制、CSRF/过期状态、权限检查、密钥隔离、Decap 弹窗协议和错误处理。");
