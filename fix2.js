const fs=require('fs');
const f='app/AureusSocialPro.js';
let code=fs.readFileSync(f,'utf8');
const orig=code.length;
const lines=code.split('\n');

// Find the switch context
const dashIdx=code.indexOf("case'dashboard':return <Dashboard");
if(dashIdx<0){console.log('ERREUR: case dashboard not found');process.exit(1);}

// Show 5 lines before case'dashboard' for debug
const lineNum=code.substring(0,dashIdx).split('\n').length;
console.log('case dashboard found at line',lineNum);
console.log('--- CONTEXT (5 lines before) ---');
for(let i=Math.max(0,lineNum-6);i<lineNum;i++){
  console.log((i+1)+': '+lines[i].substring(0,120));
}

// Find switch(s.page) before case'dashboard'
const switchIdx=code.lastIndexOf('switch(s.page)',dashIdx);
if(switchIdx<0){console.log('ERREUR: switch(s.page) not found');process.exit(1);}
console.log('switch(s.page) found at position',switchIdx);

// Find the last case (team)
const teamIdx=code.indexOf("case'team':return <TeamManagement",dashIdx);
if(teamIdx<0){console.log('ERREUR: case team not found');process.exit(1);}

// Find the closing after team case - look for default: or } that closes switch
let closeSearch=teamIdx+50;
// Try to find default:return or the switch closing brace
const defaultIdx=code.indexOf('default:return',teamIdx);
const closeBrace=code.indexOf('}})',teamIdx);
const closeIIFE=code.indexOf('})()}',teamIdx);

console.log('--- CLOSING PATTERNS ---');
console.log('default:return at',defaultIdx>0?defaultIdx-teamIdx+'chars after team':'NOT FOUND');
console.log('}}) at',closeBrace>0?closeBrace-teamIdx+'chars after team':'NOT FOUND');
console.log('})() at',closeIIFE>0?closeIIFE-teamIdx+'chars after team':'NOT FOUND');

// Now find what wraps the switch - look backwards from switch for IIFE or function
const before200=code.substring(Math.max(0,switchIdx-200),switchIdx);
console.log('--- 200 chars before switch ---');
console.log(before200.slice(-120));

// Determine the wrapping strategy
let wrapped=false;

// Strategy A: IIFE pattern {(()=>{switch
const iifeCheck=code.substring(switchIdx-20,switchIdx);
if(iifeCheck.includes('(()=>{')||iifeCheck.includes('(function(){')){
  console.log('Pattern: IIFE detected');
  const openTag=code.lastIndexOf('{(()=>{',switchIdx);
  if(openTag>0&&(switchIdx-openTag)<30){
    code=code.substring(0,openTag)+'<ErrorBoundary key={s.page+(s.sub||"")}>'+code.substring(openTag);
    const newCloseIIFE=code.indexOf('})()}',teamIdx+100);
    if(newCloseIIFE>0){
      code=code.substring(0,newCloseIIFE+4)+'</ErrorBoundary>'+code.substring(newCloseIIFE+4);
      wrapped=true;
      console.log('FIX2 OK: IIFE wrapped');
    }
  }
}

// Strategy B: renderPage function
if(!wrapped){
  const renderPageDef=code.lastIndexOf('renderPage',switchIdx);
  if(renderPageDef>0&&(switchIdx-renderPageDef)<200){
    const chunk=code.substring(renderPageDef,switchIdx);
    console.log('renderPage context:',chunk.substring(0,80));
    // Find where renderPage is called in JSX
    const callPatterns=['{renderPage()}','{renderPage(s,d)}','{renderPage(s, d)}','{renderPage(s,d,','{pageContent}'];
    for(const p of callPatterns){
      const ci=code.indexOf(p,switchIdx);
      if(ci>0){
        code=code.replace(p,'<ErrorBoundary key={s.page+(s.sub||"")}>'+p+'</ErrorBoundary>');
        wrapped=true;
        console.log('FIX2 OK: renderPage call wrapped at',p);
        break;
      }
    }
  }
}

// Strategy C: direct inline switch in JSX - broader pattern search
if(!wrapped){
  // Search for various inline patterns
  const patterns=[
    'switch(s.page){',
    '{switch(s.page)',
  ];
  const switchLine=lines[lineNum-2]||'';
  console.log('Switch line:',switchLine.substring(0,120));
  
  // Fallback: just wrap the content area div that contains the switch
  // Find the div/section that wraps the main content
  const contentDiv=code.lastIndexOf("style={{flex:1",switchIdx);
  if(contentDiv>0&&(switchIdx-contentDiv)<500){
    const tagStart=code.lastIndexOf('<div',contentDiv);
    const tagEnd=code.indexOf('>',tagStart);
    if(tagStart>0){
      code=code.substring(0,tagEnd+1)+'<ErrorBoundary key={s.page+(s.sub||"")}>'+code.substring(tagEnd+1);
      // Find matching closing div after all cases
      const afterTeam=code.indexOf("case'team':return <TeamManagement");
      const endOfSwitch=code.indexOf('</div>',afterTeam+200);
      if(endOfSwitch>0){
        code=code.substring(0,endOfSwitch)+'</ErrorBoundary>'+code.substring(endOfSwitch);
        wrapped=true;
        console.log('FIX2 OK: Content div wrapped');
      }
    }
  }
}

if(!wrapped){
  console.log('FIX2 MANUAL NEEDED - showing exact context for manual fix');
  console.log('Add <ErrorBoundary key={s.page+(s.sub||"")}> before the switch');
  console.log('Add </ErrorBoundary> after the switch closing');
}

console.log('Size: '+orig+' -> '+code.length+' (+'+(code.length-orig)+')');
fs.writeFileSync(f,code);
console.log('SAVED: '+f);
