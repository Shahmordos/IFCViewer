

export const safeStringify = (obj) =>
  JSON.stringify(obj, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2);