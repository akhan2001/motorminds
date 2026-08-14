/**
 * Helpers for building PostgREST filter strings for Supabase queries.
 *
 * `postgrest-js` appends whatever string you pass to `.or()` straight into the
 * query string - it does not parse, trim, or escape it. Two consequences:
 *
 * - Any whitespace (including the newlines/indentation of a multi-line template
 *   literal) becomes part of the column name and PostgREST rejects the whole
 *   request with `PGRST100: failed to parse logic tree`.
 * - Reserved characters in the search term (comma, parentheses) are read as
 *   filter syntax, so a search for "oil, filter" silently changes the query.
 *
 * Build search filters with `buildSearchFilter` instead of hand-writing them.
 */

/**
 * Escapes a value for use inside a double-quoted PostgREST filter value.
 * PostgREST allows backslash-escaping of `\` and `"` within quoted values.
 */
export function escapeFilterValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Builds an `ilike` OR-filter across several columns for a free-text search,
 * e.g. `description.ilike."%oil%",vendor.ilike."%oil%"`.
 *
 * Pass the result straight to `.or()`. Columns may include JSON accessors
 * (`parts_requested->>part_name`).
 */
export function buildSearchFilter(columns: string[], search: string): string {
    const term = escapeFilterValue(search.trim())
    return columns.map((column) => `${column}.ilike."%${term}%"`).join(',')
}
