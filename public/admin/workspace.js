(function () {
  const workspace = document.getElementById("workspace");
  const actions = workspace.querySelector(".quick-actions");
  function update() {
    const editor = /\/collections\/[^/]+\/(new|entries)(?:\/|$)/.test(window.location.hash);
    workspace.hidden = editor;
    document.body.dataset.view = editor ? "editor" : "collection";
    // Decap 3.16.3 styled component target; no auth token or user data is read.
    actions.hidden = !document.querySelector('#nc-root aside, #nc-root .e1t18l343');
  }
  window.addEventListener("hashchange", update);
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
  update();
})();
