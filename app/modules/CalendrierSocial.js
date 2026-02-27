"use client";
// ═══════════════════════════════════════════════════════════
// Item #19 — CALENDRIER SOCIAL INTERACTIF
// All Belgian social deadlines: ONSS, PP, DmfA, Belcotax, DIMONA
// ═══════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',RED='#ef4444',BLUE='#3b82f6',ORANGE='#f97316';
const MONTHS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const DEADLINES=[
  {day:5,monthly:true,label:'DIMONA corrections',cat:'dimona',color:ORANGE,desc:'Correction DIMONA période précédente'},
  {day:15,monthly:true,label:'Précompte professionnel',cat:'pp',color:RED,desc:'Déclaration PP au SPF Finances (mensuel)'},
  {day:25,quarterly:[3,6,9,12],label:'Cotisations ONSS trimestrielles',cat:'onss',color:BLUE,desc:'Paiement cotisations ONSS du trimestre'},
  {day:28,monthly:true,label:'SEPA virements salaires',cat:'sepa',color:GREEN,desc:'Exécution virements SEPA pain.001'},
  {month:1,day:31,label:'Bilan social dépôt',cat:'bilan',color:'#9333ea',desc:'Dépôt bilan social exercice précédent'},
  {month:2,day:28,label:'Belcotax 281.10',cat:'fisc',color:RED,desc:'Envoi fiches 281.10 au SPF Finances'},
  {month:3,day:31,label:'DmfA T4 année N-1',cat:'dmfa',color:BLUE,desc:'Déclaration DmfA 4e trimestre'},
  {month:6,day:30,label:'DmfA T1',cat:'dmfa',color:BLUE,desc:'Déclaration DmfA 1er trimestre'},
  {month:9,day:30,label:'DmfA T2',cat:'dmfa',color:BLUE,desc:'Déclaration DmfA 2e trimestre'},
  {month:12,day:31,label:'DmfA T3',cat:'dmfa',color:BLUE,desc:'Déclaration DmfA 3e trimestre'},
  {month:5,day:31,label:'Pécule vacances simple',cat:'vacances',color:GREEN,desc:'Paiement pécule vacances simple employés'},
  {month:12,day:20,label:'13ème mois / prime fin année',cat:'prime',color:GOLD,desc:'Calcul et paiement prime de fin d\'année'},
];

function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function getFirstDayOfWeek(y,m){return(new Date(y,m,1).getDay()+6)%7;}

export function CalendrierSocial(){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [selected,setSelected]=useState(null);

  const eventsThisMonth=useMemo(()=>{
    const events=[];
    DEADLINES.forEach(d=>{
      if(d.monthly){events.push({...d});}
      else if(d.quarterly&&d.quarterly.includes(month+1)){events.push({...d});}
      else if(d.month===month+1){events.push({...d});}
    });
    return events;
  },[month]);

  const daysInMonth=getDaysInMonth(year,month);
  const firstDay=getFirstDayOfWeek(year,month);
  const today=now.getDate();
  const isCurrentMonth=year===now.getFullYear()&&month===now.getMonth();

  const cellStyle=(day,hasEvent,isPast)=>({
    width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:13,cursor:hasEvent?'pointer':'default',position:'relative',
    background:day===today&&isCurrentMonth?'rgba(198,163,78,.12)':hasEvent?'rgba(198,163,78,.04)':'transparent',
    color:isPast?'#444':day===today&&isCurrentMonth?GOLD:'#999',
    border:hasEvent?'1px solid rgba(198,163,78,.1)':'1px solid transparent',
    transition:'all .2s',
  });

  return React.createElement('div',{style:{maxWidth:800,margin:'0 auto'}},
    React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}},
      React.createElement('button',{onClick:()=>{if(month===0){setMonth(11);setYear(year-1)}else setMonth(month-1)},style:{padding:'8px 16px',borderRadius:8,border:'1px solid rgba(198,163,78,.1)',background:'transparent',color:GOLD,cursor:'pointer'}},'←'),
      React.createElement('div',{style:{fontSize:'18px',fontWeight:600,color:'#e5e5e5'}},MONTHS[month]+' '+year),
      React.createElement('button',{onClick:()=>{if(month===11){setMonth(0);setYear(year+1)}else setMonth(month+1)},style:{padding:'8px 16px',borderRadius:8,border:'1px solid rgba(198,163,78,.1)',background:'transparent',color:GOLD,cursor:'pointer'}},'→')
    ),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',marginBottom:'20px'}},
      ['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d=>React.createElement('div',{key:d,style:{textAlign:'center',fontSize:10,color:'#555',padding:'4px',letterSpacing:'1px'}},d)),
      Array.from({length:firstDay},(_,i)=>React.createElement('div',{key:'e'+i})),
      Array.from({length:daysInMonth},(_,i)=>{
        const day=i+1;
        const dayEvents=eventsThisMonth.filter(e=>e.day===day);
        const isPast=isCurrentMonth&&day<today;
        return React.createElement('div',{key:day,style:cellStyle(day,dayEvents.length>0,isPast),onClick:()=>dayEvents.length&&setSelected(dayEvents)},
          day,
          dayEvents.length>0&&React.createElement('div',{style:{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',display:'flex',gap:2}},
            dayEvents.map((e,j)=>React.createElement('div',{key:j,style:{width:4,height:4,borderRadius:'50%',background:e.color}}))
          )
        );
      })
    ),
    React.createElement('div',{style:{borderTop:'1px solid rgba(198,163,78,.06)',paddingTop:'16px'}},
      React.createElement('div',{style:{fontSize:11,color:'#555',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'12px'}},'Échéances ce mois'),
      eventsThisMonth.length===0?
        React.createElement('div',{style:{textAlign:'center',color:'#444',fontSize:13,padding:'20px'}},'Aucune échéance ce mois'):
        eventsThisMonth.sort((a,b)=>a.day-b.day).map((e,i)=>
          React.createElement('div',{key:i,style:{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.02)'}},
            React.createElement('div',{style:{width:32,height:32,borderRadius:8,background:e.color+'15',color:e.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}},e.day),
            React.createElement('div',null,
              React.createElement('div',{style:{fontSize:13,color:'#e5e5e5',fontWeight:500}},e.label),
              React.createElement('div',{style:{fontSize:11,color:'#666'}},e.desc)
            ),
            React.createElement('div',{style:{marginLeft:'auto',padding:'3px 10px',borderRadius:50,fontSize:9,fontWeight:600,letterSpacing:'.5px',background:e.color+'15',color:e.color}},e.cat.toUpperCase())
          )
        )
    )
  );
}

export default CalendrierSocial;
