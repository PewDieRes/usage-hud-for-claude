importScripts("usage.js");

// Fetch usage (service worker has host permission for claude.ai, so no CORS issue
// and it works regardless of which site you're on), cache it, update the badge.
async function refresh() {
  try {
    const data = await ClaudeUsage.fetchUsage();
    const five = ClaudeUsage.readWindow(data.five_hour);
    const seven = ClaudeUsage.readWindow(data.seven_day);
    await chrome.storage.local.set({
      usage: { five, seven, fetchedAt: Date.now(), error: null },
    });
    const pct = five ? five.pct : null;
    chrome.action.setBadgeText({ text: pct == null ? "" : pct + "%" });
    chrome.action.setBadgeBackgroundColor({ color: pct != null && pct >= 90 ? "#dc2626" : "#d97706" });
  } catch (e) {
    await chrome.storage.local.set({
      usage: { error: e.message, fetchedAt: Date.now() },
    });
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#6b7280" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("refresh", { periodInMinutes: 1 });
  refresh();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("refresh", { periodInMinutes: 1 });
  refresh();
});
chrome.alarms.onAlarm.addListener((a) => { if (a.name === "refresh") refresh(); });

// Pages/popup can ask for an immediate refresh.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "refresh") refresh();
});
