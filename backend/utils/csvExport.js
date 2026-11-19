const { createObjectCsvStringifier } = require('csv-writer');

/**
 * Generate a CSV string from a data array with specified headers.
 *
 * @param {Array<object>} data - Array of data objects.
 * @param {Array<{id: string, title: string}>} headers - Array of header definitions.
 * @returns {string} CSV-formatted string including headers and rows.
 *
 * Example:
 *   const csv = generateCSV(
 *     [{ name: 'Alice', email: 'alice@test.com' }],
 *     [{ id: 'name', title: 'Name' }, { id: 'email', title: 'Email' }]
 *   );
 */
const generateCSV = (data, headers) => {
  const csvStringifier = createObjectCsvStringifier({
    header: headers,
  });

  const headerString = csvStringifier.getHeaderString();
  const recordsString = csvStringifier.stringifyRecords(data);

  return headerString + recordsString;
};

/**
 * Generate CSV manually without external library as fallback.
 *
 * @param {Array<object>} data - Array of data objects.
 * @param {Array<{id: string, title: string}>} headers - Array of header definitions.
 * @returns {string} CSV-formatted string.
 */
const generateCSVManual = (data, headers) => {
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Header row
  const headerRow = headers.map((h) => escapeCSV(h.title)).join(',');

  // Data rows
  const dataRows = data.map((row) =>
    headers.map((h) => escapeCSV(row[h.id])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

module.exports = { generateCSV, generateCSVManual };
