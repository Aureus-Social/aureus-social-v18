const fs=require('fs');
const f='app/AureusSocialPro.js';
let code=fs.readFileSync(f,'utf8');
const orig=code.length;
const NL=String.fromCharCode(10);

// === FIX 1: ErrorBoundary ===
const eb=[
'// === ERROR BOUNDARY (audit fix 22/02/2026) ===',
'class ErrorBoundary extends React.Component{',
'  constructor(p){super(p);this.state={hasError:false,error:null,info:null};}',
'  static getDerivedStateFromError(e){return{hasError:true,error:e};}',
'  componentDidCatch(e,info){this.setState({info});console.error("MODULE CRASH:",e,info);}',
'  render(){',
'    if(this.state.hasError){',
'      return React.createElement("div",{style:{padding:40,textAlign:"center",background:"#060810",minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}},',
'        React.createElement("div",{style:{fontSize:48,marginBottom:16}},"\u26A0\uFE0F"),',
'        React.createElement("div",{style:{fontSize:18,fontWeight:700,color:"#ef4444",marginBottom:12}},"Module en erreur"),',
'        React.createElement("div",{style:{fontSize:12,color:"#9e9b93",marginBottom:8,maxWidth:500,wordBreak:"break-all"}},String(this.state.error||"")),',
'        React.createElement("div",{style:{fontSize:10,color:"#666",marginBottom:20,maxWidth:500,wordBreak:"break-all"}},this.state.info&&this.state.info.componentStack?this.state.info.componentStack.slice(0,300):""),',
'        React.createElement("div",{style:{display:"flex",gap:10}},',
'          React.createElement("button",{onClick:function(){this.setState({hasError:false,error:null,info:null});}.bind(this),',
'            style:{padding:"10px 24px",background:"rgba(198,163,78,.15)",border:"1px solid rgba(198,163,78,.3)",borderRadius:8,color:"#c6a34e",cursor:"pointer",fontSize:13,fontWeight:600}},"\u21A9 Retour"),',
'          React.createElement("button",{onClick:function(){location.reload();},',
'            style:{padding:"10px 24px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,color:"#ef4444",cursor:"pointer",fontSize:13,fontWeight:600}},"\uD83D\uDD04 Recharger")',
'        )',
'      );',
'    }',
'    return this.props.children;',
'  }',
'}',
'// === END ERROR BOUNDARY ==='
].join(NL);

const insertPoint=code.indexOf('const uid=');
if(insertPoint>0){
  code=code.slice(0,insertPoint)+eb+NL+code.slice(insertPoint);
  console.log('FIX1 OK: ErrorBoundary added at position',insertPoint);
}else{
  const lines=code.split(NL);
  lines.splice(100,0,eb);
  code=lines.join(NL);
  console.log('FIX1 OK: ErrorBoundary added at line 100 (fallback)');
}

// === FIX 2: Wrap the inline switch with ErrorBoundary ===
const inlineSwitch='{(()=>{switch(s.page)';
if(code.includes(inlineSwitch)){
  code=code.replace(inlineSwitch,'<ErrorBoundary key={s.page+(s.sub||"")}>'+inlineSwitch);
  const lastCase="case'team':return <TeamManagement";
  const lcIdx=code.indexOf(lastCase);
  if(lcIdx>0){
    const closeIdx=code.indexOf('})()}',lcIdx);
    if(closeIdx>0){
      code=code.slice(0,closeIdx+4)+'</ErrorBoundary>'+code.slice(closeIdx+4);
      console.log('FIX2 OK: Switch wrapped with ErrorBoundary');
    }else{console.log('FIX2 WARN: closing })() not found');}
  }else{console.log('FIX2 WARN: last case not found');}
}else{console.log('FIX2 WARN: inline switch pattern not found');}

// === FIX 3: Remove sprint10 redirect ===
const s10="if(a.page==='sprint10'){window.location.href='/sprint10/auth';return s;}";
if(code.includes(s10)){
  code=code.replace(s10,'/* sprint10 redirect removed - audit fix 22/02/2026 */');
  console.log('FIX3 OK: sprint10 redirect removed');
}else{console.log('FIX3 SKIP: sprint10 redirect not found');}

console.log('Size: '+orig+' -> '+code.length+' (+'+(code.length-orig)+')');
fs.writeFileSync(f,code);
console.log('SAVED: '+f);
