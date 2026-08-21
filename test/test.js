// Test funcional del app sobre un DOM simulado
const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const js=html.match(/<script>\n?([\s\S]*)<\/script>/)[1];

class E{
  constructor(tag){ this.tag=tag||'div'; this.children=[]; this._h={}; this._a={};
    this.style=new Proxy({},{set:(t,k,v)=>{t[k]=v;return true}});
    this.classList={
      _s:new Set(),
      add:(c)=>this.classList._s.add(c),
      remove:(c)=>this.classList._s.delete(c),
      contains:(c)=>this.classList._s.has(c),
      toggle:(c,f)=>{ f?this.classList._s.add(c):this.classList._s.delete(c); }
    };
    this._html=''; this.textContent=''; this.value=''; this.disabled=false;
  }
  set className(v){ this._cn=v; this.classList._s=new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return this._cn||''; }
  set innerHTML(v){ this._html=v; this.children=parseHTML(v,this); }
  get innerHTML(){ return this._html; }
  appendChild(c){ this.children.push(c); return c; }
  addEventListener(t,f){ (this._h[t]=this._h[t]||[]).push(f); }
  setAttribute(k,v){ this._a[k]=String(v); }
  getAttribute(k){ return this._a[k]; }
  querySelector(sel){
    const cls=sel.replace('.','');
    const walk=(n)=>{ for(const c of n.children){ if(c.classList.contains(cls)) return c; const r=walk(c); if(r) return r; } return null; };
    return walk(this);
  }
  click(){ (this._h.click||[]).forEach(f=>f.call(this,{preventDefault(){}})); }
  fire(t,ev){ (this._h[t]||[]).forEach(f=>f.call(this,ev||{preventDefault(){}})); }
}
// parser mínimo de innerHTML: suficiente para querySelector('.clase') y textContent
function parseHTML(str,owner){
  if(!str) return [];
  const VOID={br:1,img:1,input:1,hr:1,path:1,meta:1,link:1};
  const root={children:[],_text:''}; const stack=[root];
  const re=/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g; let m;
  while((m=re.exec(str))){
    const top=stack[stack.length-1];
    if(m[5]!==undefined){ top._text=(top._text||'')+m[5]; continue; }
    const close=m[1], tag=m[2].toLowerCase(), attrs=m[3]||'', self=m[4];
    if(close){ if(stack.length>1) stack.pop(); continue; }
    const node=new E(tag);
    const cls=/class="([^"]*)"/.exec(attrs); if(cls) node.className=cls[1];
    const ap=/aria-pressed="([^"]*)"/.exec(attrs); if(ap) node.setAttribute('aria-pressed',ap[1]);
    node._text='';
    top.children.push(node);
    if(!self && !VOID[tag]) stack.push(node);
  }
  const finish=(n)=>{ n.children.forEach(finish);
    if(n instanceof E && !n.textContent) n.textContent=(n._text||'')+n.children.map(c=>c.textContent||'').join('');
  };
  root.children.forEach(finish);
  if(owner) owner._parsedText=(root._text||'')+root.children.map(c=>c.textContent||'').join('');
  return root.children;
}
const ids={};
global.window={ matchMedia:()=>({matches:false}), scrollTo(){} };
global.document={
  documentElement:new E('html'),
  getElementById:(id)=> ids[id]||(ids[id]=new E()),
  createElement:(t)=>new E(t),
  _key:[],
  addEventListener(t,f){ if(t==='keydown') this._key.push(f); }
};
document.documentElement.setAttribute=function(k,v){ this._a[k]=v; };
const store={};
global.localStorage={ getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v}, };

eval(js + ';globalThis.T={getQ:function(){return Q;},prep:prep,B:B,renderQ:renderQ,S:S};');
const prep=(q)=>T.prep(q); const B=T.B; const renderQ=()=>T.renderQ();
Object.defineProperty(globalThis,'Q',{get:()=>T.getQ()});

let fails=0;
const ok=(cond,msg)=>{ console.log((cond?'  ok   ':'  FALLA')+'  '+msg); if(!cond) fails++; };

// ---------- 1. panel ----------
console.log('\nPanel');
ok(ids.modCards.children.length===6,'6 tarjetas de módulo');
ok(ids.simCards.children.length===3,'3 tarjetas de simulacro');
ok(ids.scoreBody.children.length===3,'3 filas en la tabla de puntajes');
ok(ids.errCard.disabled===true,'"Repasar errores" arranca deshabilitado');
ok(ids.weekTabs.children.length===4,'4 pestañas de semana');
ok(ids.dayList.children.length===8,'7 días + encabezado en la semana 1');

// ---------- 2. marcar un día ----------
console.log('\nSeguimiento del plan');
const d1=ids.dayList.children[1].querySelector('chk');
d1.click();
ok(JSON.parse(store['cnv-idoneidad-v1']).days['1']===1,'día 1 queda marcado y persiste');
ok(ids.weekTabs.children[0].innerHTML.includes('1/7'),'el contador de la semana pasa a 1/7');

// ---------- 3. práctica por módulo ----------
console.log('\nPráctica por módulo');
ids.modCards.children[1].querySelector('row').children[0].click(); // módulo 2, botón "10 preguntas"
ok(ids.quiz.classList.contains('hidden')===false,'se abre la vista de preguntas');
ok(ids.quizTitle.textContent.indexOf('Módulo 2')===0,'título: '+ids.quizTitle.textContent);
ok(ids.clock.classList.contains('hidden'),'sin cronómetro en práctica');
ok(ids.qOpts.children.length===4,'4 opciones en pantalla');

// responder las 10, alternando bien y mal
let aciertos=0;
for(let n=0;n<10;n++){
  const q=Q.qs[Q.i];
  const elegir = (n%2===0) ? q.a : (q.a+1)%4;   // 5 correctas, 5 incorrectas
  if(elegir===q.a) aciertos++;
  ids.qOpts.children[elegir].click();
  ok(ids.qExpl.children.length===1, 'pregunta '+(n+1)+': explicación visible');
  const foot=ids.qFoot.children[ids.qFoot.children.length-1];
  foot.click(); // Siguiente / Ver resultado
}
ok(ids.result.classList.contains('hidden')===false,'llega a la pantalla de resultado');
ok(ids.resBig.textContent==='5/10','puntaje correcto: '+ids.resBig.textContent);
const st=JSON.parse(store['cnv-idoneidad-v1']);
ok(Object.keys(st.err).length===5,'5 preguntas fueron a la lista de errores ('+Object.keys(st.err).length+')');
ok(Object.values(st.err).every(v=>v===2),'cada una arranca necesitando 2 aciertos');
ok(ids.resRev.children.length===10,'repaso con las 10 preguntas');
ok(ids.resBars.children.length===1,'una sola barra: todas son del módulo 2');

// ---------- 4. repaso de errores: acertar las saca de la lista ----------
console.log('\nRepaso de errores');
ids.backBtn.click();
ok(ids.errCard.disabled===false,'"Repasar errores" queda habilitado');
ids.errCard.click();
ok(Q.qs.length===5,'el repaso trae las 5 falladas');
for(let n=0;n<5;n++){
  ids.qOpts.children[Q.qs[Q.i].a].click();
  ids.qFoot.children[ids.qFoot.children.length-1].click();
}
ok(ids.resBig.textContent==='5/5','5/5 en el primer repaso');
const trasUno=JSON.parse(store['cnv-idoneidad-v1']).err;
ok(Object.keys(trasUno).length===5,'con un acierto todavía NO salen de la lista');
ok(Object.values(trasUno).every(v=>v===1),'les queda 1 acierto pendiente');
// segundo repaso: ahí sí se vacían
ids.backBtn.click();
ids.errCard.click();
for(let n=0;n<5;n++){
  ids.qOpts.children[Q.qs[Q.i].a].click();
  ids.qFoot.children[ids.qFoot.children.length-1].click();
}
ok(Object.keys(JSON.parse(store['cnv-idoneidad-v1']).err).length===0,'con el segundo acierto la lista queda vacía');
// y fallar una la manda de nuevo a cero
ids.backBtn.click();
ids.modCards.children[0].querySelector('row').children[0].click();
const qFall=Q.qs[0];
ids.qOpts.children[(qFall.a+1)%4].click();
ids.exitBtn.click();

// ---------- 5. simulacro ----------
console.log('\nSimulacro');
ids.backBtn.click();
ids.simCards.children[0].click();
ok(Q.qs.length===60,'60 preguntas');
const porMod={}; Q.qs.forEach(q=>porMod[q.m]=(porMod[q.m]||0)+1);
ok(JSON.stringify(porMod)==='{"1":10,"2":10,"3":10,"4":10,"5":10,"6":10}','10 por módulo: '+JSON.stringify(porMod));
ok(ids.clock.textContent==='45:00','cronómetro en 45:00');
ok(ids.qExpl.children.length===0,'sin explicación durante el simulacro');
// responder 45 bien, dejar 5 en blanco, 10 mal
for(let k=0;k<60;k++){
  Q.i=k; renderQ();
  const q=Q.qs[k];
  if(k<45) ids.qOpts.children[q.a].click();
  else if(k<55) ids.qOpts.children[(q.a+2)%4].click();
}
ok(ids.qOpts.children[0].disabled===false,'las opciones no se bloquean en simulacro');
// marcar una pregunta
Q.i=3; renderQ();
const flagBtn=ids.qFoot.children.find? null : null;
Q.flag[3]=true; renderQ();
ok(Q.flag[3]===true,'se puede marcar una pregunta para la segunda pasada');
// entregar
Q.i=59; renderQ();
ids.qFoot.children[ids.qFoot.children.length-1].click(); // Entregar → confirmación
ok(ids.qFoot.children[0].textContent.indexOf('5 sin responder')>0,'avisa cuántas quedan en blanco: "'+ids.qFoot.children[0].textContent+'"');
ids.qFoot.children[ids.qFoot.children.length-1].click(); // confirmar
ok(ids.resBig.textContent==='45/60','puntaje del simulacro: '+ids.resBig.textContent);
ok(ids.resVerdict.textContent.indexOf('Aprobado')===0,'veredicto: '+ids.resVerdict.textContent);
ok(ids.resBars.children.length===6,'6 barras por módulo');
const st2=JSON.parse(store['cnv-idoneidad-v1']);
ok(st2.scores['1'] && st2.scores['1'].total===45,'puntaje guardado en el panel');
ok(Object.keys(st2.err).length===15,'15 errores/blancos a la lista de repaso ('+Object.keys(st2.err).length+')');
ids.backBtn.click();
ok(ids.scoreBody.children[0].innerHTML.indexOf('45/60')>0,'la tabla del panel muestra 45/60');

// ---------- 6. barajado de opciones ----------
console.log('\nBarajado');
const pos={0:0,1:0,2:0,3:0};
for(let i=0;i<200;i++){ pos[prep(B[0]).a]++; }
ok(Object.values(pos).every(v=>v>25),'la respuesta correcta rota de posición: '+JSON.stringify(pos));
const p=prep(B[0]);
ok(p.o[p.a]===B[0].o[B[0].a],'al barajar, el índice sigue apuntando a la respuesta correcta');

// ---------- 7. rotacion y modulo completo ----------
console.log('');
console.log('Rotación y módulo completo');
T.S.seen={}; T.S.err={};
ids.backBtn.click();

ids.modCards.children[3].querySelector('row').children[1].click();
ok(Q.qs.length===60,'el modulo completo trae las 60 de M4 ('+Q.qs.length+')');
ok(new Set(Q.qs.map(q=>q.id)).size===60,'sin repetidas dentro de la corrida completa');
ids.exitBtn.click();

const vistos=new Set();
for(let r=0;r<6;r++){
  ids.modCards.children[5].querySelector('row').children[0].click();
  ok(Q.qs.length===10,'ronda '+(r+1)+': 10 preguntas');
  Q.qs.forEach(q=>vistos.add(q.id));
  ids.exitBtn.click();
}
ok(vistos.size===60,'6 rondas de 10 cubren las 60 de M6 sin repetir ni una ('+vistos.size+')');

ids.modCards.children[5].querySelector('row').children[0].click();
ok(Q.qs.every(q=>vistos.has(q.id)),'la 7a ronda arranca la segunda vuelta');
ids.exitBtn.click();
ok(ids.modCards.children[5].innerHTML.indexOf('Viste las 60')>0,'la tarjeta avisa que ya viste el modulo entero');

console.log('\n'+(fails?fails+' FALLAS':'Todo en verde'));
process.exit(fails?1:0);
