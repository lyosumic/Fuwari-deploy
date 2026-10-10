// GitHub OAuth for the Decap popup protocol. Tokens never enter the Git repository.
const COOKIE = "__Host-decap_oauth_state";
const REPO = "lyosumic/My-Blog";
const COOKIE_OPTIONS = "Path=/; HttpOnly; Secure; SameSite=Lax";
const securityHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function randomHex() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function popup(origin, result, data, status = 200) {
  const nonce = randomHex();
  // JSON is embedded in HTML, so escape markup delimiters and line separators.
  const serialize = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const message = `authorization:github:${result}:${JSON.stringify(data)}`;
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>GitHub 登录</title>
<p id="status">正在返回管理后台…如果窗口没有自动关闭，请关闭窗口后重新登录。</p>
<script nonce="${nonce}">
const origin = ${serialize(origin)};
const message = ${serialize(message)};
const opener = window.opener;
if (opener) {
  const receive = (event) => {
    if (event.origin !== origin || event.source !== opener || event.data !== "authorizing:github") return;
    window.removeEventListener("message", receive);
    opener.postMessage(message, origin);
  };
  window.addEventListener("message", receive);
  opener.postMessage("authorizing:github", origin);
} else {
  document.getElementById("status").textContent = "请从网站的 /admin/ 页面发起 GitHub 登录。";
}
</script></html>`;
  return new Response(html, {
    status,
    headers: {
      ...securityHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      "Set-Cookie": `${COOKIE}=; Max-Age=0; ${COOKIE_OPTIONS}`,
    },
  });
}

function failure(message, status) {
  return new Response(message, { status, headers: { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8" } });
}

export async function handleOAuth(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (!["/auth", "/auth/", "/auth/callback", "/auth/callback/"].includes(url.pathname)) return failure("认证地址不存在。", 404);
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: { ...securityHeaders, Allow: "GET" } });
  let origin;
  try {
    const configured = new URL(env.ADMIN_ORIGIN);
    if (configured.protocol !== "https:" || configured.username || configured.password || configured.pathname !== "/" || configured.search || configured.hash) throw new Error("origin");
    origin = configured.origin;
  } catch {
    return failure("登录服务尚未配置。请在 Cloudflare 设置 ADMIN_ORIGIN 为后台所在网站的 HTTPS 地址。", 503);
  }
  // Preview deployments and other hostnames cannot receive production login tokens.
  if (url.origin !== origin) return failure("请在配置的正式网站域名下打开 /admin/ 登录。", 403);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return popup(origin, "error", { message: "登录服务尚未配置 GitHub OAuth 凭据，请在 Cloudflare 设置 Client ID 和 Client Secret。" }, 503);
  const scope = env.GITHUB_OAUTH_SCOPE || "public_repo";
  if (!["public_repo", "repo"].includes(scope)) return popup(origin, "error", { message: "GITHUB_OAUTH_SCOPE 必须为 public_repo 或 repo。" }, 503);
  const callback = `${origin}/auth/callback`;
  if (url.pathname === "/auth" || url.pathname === "/auth/") {
    if (url.searchParams.get("provider") !== "github") return popup(origin, "error", { message: "只支持 GitHub 登录。" }, 400);
    // Ignore caller-supplied scope, redirect_uri and site_id; trust server configuration only.
    const state = `${Date.now()}.${randomHex()}`;
    const target = new URL("https://github.com/login/oauth/authorize");
    target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, scope, state }).toString();
    return new Response(null, {
      status: 302,
      headers: { ...securityHeaders, Location: target.href, "Set-Cookie": `${COOKIE}=${state}; Max-Age=600; ${COOKIE_OPTIONS}` },
    });
  }
  const state = url.searchParams.get("state") || "";
  const cookie = (request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const issuedAt = Number(state.split(".")[0]);
  if (!/^\d{13}\.[a-f0-9]{64}$/.test(state) || state !== cookie || Date.now() - issuedAt > 600_000 || issuedAt > Date.now()) return popup(origin, "error", { message: "登录校验失败或已过期，请重新登录。" }, 400);
  if (url.searchParams.has("error")) return popup(origin, "error", { message: "GitHub 授权已取消或失败，请重新登录。" }, 400);
  const code = url.searchParams.get("code");
  if (!code) return popup(origin, "error", { message: "GitHub 未返回授权码，请重新登录。" }, 400);
  try {
    const response = await fetcher("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callback }),
      signal: AbortSignal.timeout(10_000),
    });
    const authorization = await response.json();
    if (!response.ok || typeof authorization.access_token !== "string" || !authorization.access_token || authorization.error) return popup(origin, "error", { message: "GitHub 授权失败，请检查 OAuth App 的回调地址和密钥。" }, 502);
    const repository = await fetcher(`https://api.github.com/repos/${env.GITHUB_REPOSITORY || REPO}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${authorization.access_token}`, "User-Agent": "Osu-Blog-Admin", "X-GitHub-Api-Version": "2022-11-28" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!repository.ok || !(await repository.json()).permissions?.push) return popup(origin, "error", { message: "当前 GitHub 账号没有博客仓库的写入权限，或未授权访问该仓库。" }, 403);
    return popup(origin, "success", { token: authorization.access_token, provider: "github" });
  } catch {
    // Do not render upstream errors: they may include credentials or authorization codes.
    return popup(origin, "error", { message: "暂时无法连接 GitHub，请稍后重新登录。" }, 502);
  }
}
