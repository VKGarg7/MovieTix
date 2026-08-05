export const ACTION_META = {
  create: { label: "Created", cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  update: { label: "Updated", cls: "bg-nebula-cyan/10 border-nebula-cyan/30 text-nebula-cyan" },
  delete: { label: "Deleted", cls: "bg-primary/10 border-primary/30 text-primary" },
  export: { label: "Exported", cls: "bg-nebula-violet/10 border-nebula-violet/30 text-nebula-violet" },
  login: { label: "Login", cls: "bg-nebula-amber/10 border-nebula-amber/30 text-nebula-amber" },
};

export const getActionMeta = (action) => ACTION_META[action] || ACTION_META.update;

const nameFromDiff = (entry) => {
  const after = entry.diff?.after || {};
  const before = entry.diff?.before || {};
  return after.title || after.name || after.code || before.title || before.name || before.code || null;
};

export const getEntitySummary = (entry) => {
  const name = nameFromDiff(entry);
  const actionVerb = { create: "Created", update: "Updated", delete: "Deleted", export: "Exported", login: "Logged in" }[entry.action] || "Modified";
  const entityLabel = entry.entityType;

  if (entry.entityType === "Show" && entry.action === "create") {
    const count = entry.diff?.after?.showsCreated;
    return count ? `Created ${count} show${count > 1 ? "s" : ""}` : "Created new show";
  }
  if (name) {
    return `${actionVerb} ${entityLabel.toLowerCase()} "${name}"`;
  }
  return `${actionVerb} ${entityLabel.toLowerCase()} #${entry.entityId?.slice(-6)}`;
};

export const getActorInitials = (entry) => {
  const name = entry.actorName || entry.actorId || "?";
  return name.slice(0, 1).toUpperCase();
};

export const matchesSearch = (entry, query) => {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    entry.actorId,
    entry.actorName,
    entry.entityType,
    entry.entityId,
    entry.action,
    getEntitySummary(entry),
    JSON.stringify(entry.diff || {}),
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
};

const flattenObject = (obj, prefix = "") => {
  const out = {};
  if (!obj || typeof obj !== "object") return out;
  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flattenObject(value, path));
    } else {
      out[path] = value;
    }
  });
  return out;
};

export const computeFieldDiff = (before, after) => {
  const beforeFlat = flattenObject(before);
  const afterFlat = flattenObject(after);
  const keys = new Set([...Object.keys(beforeFlat), ...Object.keys(afterFlat)]);

  const rows = [];
  keys.forEach((key) => {
    const inBefore = key in beforeFlat;
    const inAfter = key in afterFlat;
    const beforeVal = beforeFlat[key];
    const afterVal = afterFlat[key];

    if (!inBefore && inAfter) {
      rows.push({ key, status: "added", before: undefined, after: afterVal });
    } else if (inBefore && !inAfter) {
      rows.push({ key, status: "removed", before: beforeVal, after: undefined });
    } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      rows.push({ key, status: "modified", before: beforeVal, after: afterVal });
    } else {
      rows.push({ key, status: "unchanged", before: beforeVal, after: afterVal });
    }
  });

  return rows.sort((a, b) => a.key.localeCompare(b.key));
};
