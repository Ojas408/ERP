const XLSX = require('./frontend/node_modules/xlsx');

// Full APR 2026
const wb1 = XLSX.readFile('APR 2026.xlsx');
const ws1 = wb1.Sheets['Sheet1'];
const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' });
console.log('=== APR 2026.xlsx - ALL ROWS ===');
data1.forEach((row, i) => {
  const cleaned = row.filter(c => c !== '');
  if (cleaned.length > 0) console.log('Row', i, ':', JSON.stringify(row.slice(0,7)));
});

console.log('\n\n=== March2026.xlsx - Combined All Plant ===');
const wb2 = XLSX.readFile('March2026.xlsx');
const ws2 = wb2.Sheets['Combined All Plant'];
const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' });
data2.forEach((row, i) => {
  const cleaned = row.filter(c => c !== '');
  if (cleaned.length > 0) console.log('Row', i, ':', JSON.stringify(row.slice(0,7)));
});
