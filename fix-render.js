const fs=require('fs');
let c=fs.readFileSync('app/AureusSocialPro.js','utf-8');
c=c.replace(
  "case'duediligence':return <DueDiligenceSociale",
  "case'baremes_admin':return <BaremesAdminMod s={s} d={d}/>;\n      case'duediligence':return <DueDiligenceSociale"
);
fs.writeFileSync('app/AureusSocialPro.js',c);
console.log('DONE');
