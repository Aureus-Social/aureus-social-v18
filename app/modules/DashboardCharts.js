"use client";
// ═══════════════════════════════════════════════════════════
// Item #16 — DASHBOARD RECHARTS
// Interactive charts: mass salariale, CP distribution, 
// effectifs evolution, costs vs budget
// ═══════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';

const GOLD='#c6a34e',GOLD_L='#e2c878',GREEN='#22c55e',RED='#ef4444',BLUE='#3b82f6';

// Mini SVG Chart components (no external deps needed)
function MiniLineChart({data=[],width=280,height=80,color=GOLD,label=''}){
  if(!data.length)return null;
  const max=Math.max(...data),min=Math.min(...data);
  const range=max-min||1;
  const points=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*height*0.85-height*0.075}`).join(' ');
  const areaPoints=points+` ${width},${height} 0,${height}`;
  return React.createElement('div',{style:{position:'relative'}},
    React.createElement('svg',{width,height,viewBox:`0 0 ${width} ${height}`},
      React.createElement('defs',null,
        React.createElement('linearGradient',{id:`g-${label}`,x1:'0',y1:'0',x2:'0',y2:'1'},
          React.createElement('stop',{offset:'0%',stopColor:color,stopOpacity:'0.15'}),
          React.createElement('stop',{offset:'100%',stopColor:color,stopOpacity:'0'})
        )
      ),
      React.createElement('polygon',{points:areaPoints,fill:`url(#g-${label})`}),
      React.createElement('polyline',{points,fill:'none',stroke:color,strokeWidth:'2',strokeLinejoin:'round',strokeLinecap:'round'})
    )
  );
}

function MiniBarChart({data=[],width=280,height=80,color=GOLD}){
  if(!data.length)return null;
  const max=Math.max(...data)||1;
  const barW=Math.min(24,(width/data.length)*0.7);
  const gap=(width-barW*data.length)/(data.length+1);
  return React.createElement('svg',{width,height,viewBox:`0 0 ${width} ${height}`},
    data.map((v,i)=>{
      const h=(v/max)*height*0.85;
      const x=gap+(barW+gap)*i;
      return React.createElement('rect',{key:i,x,y:height-h,width:barW,height:h,rx:3,fill:color,opacity:0.7+0.3*(v/max)});
    })
  );
}

function DonutChart({segments=[],size=120}){
  const total=segments.reduce((s,v)=>s+v.value,0)||1;
  const r=size/2-8;const cx=size/2;const cy=size/2;
  let cum=0;
  const paths=segments.map((seg,i)=>{
    const start=cum/total*Math.PI*2-Math.PI/2;
    cum+=seg.value;
    const end=cum/total*Math.PI*2-Math.PI/2;
    const large=seg.value/total>0.5?1:0;
    const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start);
    const x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);
    return React.createElement('path',{key:i,d:`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,fill:seg.color,opacity:0.85});
  });
  return React.createElement('svg',{width:size,height:size,viewBox:`0 0 ${size} ${size}`},
    paths,
    React.createElement('circle',{cx,cy,r:r*0.55,fill:'#0a0e1a'})
  );
}

export function DashboardChartsV2({salaryHistory=[],cpDistribution=[],effectifs=[],budgetData={}}){
  const months=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const salData=salaryHistory.length?salaryHistory:Array.from({length:12},()=>Math.round(80000+Math.random()*40000));
  const effData=effectifs.length?effectifs:Array.from({length:12},(_,i)=>Math.round(35+i*1.5+Math.random()*3));
  const cpData=cpDistribution.length?cpDistribution:[
    {label:'CP 200',value:45,color:GOLD},{label:'CP 124',value:20,color:GREEN},
    {label:'CP 140',value:15,color:BLUE},{label:'Autres',value:20,color:'#9333ea'}
  ];
  const cardStyle={padding:'24px',borderRadius:'16px',border:'1px solid rgba(198,163,78,.06)',background:'rgba(255,255,255,.01)'};
  const titleStyle={fontSize:'11px',color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'16px'};

  return React.createElement('div',{className:'stagger',style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}},
    React.createElement('div',{style:cardStyle,className:'hover-glow'},
      React.createElement('div',{style:titleStyle},'Masse salariale mensuelle'),
      React.createElement('div',{style:{fontSize:'28px',fontWeight:300,color:GOLD_L,marginBottom:'8px'}},'€ '+(salData[salData.length-1]||0).toLocaleString('fr-BE')),
      React.createElement(MiniLineChart,{data:salData,width:320,height:80,color:GOLD,label:'sal'})
    ),
    React.createElement('div',{style:cardStyle,className:'hover-glow'},
      React.createElement('div',{style:titleStyle},'Effectifs (ETP)'),
      React.createElement('div',{style:{fontSize:'28px',fontWeight:300,color:GREEN,marginBottom:'8px'}},effData[effData.length-1]||0),
      React.createElement(MiniBarChart,{data:effData,width:320,height:80,color:GREEN})
    ),
    React.createElement('div',{style:cardStyle,className:'hover-glow'},
      React.createElement('div',{style:titleStyle},'Répartition par CP'),
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'20px'}},
        React.createElement(DonutChart,{segments:cpData,size:100}),
        React.createElement('div',null,cpData.map((c,i)=>
          React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}},
            React.createElement('div',{style:{width:8,height:8,borderRadius:'50%',background:c.color}}),
            React.createElement('span',{style:{fontSize:'12px',color:'#999'}},c.label+' ('+c.value+'%)')
          )
        ))
      )
    ),
    React.createElement('div',{style:cardStyle,className:'hover-glow'},
      React.createElement('div',{style:titleStyle},'Budget vs Réel'),
      React.createElement('div',{style:{display:'flex',gap:'16px',alignItems:'flex-end'}},
        React.createElement('div',null,
          React.createElement('div',{style:{fontSize:'10px',color:'#555'}},'Budget'),
          React.createElement('div',{style:{fontSize:'22px',color:'#999'}},'€ '+(budgetData.budget||120000).toLocaleString('fr-BE'))
        ),
        React.createElement('div',null,
          React.createElement('div',{style:{fontSize:'10px',color:'#555'}},'Réel'),
          React.createElement('div',{style:{fontSize:'22px',color:GOLD_L}},'€ '+(budgetData.actual||108500).toLocaleString('fr-BE'))
        ),
        React.createElement('div',{style:{padding:'4px 12px',borderRadius:'50px',fontSize:'11px',fontWeight:600,background:'rgba(34,197,94,.1)',color:GREEN}},
          '↓ '+Math.round(((budgetData.budget||120000)-(budgetData.actual||108500))/(budgetData.budget||120000)*100)+'%'
        )
      ),
      React.createElement('div',{style:{marginTop:'12px',height:'6px',borderRadius:'3px',background:'rgba(198,163,78,.08)',overflow:'hidden'}},
        React.createElement('div',{style:{height:'100%',width:Math.min(100,((budgetData.actual||108500)/(budgetData.budget||120000))*100)+'%',borderRadius:'3px',background:`linear-gradient(90deg,${GOLD},${GOLD_L})`,transition:'width .6s'}})
      )
    )
  );
}

export default DashboardChartsV2;
