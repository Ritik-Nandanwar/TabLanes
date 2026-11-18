let scheduled = false;
let running = false;
let rerunRequested = false;

function matchesPattern(pattern, url) {
  try {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i").test(url);
  } catch {
    return false;
  }
}

function rulePatterns(rule) {
  return Array.isArray(rule.patterns) ? rule.patterns : rule.pattern ? [rule.pattern] : [];
}

function ruleMatches(rule, url) {
  return rulePatterns(rule).some(pattern => matchesPattern(pattern, url));
}

function scheduleGrouping() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    groupTabs().catch(error => console.error("TabLanes grouping failed", error));
  }, 400);
}

async function groupTabs() {
  if (running) { rerunRequested = true; return; }
  running = true;
  try {
    const { rules = [] } = await chrome.storage.local.get({ rules: [] });
    const tabs = await chrome.tabs.query({});
    const groups = await chrome.tabGroups.query({});
    const groupsByTitle = new Map(groups.map(group => [group.title, group]));
    const claimed = new Set();

    // Earlier rules win when URL patterns overlap.
    for (const rule of rules) {
      const matched = tabs.filter(tab => Number.isInteger(tab.id) && !claimed.has(tab.id) && ruleMatches(rule, tab.url || tab.pendingUrl || ""));
      for (const tab of matched) claimed.add(tab.id);
      if (!matched.length) continue;

      const existing = groupsByTitle.get(rule.name);
      const matchedIds = new Set(matched.map(tab => tab.id));
      const hasMatchedInExisting = existing && tabs.some(tab => tab.groupId === existing.id && matchedIds.has(tab.id));
      if (existing) {
        const staleMembers = tabs.filter(tab => tab.groupId === existing.id && !matchedIds.has(tab.id)).map(tab => tab.id);
        if (staleMembers.length) await chrome.tabs.ungroup(staleMembers);
      }
      const together = existing && matched.every(tab => tab.groupId === existing.id);
      const groupId = together ? existing.id : await chrome.tabs.group({
        tabIds: matched.map(tab => tab.id),
        ...(hasMatchedInExisting ? { groupId: existing.id } : {})
      });
      if (!together || existing.color !== rule.color || existing.title !== rule.name || existing.collapsed) {
        await chrome.tabGroups.update(groupId, { title: rule.name, color: rule.color, collapsed: false });
      }
    }

    // If a matching rule no longer has any open tabs, dissolve its empty-purpose group.
    for (const rule of rules) {
      const group = groupsByTitle.get(rule.name);
      if (!group) continue;
      const members = tabs.filter(tab => tab.groupId === group.id);
      const anyMatch = members.some(tab => ruleMatches(rule, tab.url || tab.pendingUrl || ""));
      if (members.length && !anyMatch) await chrome.tabs.ungroup(members.map(tab => tab.id));
    }
  } finally {
    running = false;
    if (rerunRequested) { rerunRequested = false; scheduleGrouping(); }
  }
}

async function removeDeletedRuleGroups(oldRules, newRules) {
  const activeNames = new Set(newRules.map(rule => rule.name));
  const deletedNames = new Set(oldRules.filter(rule => !activeNames.has(rule.name)).map(rule => rule.name));
  if (!deletedNames.size) return;
  const groups = await chrome.tabGroups.query({});
  const tabs = await chrome.tabs.query({});
  for (const group of groups) {
    if (!deletedNames.has(group.title)) continue;
    const ids = tabs.filter(tab => tab.groupId === group.id).map(tab => tab.id);
    if (ids.length) await chrome.tabs.ungroup(ids);
  }
}

chrome.runtime.onInstalled.addListener(scheduleGrouping);
chrome.runtime.onStartup.addListener(scheduleGrouping);
chrome.tabs.onCreated.addListener(scheduleGrouping);
chrome.tabs.onUpdated.addListener((_, change) => {
  if (change.url || change.status === "complete") scheduleGrouping();
});
chrome.tabs.onRemoved.addListener(scheduleGrouping);
chrome.tabs.onAttached.addListener(scheduleGrouping);
chrome.tabs.onDetached.addListener(scheduleGrouping);
chrome.tabs.onMoved.addListener(scheduleGrouping);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.rules) return;
  removeDeletedRuleGroups(changes.rules.oldValue || [], changes.rules.newValue || [])
    .then(scheduleGrouping)
    .catch(error => console.error("TabLanes rule update failed", error));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GROUP_NOW") {
    groupTabs().then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
});
