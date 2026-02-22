const fs=require('fs');
const f='app/AureusSocialPro.js';
let code=fs.readFileSync(f,'utf8');

// Add setPage function right before const pg=()=>{
var target='const pg=()=>{';
var fix='const setPage=(p)=>d({type:"NAV",page:p,sub:null});\n  ';
if(code.includes(target) && !code.includes('const setPage=')){
  code=code.replace(target, fix+target);
  console.log('OK: setPage function added before pg()');
}else if(code.includes('const setPage=')){
  console.log('SKIP: setPage already defined');
}else{
  console.log('ERROR: pg() not found');
}

fs.writeFileSync(f,code);
console.log('SAVED');
