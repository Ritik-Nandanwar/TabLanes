const form = document.getElementById("rule-form");
const nameInput = document.getElementById("group-name");
const patternInput = document.getElementById("pattern");
const colorInput = document.getElementById("color");
const saveButton = document.getElementById("save-rule");
const cancelButton = document.getElementById("cancel-edit");
const rulesElement = document.getElementById("rules");
const emptyElement = document.getElementById("empty");
const statusElement = document.getElementById("status");
const colorNames = { blue: "Blue", red: "Red", yellow: "Yellow", green: "Green", pink: "Pink", purple: "Purple", cyan: "Cyan", orange: "Orange", grey: "Grey" };
let editingRuleId = null;

function patternsFor(rule) {
  return Array.isArray(rule.patterns) ? rule.patterns : rule.pattern ? [rule.pattern] : [];
}

function renderRules(rules) {
  rulesElement.replaceChildren();
  document.getElementById("rule-count").textContent = String(rules.length);
  emptyElement.hidden = rules.length > 0;
  for (const rule of rules) {
    const item = document.createElement("div");
    item.className = "rule-item";
    const badge = document.createElement("span");
    badge.className = `color-dot ${rule.color}`;
    const details = document.createElement("span");
    details.className = "rule-details";
    const name = document.createElement("strong");
    name.textContent = rule.name;
    const pattern = document.createElement("small");
    pattern.textContent = patternsFor(rule).join(" · ");
    details.append(name, pattern);
    const color = document.createElement("small");
    color.className = "color-name";
    color.textContent = colorNames[rule.color] || rule.color;
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${rule.name} rule`);
    remove.textContent = "×";
    remove.addEventListener("click", () => removeRule(rule.id));
    const edit = document.createElement("button");
    edit.className = "edit";
    edit.type = "button";
    edit.setAttribute("aria-label", `Edit ${rule.name} rule`);
    edit.title = "Edit rule";
    edit.textContent = "✎";
    edit.addEventListener("click", () => beginEdit(rule));
    item.append(badge, details, color, edit, remove);
    rulesElement.append(item);
  }
}

async function loadRules() {
  const { rules = [] } = await chrome.storage.local.get({ rules: [] });
  renderRules(rules);
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const patterns = [...new Set(patternInput.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean))];
  if (!patterns.length) {
    statusElement.textContent = "Add at least one website URL pattern.";
    return;
  }
  for (const pattern of patterns) {
    if (!/^https?:\/\//i.test(pattern)) {
      statusElement.textContent = `Use a full http(s) URL: ${pattern}`;
      return;
    }
    try {
      const parsed = new URL(pattern.replace(/\*/g, "wildcard"));
      if (!parsed.hostname.includes(".")) throw new Error("hostname");
    } catch {
      statusElement.textContent = `That URL pattern is not valid: ${pattern}`;
      return;
    }
  }
  const { rules = [] } = await chrome.storage.local.get({ rules: [] });
  const name = nameInput.value.trim();
  if (rules.some(rule => rule.id !== editingRuleId && rule.name.toLowerCase() === name.toLowerCase())) {
    statusElement.textContent = "That group name is already in use.";
    return;
  }
  const updatedRule = { id: editingRuleId || crypto.randomUUID(), patterns, name, color: colorInput.value };
  const existingIndex = rules.findIndex(rule => rule.id === editingRuleId);
  const wasEditing = existingIndex >= 0;
  if (wasEditing) rules[existingIndex] = updatedRule;
  else rules.push(updatedRule);
  await chrome.storage.local.set({ rules });
  resetForm();
  statusElement.textContent = wasEditing ? `“${name}” group updated.` : `“${name}” group created.`;
  renderRules(rules);
});

function beginEdit(rule) {
  editingRuleId = rule.id;
  nameInput.value = rule.name;
  patternInput.value = patternsFor(rule).join("\n");
  colorInput.value = rule.color;
  saveButton.textContent = "Save changes";
  cancelButton.hidden = false;
  nameInput.focus();
  statusElement.textContent = `Editing “${rule.name}”.`;
}

function resetForm() {
  editingRuleId = null;
  form.reset();
  saveButton.textContent = "Create group";
  cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
  resetForm();
  statusElement.textContent = "Edit canceled.";
});

async function removeRule(id) {
  const { rules = [] } = await chrome.storage.local.get({ rules: [] });
  const updated = rules.filter(rule => rule.id !== id);
  await chrome.storage.local.set({ rules: updated });
  statusElement.textContent = "URL rule removed.";
  renderRules(updated);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.rules) renderRules(changes.rules.newValue || []);
});

loadRules();
