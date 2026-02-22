const fs=require('fs');
const f='app/AureusSocialPro.js';
let code=fs.readFileSync(f,'utf8');
const orig=code.length;

// The switch is inside: const pg=()=>{switch(s.page){...}}
// Find where pg() is called in JSX
const pgCall=code.indexOf('{pg()}');
if(pgCall>0){
  code=code.replace('{pg()}','<ErrorBoundary key={s.page+(s.sub||"")}>{pg()}</ErrorBoundary>');
  console.log('FIX2 OK: {pg()} wrapped with ErrorBoundary at position',pgCall);
}else{
  console.log('WARN: {pg()} not found, trying alternatives...');
  var patterns=['{pg( )}','{ pg() }','pg()}</','<>{pg()}'];
  var done=false;
  for(var p of patterns){
    if(code.includes(p)){
      console.log('Found alternative:',p);
      done=true;
      break;
    }
  }
  if(!done){
    // Search around where pg is defined
    var pgDef=code.indexOf('const pg=()=>{');
    if(pgDef>0){
      // Search for pg being referenced after its definition
      var searchFrom=pgDef+100;
      var idx=searchFrom;
      while(idx<code.length){
        idx=code.indexOf('pg()',idx);
        if(idx<0)break;
        var ctx=code.substring(Math.max(0,idx-5),idx+10);
        console.log('pg() found at',idx,':',ctx);
        idx+=4;
      }
    }
  }
}

console.log('Size: '+orig+' -> '+code.length+' (+'+(code.length-orig)+')');
fs.writeFileSync(f,code);
console.log('SAVED: '+f);
