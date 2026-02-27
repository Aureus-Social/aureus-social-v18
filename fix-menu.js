const fs=require('fs');
let c=fs.readFileSync('app/AureusSocialPro.js','utf-8');
c=c.replace(
  '{id:"duediligence"',
  '{id:"baremes_admin",l:"Baremes legaux",i:"\u2696\uFE0F",g:11},\n    {id:"duediligence"'
);
fs.writeFileSync('app/AureusSocialPro.js',c);
console.log('DONE');
