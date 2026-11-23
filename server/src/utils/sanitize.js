/**
 * Escapes characters with special meaning in regular expressions
 * to prevent ReDoS and regex injection.
 * @param {string} string - The string to escape.
 * @returns {string} - Escaped string safe for new RegExp or Mongoose $regex.
 */
function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  escapeRegex
};
