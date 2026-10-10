import { handleOAuth } from "./github-oauth.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/auth" || pathname.startsWith("/auth/")) {
      return handleOAuth(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
