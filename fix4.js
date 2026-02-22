const fs=require('fs');
const f='app/AureusSocialPro.js';
let code=fs.readFileSync(f,'utf8');

// Check if React is imported
if(code.includes("import React")){
  console.log('React already imported');
}else if(code.includes("from 'react'")){
  // Add React to existing import
  code=code.replace("from 'react'","React,{default:__React,...__rest} from 'react'");
  // Actually simpler - just add a separate import
  code=code.replace("from 'react'","from 'react';\nimport React from 'react'");
  // Wait that would break. Let me just find the first react import and prepend
  console.log('Trying different approach...');
}

// Safest: just prepend import React
var code2=fs.readFileSync(f,'utf8');
if(!code2.includes("import React")){
  var firstImport=code2.indexOf("import ");
  if(firstImport>=0){
    var lineStart=code2.lastIndexOf('\n',firstImport)+1;
    code2=code2.substring(0,lineStart)+"import React from 'react';\n"+code2.substring(lineStart);
    console.log('OK: import React added');
  }else{
    code2="import React from 'react';\n"+code2;
    console.log('OK: import React prepended');
  }
  fs.writeFileSync(f,code2);
  console.log('SAVED');
}else{
  console.log('SKIP: React already imported');
}
