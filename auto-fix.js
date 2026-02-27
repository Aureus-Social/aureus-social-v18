const fs=require('fs');
const src=fs.readFileSync('app/AureusSocialPro.js','utf8');
const lines=src.split('\n');
function findIdx(pat){for(let i=0;i<lines.length;i++)if(lines[i].includes(pat))return i;return -1;}
const legal=findIdx('var LEGAL=');
const calc=findIdx('function calc(');
const pp=findIdx('function calcPrecompteExact(');
const indep=findIdx('function calcIndependant(');
let test=fs.readFileSync('tests/test-paie.js','utf8');
test=test.replace('lines.slice(0, 923)','lines.slice(0, '+legal+')');
test=test.replace('lines.slice(955, 1140)','lines.slice('+legal+', '+(legal+200)+')');
test=test.replace('lines.slice(1959, 3044)','lines.slice('+calc+', '+pp+')');
test=test.replace('lines.slice(3775, 4194)','lines.slice('+pp+', '+(indep+300)+')');
// Add aggressive JSX removal after existing ones
const marker="src = src.replace(/^.*<\\/.*>.*$/gm, '// [JSX removed]');";
const extra=marker+"\nsrc = src.replace(/^\\s*<[a-zA-Z].*$/gm, '// [JSX removed]');\nsrc = src.replace(/^.*onClick.*$/gm, '// [JSX removed]');\nsrc = src.replace(/^.*style\\s*=\\s*\\{\\{.*$/gm, '// [JSX removed]');\nsrc = src.replace(/^.*className.*$/gm, '// [JSX removed]');\nsrc = src.replace(/^.*\\.Provider.*$/gm, '// [JSX removed]');\nsrc = src.replace(/^.*setLang.*changeLan.*$/gm, '// [JSX removed]');";
test=test.replace(marker, extra);
fs.writeFileSync('tests/test-paie.js',test);
console.log('Blocks: 0-'+legal, legal+'-'+(legal+200), calc+'-'+pp, pp+'-'+(indep+300));
console.log('DONE');