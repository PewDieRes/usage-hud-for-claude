const $ = (id) => document.getElementById(id);

function bar(prefix, w) {
  if (!w) { $(prefix + "-val").textContent = "n/a"; return; }
  $(prefix + "-fill").style.width = Math.min(w.pct, 100) + "%";
  $(prefix + "-fill").classList.toggle("hot", w.pct >= 90);
  $(prefix + "-val").textContent = w.pct + "%";
  $(prefix + "-reset").textContent = "resets in " + ClaudeUsage.formatRemaining(w.resetsAt);
}

function render(u) {
  if (!u) return;
  if (u.error) {
    $("err").hidden = false;
    $("err").textContent = "Usage unavailable: " + u.error + ". Make sure you're logged in at claude.ai.";
    return;
  }
  $("err").hidden = true;
  bar("s", u.five);
  bar("w", u.seven);
}

chrome.storage.local.get("usage", (r) => render(r && r.usage));
chrome.storage.onChanged.addListener((c, area) => {
  if (area === "local" && c.usage) render(c.usage.newValue);
});
chrome.runtime.sendMessage({ type: "refresh" });
