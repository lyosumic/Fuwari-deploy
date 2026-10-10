(function (root) {
  function normalize(value) {
    const names = typeof value === "string" ? [value] : Array.isArray(value) ? value : value && typeof value.toArray === "function" ? value.toArray() : [];
    return [...new Set(names.filter((name) => typeof name === "string").map((name) => name.trim()).filter(Boolean))];
  }
  function splitInput(value) { return normalize(value.split(/[,，;；\n]+/)); }
  const storageKey = "osu-taxonomy-history-v1";
  let history = { tags: [], categories: [] };
  let published = { tags: [], categories: [] };
  let pending;
  const listeners = new Set();
  try {
    const saved = JSON.parse(root.localStorage.getItem(storageKey) || "{}");
    history = { tags: normalize(saved.tags), categories: normalize(saved.categories) };
  } catch { /* The editor also works when browser storage is unavailable. */ }
  function options(kind) {
    return normalize([...published[kind], ...history[kind]]).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  function remember(data) {
    history.tags = normalize([...history.tags, ...normalize(data.tags)]);
    history.categories = normalize([...history.categories, ...normalize(data.categories)]);
    try { root.localStorage.setItem(storageKey, JSON.stringify(history)); } catch {}
    listeners.forEach((listener) => listener());
  }
  async function load(force = false) {
    if (!pending || force) {
      pending = root.fetch(new URL("./taxonomy.json", root.location.href), { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("历史名称暂不可用");
        const data = await response.json();
        if (!Array.isArray(data.tags) || !Array.isArray(data.categories)) throw new Error("历史名称格式错误");
        published = { tags: normalize(data.tags), categories: normalize(data.categories) };
        listeners.forEach((listener) => listener());
      }).catch((error) => { pending = undefined; throw error; });
    }
    return pending;
  }
  root.TaxonomyChoices = { normalize, splitInput, remember, options, load };
  if (!root.CMS || !root.createClass || !root.h) return;

  const Control = root.createClass({
    getInitialState() { return { query: "", choices: [], loading: true, message: "" }; },
    kind() { return this.props.field.get("kind", "tags"); },
    label() { return this.kind() === "tags" ? "标签" : "分类"; },
    componentDidMount() {
      this.mounted = true;
      listeners.add(this.updateChoices);
      this.loadChoices();
    },
    componentWillUnmount() { this.mounted = false; listeners.delete(this.updateChoices); },
    updateChoices() { if (this.mounted) this.setState({ choices: options(this.kind()) }); },
    async loadChoices(force = false) {
      this.setState({ loading: true, message: "" });
      try { await load(force); }
      catch { if (this.mounted) this.setState({ message: "暂时无法加载历史名称，仍可输入并添加新名称。" }); }
      finally { if (this.mounted) this.setState({ loading: false, choices: options(this.kind()) }); }
    },
    addQuery() {
      const added = splitInput(this.state.query);
      if (!added.length) return;
      this.props.onChange(normalize([...normalize(this.props.value), ...added]));
      this.setState({ query: "" });
    },
    toggle(name) {
      const current = normalize(this.props.value);
      this.props.onChange(current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
      this.setState({ query: "" });
    },
    isValid() {
      return this.state.query.trim() ? { error: { message: `请按 Enter 或点击「添加${this.label()}」确认输入的名称，再保存。` } } : true;
    },
    render() {
      const selected = normalize(this.props.value);
      const query = this.state.query.trim().toLocaleLowerCase();
      const choices = normalize([...this.state.choices, ...selected]).filter((name) => !query || name.toLocaleLowerCase().includes(query));
      const label = this.label();
      return root.h("div", { className: "taxonomy-editor" },
        root.h("div", { className: "taxonomy-selected", "aria-label": `已选择的${label}` },
          selected.length ? selected.map((name) => root.h("span", { key: name, className: "taxonomy-chip" }, name,
            root.h("button", { type: "button", "aria-label": `移除${label} ${name}`, onClick: () => this.toggle(name) }, "×"))) : root.h("span", { className: "taxonomy-muted" }, `暂未选择${label}`)),
        root.h("div", { className: "taxonomy-input-row" },
          root.h("input", { id: this.props.forID, type: "text", value: this.state.query, autoComplete: "off", placeholder: `搜索历史${label}，或输入新名称`,
            onChange: (event) => this.setState({ query: event.target.value }),
            onKeyDown: (event) => { if (event.key === "Enter" && !event.nativeEvent?.isComposing) { event.preventDefault(); this.addQuery(); } } }),
          root.h("button", { type: "button", onClick: this.addQuery, disabled: !this.state.query.trim() }, `添加${label}`)),
        root.h("p", { className: "taxonomy-muted" }, `可选择多个${label}；新名称按 Enter 或点击添加，逗号可分隔多个名称。`),
        root.h("div", { className: "taxonomy-history-title" }, root.h("strong", {}, `历史${label}`),
          root.h("button", { type: "button", onClick: () => this.loadChoices(true), disabled: this.state.loading }, "刷新选项")),
        root.h("div", { className: "taxonomy-options", "aria-label": `历史${label}选项` },
          choices.slice(0, 40).map((name) => root.h("button", { key: name, type: "button", "aria-pressed": selected.includes(name), onClick: () => this.toggle(name) }, name))),
        root.h("p", { className: "taxonomy-muted", role: "status" }, this.state.message || (this.state.loading ? "正在加载历史名称…" : choices.length ? (choices.length > 40 ? "输入关键词可搜索更多名称。" : `已选择 ${selected.length} 个${label}`) : query ? "没有匹配名称，可直接添加。" : "还没有历史名称，可直接添加新名称。")));
    },
  });
  const Preview = root.createClass({ render() { return root.h("span", {}, normalize(this.props.value).join(" · ")); } });
  root.CMS.registerWidget("taxonomy", Control, Preview);
  const saved = ({ entry }) => {
    const data = entry?.get("data");
    if (!data) return;
    if ((data.has("published") && data.has("tags") && data.has("category")) || data.has("categories")) {
      remember({ tags: data.get("tags"), categories: data.has("categories") ? data.get("categories") : data.get("category") });
    }
  };
  root.CMS.registerEventListener({ name: "postSave", handler: saved });
  root.CMS.registerEventListener({ name: "postPublish", handler: saved });
})(globalThis);
