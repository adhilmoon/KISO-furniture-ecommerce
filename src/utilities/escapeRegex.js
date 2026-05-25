// Escape special characters in a string so it can be used safely
// inside `new RegExp(...)` or `$regex` MongoDB queries — prevents
// ReDoS and regex injection from arbitrary user search input.
export const escapeRegex = (s) =>
    typeof s === 'string'
        ? s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        : '';
