(function () {
  const error = document.getElementById("boot-error");
  if (!window.CMS || !window.jsyaml || !window.parseMarkdownImport || !window.TaxonomyChoices) {
    error.textContent = "编辑器资源未加载成功，请检查网络后刷新页面。";
    return;
  }
  // The deployed admin uses GitHub only; no anonymous writable backend is exposed.
  window.CMS.registerEventListener({
    name: "preSave",
    handler: ({ entry, collection }) => {
      let data = entry.get("data");
      if (data.has("updated") && !data.get("updated")) data = data.delete("updated");
      if (data.has("published") && data.has("tags") && data.has("category")) {
        data = data.set("tags", window.TaxonomyChoices.normalize(data.get("tags")))
          .set("category", window.TaxonomyChoices.normalize(data.get("category")));
      }
      for (const key of ["pdf", "source", "repository", "demo"]) {
        if (!data.has(key)) continue;
        const value = (data.get(key) || "").trim();
        if (value && (!/^https?:\/\//i.test(value) && !value.startsWith("/uploads/") || /\\/.test(value) || value.split("/").some((part) => /^(\.|%2e){1,2}$/i.test(part)))) {
          throw new Error("附件请使用 /uploads/ 路径或 http(s) 链接。");
        }
        if (key === "pdf" && value && !/\.pdf(?:[?#].*)?$/i.test(value)) throw new Error("笔记附件必须为 PDF。");
        if (key === "source" && value && !/\.(?:zip|tar|gz|tgz|7z)(?:[?#].*)?$/i.test(value)) throw new Error("源码请上传 zip、tar、gz、tgz 或 7z 压缩包。");
        if ((key === "repository" || key === "demo") && value && !/^https?:\/\//i.test(value)) throw new Error("仓库与演示地址必须是 http(s) 链接。");
        data = data.set(key, value);
      }
      if ((collection?.get("name") === "notes" || data.has("pdf")) && !data.get("pdf")) throw new Error("请上传 PDF 笔记后再保存。");
      if (data.has("aliases")) {
        const seen = new Set();
        const aliases = data.get("aliases");
        if (aliases) {
          data = data.set("aliases", aliases.map((alias) => {
            const from = (alias.get("from") || "").trim();
            if (!from || seen.has(from)) throw new Error("原标签不能为空或重复，请检查标签映射。");
            seen.add(from);
            return alias.set("from", from).set("to", (alias.get("to") || "").trim());
          }));
        } else data = data.set("aliases", []);
      }
      return data;
    },
  });
  window.CMS.init({
    config: {
      backend: {
        base_url: window.location.origin,
        auth_endpoint: "auth",
        site_domain: window.location.hostname,
      },
    },
  });
  const boot = document.getElementById("boot");
  const observer = new MutationObserver(() => {
    if (document.getElementById("nc-root")) {
      boot.hidden = true;
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
  if (document.getElementById("nc-root")) { boot.hidden = true; observer.disconnect(); }
})();
