// Shared helpers: find the org and fetch usage from claude.ai's internal API.
// NOTE: this is an undocumented endpoint; field names may change.
(function (root) {
  const BASE = "https://claude.ai";

  async function getJson(path) {
    const res = await fetch(BASE + path, { credentials: "include" });
    if (!res.ok) throw new Error(path + " -> HTTP " + res.status);
    return res.json();
  }

  // Accounts can have several orgs (e.g. personal + team); only some have usage
  // data (five_hour is null on the others). Query each and pick the first with data.
  async function fetchUsage() {
    const orgs = await getJson("/api/organizations");
    if (!Array.isArray(orgs) || !orgs.length) throw new Error("No organizations (are you logged in?)");
    const chatOrgs = orgs.filter((o) => (o.capabilities || []).includes("chat"));
    const candidates = chatOrgs.length ? chatOrgs : orgs;
    let lastErr = null;
    let fallback = null;
    for (const o of candidates) {
      try {
        const d = await getJson("/api/organizations/" + o.uuid + "/usage");
        if (d && d.five_hour) return d;
        fallback = fallback || d;
      } catch (e) { lastErr = e; }
    }
    if (fallback) return fallback;
    throw lastErr || new Error("No usage data returned");
  }

  // Normalise a window ({utilization, resets_at}) to {pct, resetsAt}.
  function readWindow(w) {
    if (!w || typeof w.utilization !== "number") return null;
    return {
      pct: Math.max(0, Math.round(w.utilization)),
      resetsAt: w.resets_at ? new Date(w.resets_at).getTime() : null,
    };
  }

  function formatRemaining(ts) {
    if (!ts) return "--";
    const diff = ts - Date.now();
    if (diff <= 0) return "now";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return d ? d + "d " + h + "h" : h + "h " + m + "m";
  }

  root.ClaudeUsage = { fetchUsage, readWindow, formatRemaining };
})(typeof window !== "undefined" ? window : self);
