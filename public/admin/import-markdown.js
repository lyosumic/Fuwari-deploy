(function (root) {
  // Kept separate from the widget so the importer can be tested without a CMS.
  function parseMarkdownImport(text, loadYaml) {
    const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    if (!source.startsWith("---\n")) return { body: source, metadata: {} };
    const end = /^---[ \t]*$/m.exec(source.slice(4));
    if (!end) throw new Error("文件开头的 YAML 信息没有结束标记 ---。");
    const metadata = loadYaml(source.slice(4, 4 + end.index)) || {};
    if (typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("文件信息必须是 YAML 对象。");
    return { metadata, body: source.slice(4 + end.index + end[0].length).replace(/^\n/, "") };
  }
  root.parseMarkdownImport = parseMarkdownImport;
  if (!root.CMS || !root.createClass || !root.h) return;

  const markdown = root.CMS.getWidget("markdown");
  const ImportControl = root.createClass({
    getInitialState() { return { message: "" }; },
    async importFile(event) {
      const input = event.target;
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        if (!/\.md$/i.test(file.name)) throw new Error("请选择 .md 文件；PDF 等附件请使用媒体库上传并插入链接。");
        if (file.size > 2 * 1024 * 1024) throw new Error("Markdown 文件请控制在 2MB 以内。");
        const imported = parseMarkdownImport(await file.text(), root.jsyaml.load);
        if (this.props.value && !root.confirm("导入会替换当前正文，是否继续？")) return;
        this.props.onChange(imported.body);
        const info = [];
        if (typeof imported.metadata.title === "string") info.push(`标题：${imported.metadata.title}`);
        if (Array.isArray(imported.metadata.category)) info.push(`分类：${imported.metadata.category.join(" → ")}`);
        if (Array.isArray(imported.metadata.tags)) info.push(`标签：${imported.metadata.tags.join("、")}`);
        this.setState({ message: `已导入 ${file.name} 的正文。${info.join("；")}。请在上方表单填写或确认这些字段；导入尚未保存。` });
      } catch (error) {
        this.setState({ message: `导入失败：${error.message}` });
      } finally { input.value = ""; }
    },
    render() {
      return root.h("div", {},
        root.h("div", { className: "import-box" },
          root.h("label", { htmlFor: `${this.props.forID}-upload` }, "从本机导入 Markdown"),
          root.h("input", { id: `${this.props.forID}-upload`, type: "file", accept: ".md,text/markdown", onChange: this.importFile }),
          root.h("p", { role: "status" }, this.state.message || "导入正文，文件中的标题、分类和标签会显示为提示；图片需要另外上传到媒体库。")),
        root.h(markdown.control, this.props));
    },
  });
  root.CMS.registerWidget("import-markdown", ImportControl, markdown.preview);
})(globalThis);
