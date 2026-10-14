/**
 * Helpers for safely turning untrusted query-string values into Mongo filters.
 *
 * Express's default (qs) parser turns `?status[$ne]=x` into an object, which
 * would otherwise be passed straight into a Mongo filter (NoSQL injection).
 */

/** Return the value only if it is a plain string, otherwise undefined. */
function queryString(value) {
  return typeof value === 'string' ? value : undefined;
}

/** Escape regex metacharacters so user input is matched literally. */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" regex filter built from a literal string. */
function containsRegex(value) {
  return { $regex: escapeRegex(value), $options: 'i' };
}

module.exports = {
  queryString,
  escapeRegex,
  containsRegex
};
