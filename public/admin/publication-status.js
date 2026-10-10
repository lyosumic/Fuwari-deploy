(function () {
  const status = document.getElementById("deployment-status");
  const refresh = document.getElementById("refresh-publication");
  let lastCommit = "";
  async function loadStatus() {
    refresh.disabled = true;
    try {
      const response = await fetch(`/content-status.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("状态文件不可用");
      const snapshot = await response.json();
      if (!snapshot.content || !snapshot.builtAt) throw new Error("状态格式不正确");
      const date = new Date(snapshot.builtAt).toLocaleString("zh-CN", { timeZone: "Asia/Hong_Kong", hour12: false });
      const labels = { posts: "博客", notes: "笔记", projects: "项目" };
      const platforms = { cloudflare: "Cloudflare Pages", "cloudflare-workers": "Cloudflare Workers", local: "本地 / 其他平台" };
      const counts = Object.entries(labels).map(([key, label]) => `${label} ${snapshot.content[key]?.length || 0}`).join(" · ");
      const drafts = Object.values(snapshot.drafts || {}).reduce((sum, value) => sum + Number(value), 0);
      status.textContent = `网站最近构建：${date}（香港时间）。${platforms[snapshot.provider] ? `部署平台：${platforms[snapshot.provider]}。` : ""}公开内容：${counts}。隐藏草稿：${drafts}。${snapshot.commit ? `提交 ${snapshot.commit.slice(0, 7)}。` : ""}${snapshot.branch ? `分支 ${snapshot.branch}。` : ""}`;
      if (lastCommit && snapshot.commit && lastCommit !== snapshot.commit) status.textContent += "网站已有新的构建，请打开网站核对内容。";
      lastCommit = snapshot.commit || "";
    } catch {
      status.textContent = "暂时无法读取网站构建状态。请在托管平台的部署记录中检查最近一次生产部署是否成功，以及是否来自 main 分支。";
    } finally { refresh.disabled = false; }
  }
  refresh.addEventListener("click", loadStatus);
  loadStatus();
  if (!window.CMS) return;
  const saved = ({ entry }) => {
    const draft = entry?.get("data")?.get("draft") === true;
    document.getElementById("save-status").textContent = draft
      ? "已保存为草稿：该内容不会出现在公开网站。请关闭「隐藏为草稿」后再保存。"
      : "内容已提交到 GitHub。等待网站部署完成后，点击刷新网站状态并打开网站核对。";
    document.getElementById("publication-summary").textContent = draft ? "已保存草稿 · 网站不会显示" : "已保存 · 等待网站部署";
    document.getElementById("publication-panel").open = true;
  };
  window.CMS.registerEventListener({ name: "postSave", handler: saved });
  window.CMS.registerEventListener({ name: "postPublish", handler: saved });
})();
