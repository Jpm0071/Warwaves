const $=id=>document.getElementById(id);
const R=[
 {n:'Comum',c:'#9aa5a8',m:1.0,p:50},{n:'Raro',c:'#4aa3ff',m:1.5,p:28},{n:'Épico',c:'#b266ff',m:2.4,p:14},
 {n:'Lendário',c:'#ffb02e',m:3.5,p:6},{n:'Mítico',c:'#ff4d5e',m:5.0,p:2}
];
const T={
 katana:{n:'Katana',ic:'🗡️',d:24,cd:.35,range:3.8,arc:Math.PI*.75},
 gun:{n:'Pistola',ic:'🔫',d:14,cd:.22,range:22},
 triple:{n:'Katana Tripla',ic:'⚔️',d:32,cd:.5,range:4.5,arc:Math.PI*2},
 axe:{n:'Machado de Guerra',ic:'🪓',d:48,cd:.7,range:4.0,arc:Math.PI*.9},
 daggers:{n:'Adagas Duplas',ic:'🔪',d:16,cd:.16,range:3.0,arc:Math.PI*.6},
 spear:{n:'Lança de Vento',ic:'🔱',d:35,cd:.42,range:6.0,arc:Math.PI*.3},
 club:{n:'Clava de Madeira',ic:'🪵',d:30,cd:.5,range:3.4,arc:Math.PI*.7},
 bow:{n:'Arco Elemental',ic:'🏹',d:26,cd:.28,range:25},
 glaive:{n:'Glaive do Trovão',ic:'⚡',d:45,cd:.4,range:4.8,arc:Math.PI*.9},
 scythe:{n:'Foice Celestial',ic:'🌙',d:65,cd:.6,range:5.5,arc:Math.PI*1.1},
 chaos:{n:'Lâmina do Caos',ic:'🌀',d:90,cd:.45,range:5.8,arc:Math.PI*2}
};
const ACC=[
 {id:'acc_accel',ic:'💍',n:'Anel da Aceleração',r:0,desc:'+20% Velocidade de Ataque e Movimento',dmg:1.1,hp:0,spd:1.2,coins:1.0},
 {id:'acc_impact',ic:'💥',n:'Anel do Impacto',r:0,desc:'+25% Dano de Impacto',dmg:1.25,hp:0,spd:1.0,coins:1.0},
 {id:'acc_wind',ic:'🧣',n:'Capa de Vento',r:1,desc:'+30% Velocidade de Movimento',dmg:1.0,hp:0,spd:1.3,coins:1.0},
 {id:'acc_emerald',ic:'📿',n:'Colar de Esmeralda',r:1,desc:'+50 HP Max',dmg:1.0,hp:50,spd:1.0,coins:1.0},
 {id:'acc_vamp',ic:'🩸',n:'Amuleto do Vampiro',r:2,desc:'+20% Dano e +40 HP',dmg:1.2,hp:40,spd:1.0,coins:1.0},
 {id:'acc_greed',ic:'💰',n:'Brinco da Ganância',r:2,desc:'+60% Moedas Ganhas',dmg:1.0,hp:0,spd:1.0,coins:1.6},
 {id:'acc_shadow',ic:'🦇',n:'Manto Sombrio',r:3,desc:'+35% Dano e +20% Velocidade',dmg:1.35,hp:0,spd:1.2,coins:1.1},
 {id:'boss_abyssal',ic:'👑',n:'Coroa do General Abissal (Boss Onda 5)',r:4,desc:"Exclusivo: +50% Dano, +60 HP e Aura D'água",dmg:1.5,hp:60,spd:1.1,coins:1.2},
 {id:'boss_titan',ic:'🛡️',n:'Escudo de Titânio (Boss Onda 10)',r:4,desc:'Exclusivo: +180 HP Max e +25% Proteção/Dano',dmg:1.25,hp:180,spd:1.0,coins:1.2},
 {id:'boss_flame',ic:'🔥',n:'Orbe Inflamado (Boss Onda 15)',r:4,desc:'Exclusivo: +75% Dano Flamejante',dmg:1.75,hp:30,spd:1.15,coins:1.3},
 {id:'boss_scepter',ic:'🪄',n:'Cetro da Sobrevivência (Boss Onda 20+)',r:4,desc:'Exclusivo Mítico: +100% Dano, +120 HP, +100% Moedas',dmg:2.0,hp:120,spd:1.25,coins:2.0}
];
const MT=[['ore','Minério de Ferro','⛏️'],['crystal','Cristal Azul','💎'],['essence','Essência Arcana','🔮'],['core','Núcleo de Chefe','🔥']];
const K=Object.keys(T),COST=80;
// Modos extras (as recompensas não mudam, para não disparar o anti-cheat)
const EXTRA_MODES=[
 {id:'glass',ic:'🔮',n:'Canhão de Vidro',c:'#b266ff',d:'Você causa 2x de dano, mas recebe 3x de dano.'},
 {id:'frenzy',ic:'⚡',n:'Frenesi',c:'#ffb02e',d:'Inimigos 60% mais rápidos e surgem bem mais depressa.'},
 {id:'giants',ic:'🗿',n:'Gigantes',c:'#ff8a2a',d:'Metade dos inimigos, mas enormes, com 3x de vida e mais fortes.'},
 {id:'darkness',ic:'🌑',n:'Escuridão',c:'#4aa3ff',d:'Visão muito reduzida. Os inimigos surgem do nada.'},
 {id:'drain',ic:'🩸',n:'Sede de Sangue',c:'#ff4d5e',d:'Sua vida drena 2 por segundo. Cada inimigo morto cura 4 de vida.'},
 {id:'swarm',ic:'🐝',n:'Enxame',c:'#3ddc97',d:'3x mais inimigos, menores e frágeis, surgindo em rajadas.'}
];
// Bônus de moedas nos modos difíceis (o anti-cheat do SQL já comporta esses valores)
const MODE_COIN={hardcore:2,glass:1.5,frenzy:1.5,giants:1.5,darkness:1.5,drain:1.5,swarm:1.5};
const modeCoin=()=>MODE_COIN[S.gameMode]||1;
const dmgIn=()=>S.gameMode==='glass'?3:1;
let S,E=[],B=[],F=[],spinning=0,down=0,mx=0,my=0,spinG=null,tm=0;
const keys={};let ADM=0,god=0;

// Configuração do Supabase (Substitua pelas suas chaves)
const SUPABASE_URL = 'https://xfinsqomhhvwemoyqnsn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CtQ01GYjDmLF904cFn3NMg_csDfdmIh';
let supabaseClient = null;
if(window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: window.localStorage, storageKey: 'lamina-ondas-auth' }
    });
  } catch(e){}
}
// Sessão persistente: o F5 mantém o login; só expira após 12h sem jogar.
const SESSION_MAX_IDLE = 12*60*60*1000;
const ACTIVITY_KEY = 'lamina-ondas-last-active';
function touchActivity(){ try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch(e){} }
function idleTooLong(){
  try {
    const t = Number(localStorage.getItem(ACTIVITY_KEY));
    return !!t && (Date.now() - t) > SESSION_MAX_IDLE;
  } catch(e){ return false; }
}
function hasStoredSession(){ try { return !!localStorage.getItem('lamina-ondas-auth'); } catch(e){ return false; } }
['pointerdown','keydown'].forEach(ev=>addEventListener(ev, ()=>{ if(typeof currentUser!=='undefined' && currentUser) touchActivity(); }, {passive:true}));
setInterval(()=>{ if(typeof currentUser!=='undefined' && currentUser) touchActivity(); }, 60000);
addEventListener('beforeunload', ()=>{ if(typeof currentUser!=='undefined' && currentUser) touchActivity(); });
// Detecta retorno do link de recuperação de senha enviado por email
if(supabaseClient){
  supabaseClient.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY') setTimeout(()=>newPassScreen(),0);
  });
}
let currentUser = null;
const ADMIN_EMAIL = 'pedromartinsjoao35@gmail.com';
let playerName = 'Jogador';
try { playerName = localStorage.getItem('playerName') || 'Jogador'; } catch(e){}
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let adminGranted = false, admList = [];
function isOwner(){
  return !!(currentUser && currentUser.email && currentUser.email_confirmed_at &&
    currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}
function isAdmin(){ return isOwner() || adminGranted; }
async function loadAdminRole(){
  adminGranted = false;
  if(currentUser && supabaseClient && !isOwner() && currentUser.email){
    try {
      const { data } = await supabaseClient.from('admins').select('email')
        .eq('email', currentUser.email.toLowerCase()).maybeSingle();
      adminGranted = !!data;
    } catch(e){}
  }
  syncAdmin();
}
async function admOpen(){ await loadAdminRole(); if(isAdmin()) admShow(); else shop(); }
async function loadAdmList(){
  const box = $('adm_mgr'); if(!box || !isOwner() || !supabaseClient) return;
  const { data, error } = await supabaseClient.from('admins').select('email').order('created_at');
  if(error){ box.innerHTML = '<span style="color:#ff4d5e">Erro: '+esc(error.message)+' (rodou o admins.sql?)</span>'; return; }
  admList = (data||[]).map(r=>r.email);
  box.innerHTML = admList.length
    ? admList.map((e,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span style="overflow:hidden;text-overflow:ellipsis">${esc(e)}</span><button class="g" onclick="admRemove(${i})">Remover</button></div>`).join('')
    : '<span style="color:#8fa39b">Nenhum admin extra.</span>';
}
async function admAdd(){
  if(!isOwner()) return;
  const inp = $('adm_new'), email = inp.value.trim().toLowerCase();
  if(!/^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+$/.test(email)) return alert('Email inválido.');
  if(email === ADMIN_EMAIL.toLowerCase()) return alert('Você já é o dono.');
  const { error } = await supabaseClient.from('admins').insert([{ email, granted_by: currentUser.email }]);
  if(error) return alert(error.code==='23505' ? 'Esse email já é admin.' : 'Erro: '+error.message);
  inp.value=''; loadAdmList();
}
async function admRemove(i){
  if(!isOwner() || !admList[i]) return;
  if(!confirm('Remover admin de '+admList[i]+'?')) return;
  const { error } = await supabaseClient.from('admins').delete().eq('email', admList[i]);
  if(error) return alert('Erro: '+error.message);
  loadAdmList();
}
function syncAdmin(){
  ADM = isAdmin() ? 1 : 0;
  if(!ADM){ god = 0; const a=$('adm'); if(a) a.hidden = true; }
}
function applyUserName(){
  const n = currentUser && currentUser.user_metadata && currentUser.user_metadata.player_name;
  if(n) playerName = n;
}
async function savePlayerName(raw){
  const n = (raw||'').trim().replace(/\s+/g,' ').slice(0,16);
  if(n.length < 2) return nameScreen('O nome precisa ter entre 2 e 16 caracteres.');
  playerName = n;
  try { localStorage.setItem('playerName', n); } catch(e){}
  if(currentUser && supabaseClient){
    const { error } = await supabaseClient.auth.updateUser({ data: { player_name: n } });
    if(error) console.error('Erro ao salvar nome:', error.message);
  }
  S.msg = 'Nome alterado para ' + n + '!';
  shop();
}
function nameScreen(msg){
  const ov = $('ov');
  if(ov){ ov.hidden = false; ov.style.display = 'flex'; }
  $('pn').innerHTML=`<h1>Nome do Jogador</h1><p>${esc(msg||'Escolha o nome que aparecerá no jogo (2 a 16 caracteres).')}</p>
  <div class="row"><input id="pname" type="text" maxlength="16" placeholder="Seu nome..." value="${esc(playerName)}" onkeydown="if(event.key==='Enter')savePlayerName($('pname').value)">
  <button onclick="savePlayerName($('pname').value)">Salvar</button><button class="g" onclick="shop()">Voltar</button></div>`;
  setTimeout(()=>$('pname').focus(),50);
}

// ---------- Cena Three.js ----------
const ren=new THREE.WebGLRenderer({antialias:true});
ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.setSize(innerWidth,innerHeight);
document.body.prepend(ren.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0d1417);scene.fog=new THREE.Fog(0x0d1417,25,65);
const cam=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);cam.position.set(0,18,14);
scene.add(new THREE.AmbientLight(0x9fb8b0,.75));
const sun=new THREE.DirectionalLight(0xdfeaff,.9);sun.position.set(8,20,6);scene.add(sun);
const floor=new THREE.Mesh(new THREE.CircleGeometry(32,64),new THREE.MeshStandardMaterial({color:0x16262a,roughness:.9}));
floor.rotation.x=-Math.PI/2;scene.add(floor);
const edge=new THREE.Mesh(new THREE.TorusGeometry(32,.25,8,80),new THREE.MeshBasicMaterial({color:0x3ddc97}));
edge.rotation.x=Math.PI/2;edge.position.y=.2;scene.add(edge);
const grid=new THREE.GridHelper(64,32,0x24403f,0x1b3033);grid.position.y=.02;scene.add(grid);

// ---------- Geometrias & Modelagem ----------
const X=Math.PI/2,PI=Math.PI;
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(a,b,l,s=8,o=0,t=6.2832)=>new THREE.CylinderGeometry(a,b,l,s,1,false,o,t),CN=(r,l,s=6)=>new THREE.ConeGeometry(r,l,s),TR=(r,t,a=6.2832)=>new THREE.TorusGeometry(r,t,8,24,a),SP=r=>new THREE.SphereGeometry(r,12,10),OC=r=>new THREE.OctahedronGeometry(r);
const M=(g,m,p=[0,0,0],r=[0,0,0],s=null)=>{const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...r);if(s)o.scale.set(...s);return o};
const glowMat=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
const skin=new THREE.MeshStandardMaterial({color:0xe0b48a});

// Jogador
const P=new THREE.Group(),wg=new THREE.Group(),ag=new THREE.Group();
P.add(
 M(CY(.4,.5,1.1,10),new THREE.MeshStandardMaterial({color:0x2f7d5a}),[0,.65,0]),
 M(CY(.52,.52,.1,10),new THREE.MeshStandardMaterial({color:0x1c2228}),[0,.42,0]),
 M(SP(.32),skin,[0,1.5,0]),
 M(new THREE.SphereGeometry(.34,14,8,0,PI*2,0,PI/2),new THREE.MeshStandardMaterial({color:0x3ddc97}),[0,1.55,0]),
 M(CY(.08,.08,.7),skin,[-.48,1.0,.1],[-1,0,.15]),M(CY(.08,.08,.7),skin,[.48,1.0,.1],[-1,0,-.15]),
 M(SP(.1),skin,[-.5,.82,.38]),M(SP(.1),skin,[.5,.82,.38]),
 wg,ag
);
scene.add(P);

function createWeaponMesh(type,col,r=0){
 const g=new THREE.Group(),k=new THREE.Color(col);
 const bl=new THREE.MeshStandardMaterial({color:k,metalness:.85,roughness:.18,emissive:k,emissiveIntensity:.25+.1*r});
 const ed=new THREE.MeshBasicMaterial({color:k.clone().lerp(new THREE.Color(1,1,1),.65)});
 const dk=new THREE.MeshStandardMaterial({color:0x1c2228,metalness:.7,roughness:.4});
 const wd=new THREE.MeshStandardMaterial({color:0x4a2e18,roughness:.8});
 const gd=new THREE.MeshStandardMaterial({color:0xffd24a,metalness:.95,roughness:.15,emissive:0x553300,emissiveIntensity:.3});
 const rd=new THREE.MeshStandardMaterial({color:0xc01830}),hot=new THREE.MeshBasicMaterial({color:0xff0055});
 const add=(...o)=>g.add(...o);
 switch(type){
 case'katana':add(M(BX(.055,.04,1.55),bl,[0,0,1.3]),M(BX(.012,.045,1.5),ed,[.03,0,1.3]),M(CN(.03,.25,4),bl,[0,0,2.18],[X,0,0]),M(CY(.17,.17,.03,16),gd,[0,0,.53],[X,0,0]),M(CY(.04,.04,.5),dk,[0,0,.25],[X,0,0]),M(TR(.045,.012),gd,[0,0,.15]),M(TR(.045,.012),gd,[0,0,.28]),M(TR(.045,.012),gd,[0,0,.4]),M(SP(.06),gd,[0,0,-.02]));break;
 case'gun':add(M(BX(.14,.22,.75),dk,[0,0,.45]),M(BX(.15,.06,.7),bl,[0,.14,.45]),M(CY(.05,.05,.6),bl,[0,.04,1.05],[X,0,0]),M(BX(.12,.4,.16),wd,[0,-.28,.15],[.25,0,0]),M(BX(.04,.05,.5),ed,[.08,0,.5]),M(SP(.07),ed,[0,.04,1.38]),M(BX(.03,.07,.05),gd,[0,.2,.85]));break;
 case'axe':add(M(CY(.045,.045,2.3),wd,[0,0,.95],[X,0,0]),M(CY(.62,.62,.07,18,0,PI),bl,[0,0,1.75]),M(CY(.62,.62,.07,18,0,PI),bl,[0,0,1.75],[0,PI,0]),M(CN(.07,.35,5),gd,[0,0,2.4],[X,0,0]),M(CY(.09,.09,.2),gd,[0,0,1.75],[X,0,0]),M(CY(.07,.07,.12),dk,[0,0,-.2],[X,0,0]),M(CY(.09,.09,.1),gd,[0,0,.5],[X,0,0]));break;
 case'daggers':add(M(CN(.075,1.0,4),bl,[0,0,.95],[X,0,0],[.55,1,1]),M(BX(.28,.05,.06),gd,[0,0,.42]),M(CY(.03,.03,.35),dk,[0,0,.22],[X,0,0]),M(SP(.05),gd,[0,0,.02]),M(SP(.035),ed,[0,0,.42]));break;
 case'spear':add(M(CY(.03,.03,3.2),wd,[0,0,1.0],[X,0,0]),M(CN(.14,.85,4),bl,[0,0,2.95],[X,0,0],[1,1,.3]),M(CY(.07,.07,.25),gd,[0,0,2.5],[X,0,0]),M(CN(.1,.45,8),rd,[0,0,2.25],[-X,0,0]),M(CN(.04,.2,6),gd,[0,0,-.7],[-X,0,0]),M(TR(.12,.012),ed,[0,0,1.6]),M(TR(.12,.012),ed,[0,0,1.9]));break;
 case'club':add(M(CY(.22,.07,1.9,10),wd,[0,0,1.0],[X,0,0]),M(TR(.2,.03),dk,[0,0,1.6]),M(TR(.12,.03),dk,[0,0,.7]),M(SP(.1),ed,[0,0,1.98]));for(let j=0;j<2;j++)for(let i=0;i<8;i++){const a=i*PI/4+j*.4;add(M(CN(.05,.2,5),bl,[Math.sin(a)*.22,Math.cos(a)*.22,1.45+j*.35],[0,0,-a]))};break;
 case'bow':{const arc=new THREE.Group();arc.add(M(TR(.85,.04,PI),bl,[0,0,0],[0,0,-X]),M(CY(.06,.06,.4),wd,[.85,0,0]),M(SP(.06),gd,[0,.85,0]),M(SP(.06),gd,[0,-.85,0]),M(CY(.008,.008,1.7),ed,[0,0,0]));arc.rotation.y=-X;arc.position.z=.3;add(arc,M(CY(.012,.012,1.3),wd,[0,0,.8],[X,0,0]),M(CN(.04,.15),ed,[0,0,1.5],[X,0,0]),M(BX(.1,.01,.18),rd,[0,0,.2]));break}
 case'glaive':add(M(CY(.035,.035,2.6),wd,[0,0,.8],[X,0,0]),M(CY(.55,.55,.05,18,0,PI),bl,[0,0,2.45],[0,0,0],[1,1,1.9]),M(CN(.06,.5,5),bl,[0,0,3.65],[X,0,0]),M(CN(.07,.6,5),bl,[0,0,-.75],[-X,0,0]),M(TR(.1,.015),ed,[0,0,1.4]),M(TR(.1,.015),ed,[0,0,1.65]),M(SP(.09),ed,[0,0,1.95]),M(CY(.07,.07,.2),gd,[0,0,1.8],[X,0,0]));break;
 case'scythe':add(M(CY(.04,.04,2.8),wd,[0,0,.9],[X,0,0]),M(TR(1.1,.09,2.2),bl,[-1.1,0,2.3],[X,0,0]),M(TR(1.18,.025,2.2),ed,[-1.1,0,2.3],[X,0,0]),M(SP(.11),ed,[0,0,2.35]),M(CY(.08,.08,.18),gd,[0,0,2.1],[X,0,0]),M(CN(.05,.3,5),gd,[0,0,-.6],[-X,0,0]));break;
 case'chaos':add(M(BX(.26,.07,2.2),bl,[0,0,1.5]),M(CN(.13,.5,4),bl,[0,0,2.85],[X,0,0],[1,1,.3]),M(BX(.06,.09,1.9),hot,[0,0,1.5]),M(SP(.17),hot,[0,0,.55]),M(BX(.9,.1,.12),gd,[0,0,.35]),M(CY(.05,.05,.5),dk,[0,0,.05],[X,0,0]),M(SP(.1),hot,[0,0,-.22]));for(let s=-1;s<=1;s+=2){add(M(CN(.06,.3,5),gd,[s*.45,.15,.35]));for(let i=0;i<5;i++)add(M(CN(.07,.32-i*.02,4),bl,[s*.22,0,.9+i*.38],[0,0,-s*X]))};[[.5,.4,1.2],[-.5,-.3,1.8],[.45,-.35,2.3],[-.4,.4,.8]].forEach(p=>add(M(OC(.08),hot,p)));break;
 }
 if(r>=2){const bb=new THREE.Box3().setFromObject(g),c=bb.getCenter(new THREE.Vector3()),z=bb.getSize(new THREE.Vector3());add(M(SP(1),glowMat(k),[c.x,c.y,c.z],[0,0,0],[z.x*.5+.1,z.y*.5+.1,z.z*.55]))}
 return g;
}

function setModel(){
 wg.clear();wg.position.set(0,0,0);wg.rotation.y=0;
 const w=S.inv[S.eq],c=new THREE.Color(R[w.r].c),mk=(t,p,ry=0)=>{const m=createWeaponMesh(t,c,w.r);m.position.set(...p);m.rotation.y=ry;wg.add(m)};
 if(w.t==='triple'){mk('katana',[.5,.85,.3],-.2);mk('katana',[.5,1.0,.3]);mk('katana',[.5,1.15,.3],.2)}
 else if(w.t==='daggers'){mk('daggers',[.5,.85,.3]);mk('daggers',[-.5,.85,.3])}
 else mk(w.t,[.5,.85,.3]);
}

function setAcc(){
 ag.clear();spinG=null;if(S.eqAcc===null)return;
 const a=ACC[S.eqAcc],bc={boss_abyssal:0x2fb6ff,boss_titan:0xaab8c2,boss_flame:0xff7a18,boss_scepter:0xffd24a};
 const c=new THREE.Color(bc[a.id]||R[a.r].c);
 const mt=new THREE.MeshStandardMaterial({color:c,metalness:.8,roughness:.2,emissive:c,emissiveIntensity:.5}),gd=new THREE.MeshStandardMaterial({color:0xffd24a,metalness:.95,roughness:.15,emissive:0x553300,emissiveIntensity:.3}),gl=glowMat(c),sp=new THREE.Group(),add=(...o)=>ag.add(...o),lh=[-.5,.84,.36];
 const orbit=(n,rad,y,geo,mat)=>{for(let i=0;i<n;i++){const t=i/n*PI*2;sp.add(M(geo,mat,[Math.sin(t)*rad,y,Math.cos(t)*rad]))}};
 switch(a.id){
 case'acc_accel':add(M(TR(.12,.03),gd,lh,[.57,0,0]),M(TR(.16,.015),gl,lh,[.57,0,0]),M(CN(.05,.5,5),gl,[-.5,.95,-.1],[-X,0,0]),M(CN(.04,.4,5),gl,[-.4,.75,-.1],[-X,0,0]));break;
 case'acc_impact':add(M(TR(.12,.03),gd,lh,[.57,0,0]),M(OC(.08),mt,[-.5,.97,.33],[0,0,0],[1,1.4,1]),M(TR(.2,.012),gl,lh,[.57,0,0]));break;
 case'acc_wind':add(M(BX(.85,1.3,.05),mt,[0,.85,-.46],[.12,0,0]),M(TR(.36,.04),gd,[0,1.22,0],[X,0,0]),M(CN(.3,.9,3),gl,[-.35,.5,-.7],[-2.4,0,0]),M(CN(.3,.9,3),gl,[.35,.5,-.7],[-2.4,0,0]));orbit(3,.7,.35,TR(.12,.015),gl);break;
 case'acc_emerald':add(M(TR(.33,.02),gd,[0,1.2,.05],[X,0,0]),M(OC(.1),mt,[0,1.02,.37],[0,0,0],[1,1.5,1]),M(SP(.04),gd,[0,1.2,.37]));break;
 case'acc_vamp':add(M(TR(.33,.02),gd,[0,1.2,.05],[X,0,0]),M(SP(.1),mt,[0,.98,.38],[0,0,0],[1,1.35,1]),M(CN(.06,.28,3),gd,[.17,1.02,.36],[0,0,-1.1]),M(CN(.06,.28,3),gd,[-.17,1.02,.36],[0,0,1.1]));break;
 case'acc_greed':for(const s of[-1,1])add(M(TR(.07,.015),gd,[s*.34,1.42,0],[0,X,0]),M(CY(.06,.06,.015,12),gd,[s*.34,1.28,0],[0,0,X]));orbit(4,.8,1.0,CY(.08,.08,.02,12),gd);break;
 case'acc_shadow':add(M(new THREE.CylinderGeometry(.36,.65,1.05,14,1,true),new THREE.MeshStandardMaterial({color:0x2a1040,side:2}),[0,.85,-.05]),M(SP(.17),mt,[-.42,1.25,0],[0,0,0],[1,.6,1]),M(SP(.17),mt,[.42,1.25,0],[0,0,0],[1,.6,1]));orbit(3,.85,.6,SP(.07),gl);break;
 case'boss_abyssal':add(M(TR(.3,.04),gd,[0,1.9,0],[X,0,0]));for(let i=0;i<6;i++){const t=i*PI/3;add(M(CN(.05,.3,5),gd,[Math.sin(t)*.3,2.05,Math.cos(t)*.3]),M(SP(.04),mt,[Math.sin(t)*.3,2.22,Math.cos(t)*.3]))};orbit(5,.85,1.1,SP(.1),gl);break;
 case'boss_titan':add(M(CY(.5,.5,.09,6),mt,[-.66,1.0,.5],[X,0,0]),M(TR(.5,.04),gd,[-.66,1.0,.55]),M(SP(.1),gd,[-.66,1.0,.58]),M(SP(.2),mt,[-.45,1.28,0],[0,0,0],[1,.6,1]),M(SP(.2),mt,[.45,1.28,0],[0,0,0],[1,.6,1]));orbit(3,.9,1.2,OC(.12),mt);break;
 case'boss_flame':add(M(SP(.2),mt,[0,2.4,0]),M(SP(.34),gl,[0,2.4,0]));for(let i=0;i<6;i++){const t=i*PI/3;sp.add(M(CN(.07,.3,5),mt,[Math.sin(t)*.4,2.4,Math.cos(t)*.4]))};break;
 case'boss_scepter':add(M(TR(.4,.03),gl,[0,1.98,0],[X,0,0]),M(TR(.4,.015),gd,[0,1.98,0],[X,0,0]),M(CY(.04,.04,1.8),gd,[0,1.5,-.6]),M(SP(.15),mt,[0,2.5,-.6]),M(TR(.22,.03,4.7),gd,[0,2.5,-.6]));orbit(4,.95,1.3,OC(.09),mt);break;
 }
 ag.add(sp);spinG=sp;
}

// Lobby 3D
const LB=new THREE.Group();scene.add(LB);
const forgeLight=new THREE.PointLight(0xff7a2a,1.4,10);forgeLight.position.set(3.2,1.3,-1.4);
const dkm=new THREE.MeshStandardMaterial({color:0x2a2f36,metalness:.8,roughness:.4}),brick=new THREE.MeshStandardMaterial({color:0x4a2a24,roughness:.9}),hotm=new THREE.MeshBasicMaterial({color:0xff6a1a});
LB.add(forgeLight,M(BX(1.0,.5,.7),dkm,[2.5,.25,-.6]),M(BX(.5,.4,.45),dkm,[2.5,.7,-.6]),M(BX(1.7,.22,.7),dkm,[2.5,1.0,-.6]),M(CN(.25,.7,8),dkm,[3.55,1.0,-.6],[0,0,-X]),M(BX(1.6,1.7,1.2),brick,[4.2,.85,-2.4]),M(BX(1.0,.5,.1),hotm,[4.2,.8,-1.78]),M(BX(.5,.5,.5),brick,[4.2,2.0,-2.4]),M(TR(3,.04),new THREE.MeshBasicMaterial({color:0x3ddc97}),[0,.05,0],[X,0,0]));
const embers=[];for(let i=0;i<14;i++){const e=M(SP(.05),hotm,[3.2+Math.random(),1+Math.random(),-1.6]);e.userData.o=Math.random()*6;embers.push(e);LB.add(e)}
const portal=new THREE.Group();portal.position.set(-3.6,1.9,-3.2);
portal.add(M(TR(1.5,.12),new THREE.MeshBasicMaterial({color:0x3ddc97})),M(new THREE.CircleGeometry(1.4,32),new THREE.MeshBasicMaterial({color:0x3ddc97,transparent:true,opacity:.2,side:2})),M(TR(1.1,.04),glowMat(0x3ddc97)));
LB.add(portal);

// Utilidades de combate
function getDmg(w){
 const base=T[w.t].d*R[w.r].m*(1+.18*(w.lv-1));
 return Math.round(base*(S&&S.eqAcc!==null?ACC[S.eqAcc].dmg:1)*(S&&S.buffT>0?2:1)*(S&&S.gameMode==='glass'?2:1));
}
function getMaxHP(){let hp=S?S.mhp:100;if(S&&S.eqAcc!==null)hp+=ACC[S.eqAcc].hp;return hp}
const needXP=w=>40+35*w.lv;

// Preço de venda balanceado (retorna 40% base + bônus de nível)
function price(w){
 return Math.floor((COST * 0.4 + (w.lv - 1) * 5) * (1 + w.r * 0.75));
}

// IA DE ATAQUES DO BOSS (Curta, Média e Longa Distância)
function updateBossBehavior(boss, dt) {
 boss.attackCd = (boss.attackCd || 0) - dt;
 if (boss.attackCd > 0) return;

 const dx = P.position.x - boss.m.position.x;
 const dz = P.position.z - boss.m.position.z;
 const dist = Math.hypot(dx, dz) || 1;

 if (dist < 4.0) {
  // Curta distância: Pisotão / AoE
  const fx = new THREE.Mesh(new THREE.RingGeometry(.5, 4, 32), new THREE.MeshBasicMaterial({color: 0xff0055, side: 2, transparent: true, opacity: .6}));
  fx.rotation.x = -Math.PI / 2;
  fx.position.set(boss.m.position.x, .1, boss.m.position.z);
  scene.add(fx);
  F.push({m: fx, l: .3});
  if (dist < 4.2 && !god && S.it <= 0) { S.hp -= 25*dmgIn(); S.it = .4; }
  boss.attackCd = 2.0;
 } else if (dist <= 10.0) {
  // Média distância: Carga Rápida
  boss.m.position.x += (dx / dist) * 6;
  boss.m.position.z += (dz / dist) * 6;
  boss.attackCd = 2.5;
 } else {
  // Longa distância: Projétil Perseguidor
  const bm = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 8), new THREE.MeshBasicMaterial({color: 0xff7a18}));
  bm.position.set(boss.m.position.x, 1.2, boss.m.position.z);
  scene.add(bm);
  B.push({m: bm, vx: (dx / dist) * 18, vz: (dz / dist) * 18, l: 3.0, d: 15, isHostile: true});
  boss.attackCd = 3.0;
 }
}

// Supabase - Autenticação & Progresso
function freshProgress(){return {coins:COST,wave:0,lvl:1,inv:[{t:'katana',r:0,lv:1,xp:0}],accs:[],mats:{ore:0,crystal:0,essence:0,core:0}}}
async function registerPlayer(email, password) {
  if(!supabaseClient) return alert("Supabase não configurado no script.js!");
  email=(email||'').trim();
  if(!email||!password) return alert("Preencha email e senha.");
  if(password.length<6) return alert("A senha deve ter pelo menos 6 caracteres.");
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert("Erro ao registrar: " + error.message);
  if(!data.session){
    return alert("Conta criada! Confirme seu email pelo link que enviamos e depois faça login.");
  }
  currentUser = data.user;
  applyUserName();
  // Conta nova SEMPRE começa do zero (o anti-cheat recusa progresso injetado).
  const { error: e2 } = await supabaseClient.from('jogadores').upsert({ id: data.user.id, ...freshProgress() });
  if(e2) console.error("Erro ao criar jogador:", e2.message);
  await loadAdminRole();
  touchActivity();
  await carregarProgresso();
  alert("Conta criada com sucesso! O progresso de convidado não é transferido para a conta nova.");
  shop();
}

async function loginPlayer(email, password) {
  if(!supabaseClient) return alert("Supabase não configurado no script.js!");
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert("Erro no login: " + error.message);
  
  currentUser = data.user;
  applyUserName();
  await loadAdminRole();
  touchActivity();
  await carregarProgresso();
  alert("Bem-vindo de volta, " + playerName + "!");
  shop();
}

async function forgotPassword(email) {
  if(!supabaseClient) return alert("Supabase não configurado no script.js!");
  email=(email||'').trim();
  if(!email) return alert("Digite seu email para receber o link de recuperação.");
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return alert("Erro ao enviar email: " + error.message);
  alert("Se o email estiver cadastrado, você receberá um link para redefinir a senha. Verifique também o spam.");
  loginScreen();
}

async function updatePassword(p1, p2) {
  if(!supabaseClient) return alert("Supabase não configurado no script.js!");
  if(!p1 || p1.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");
  if(p1 !== p2) return alert("As senhas não coincidem.");
  const { data, error } = await supabaseClient.auth.updateUser({ password: p1 });
  if (error) return alert("Erro ao redefinir senha: " + error.message);
  currentUser = data.user;
  applyUserName();
  await loadAdminRole();
  history.replaceState(null, '', window.location.pathname);
  await carregarProgresso();
  alert("Senha redefinida com sucesso!");
  shop();
}

let saving=false, savePending=false;
function sameState(d){
  try{
    if(Number(d.coins)!==S.coins||Number(d.wave)!==S.wave||Number(d.lvl)!==S.lvl) return false;
    if(!Array.isArray(d.inv)||d.inv.length!==S.inv.length) return false;
    for(let i=0;i<S.inv.length;i++){const a=d.inv[i],b=S.inv[i];
      if(a.t!==b.t||Number(a.r)!==b.r||Number(a.lv)!==b.lv||Number(a.xp)!==b.xp) return false;}
    if(!Array.isArray(d.accs)||d.accs.length!==S.accs.length||d.accs.some((x,i)=>Number(x)!==S.accs[i])) return false;
    for(const k in S.mats) if(!d.mats||Number(d.mats[k])!==S.mats[k]) return false;
    return true;
  }catch(e){return false}
}
// Salva em fila (um por vez). Se o servidor/anti-cheat reverter o save, o cliente ressincroniza
// em vez de seguir com um estado "fantasma" que causaria strikes em cascata.
async function guardarProgresso() {
  if (!currentUser || !supabaseClient) return;
  if(saving){ savePending=true; return; }
  saving=true;
  try{
    const { data, error } = await supabaseClient.from('jogadores').upsert({
      id: currentUser.id,
      coins: S.coins, wave: S.wave, lvl: S.lvl,
      inv: S.inv, accs: S.accs, mats: S.mats,
      updated_at: new Date()
    }).select().maybeSingle();
    if (error) console.error("Erro ao guardar:", error.message);
    else if (!data || !sameState(data)){
      console.warn("Servidor não aceitou o save; ressincronizando.");
      await carregarProgresso(true);
    }
  } finally {
    saving=false;
    if(savePending){ savePending=false; setTimeout(guardarProgresso,1200); }
  }
}

function applyRow(d){
  S.coins=Number(d.coins); S.wave=Number(d.wave); S.lvl=Number(d.lvl);
  S.inv=(Array.isArray(d.inv)&&d.inv.length)?d.inv:freshProgress().inv;
  S.accs=Array.isArray(d.accs)?d.accs.map(Number):[];
  S.mats=Object.assign({ore:0,crystal:0,essence:0,core:0},d.mats||{});
  S.mhp=100+10*(S.lvl-1);
  if(S.eq>=S.inv.length) S.eq=0;
  if(S.eqAcc!==null&&!S.accs.includes(S.eqAcc)) S.eqAcc=null;
  S.hp=getMaxHP();
  setModel(); setAcc();
}

async function carregarProgresso(resync) {
  if (!currentUser || !supabaseClient) return;
  const { data, error } = await supabaseClient.from('jogadores')
    .select('*').eq('id', currentUser.id).maybeSingle();
  if (error) { console.error("Erro ao carregar:", error.message); return; }
  if (!data) {
    // Conta sem linha (ex.: criada com confirmação de email): cria o estado inicial.
    const ini=freshProgress();
    const { error: e2 } = await supabaseClient.from('jogadores').upsert({ id: currentUser.id, ...ini });
    if(e2) console.error("Erro ao criar jogador:", e2.message);
    applyRow(ini);
  } else applyRow(data);
  if(resync){
    S.msg='O servidor reverteu uma ação suspeita e seu progresso foi ressincronizado.';
    if(S.mode==='shop') shop();
  }
}

// Restaura sessão ao recarregar a página
async function restoreSession(){
  if(!supabaseClient) return;
  if(/type=recovery/.test(location.hash)) return;
  try{
    if(idleTooLong()){
      // Mais de 12h sem jogar: encerra a sessão e pede login de novo.
      await supabaseClient.auth.signOut();
      try { localStorage.removeItem(ACTIVITY_KEY); } catch(e){}
      restoring=false; if(S && S.mode==='title') title();
      return;
    }
    const { data } = await supabaseClient.auth.getSession();
    const u = data && data.session && data.session.user;
    if(!u || !S || S.mode!=='title'){ restoring=false; if(S && S.mode==='title') title(); return; }
    currentUser=u; applyUserName(); await loadAdminRole(); await carregarProgresso();
    touchActivity();
    restoring=false;
    if(S.mode==='title') shop();
  }catch(e){ console.error(e); restoring=false; if(S && S.mode==='title') title(); }
}

// Forja
const cs=c=>Object.entries(c).map(([k,v])=>MT.find(m=>m[0]===k)[2]+v).join(' ');
const can=c=>Object.entries(c).every(([k,v])=>S.mats[k]>=v);
const pay=c=>{for(const k in c)S.mats[k]-=c[k]};
const upC=w=>{const c={ore:3+2*w.lv};if(w.lv>=6)c.crystal=Math.ceil(w.lv/3);if(w.lv>=12)c.essence=Math.ceil(w.lv/6);return c};
const evC=[0,{ore:20,crystal:3},{crystal:8,essence:2},{essence:6,crystal:10},{core:3,essence:10}];
function forgeUp(i){const w=S.inv[i],c=upC(w);if(w.lv>=100||!can(c))return;pay(c);w.lv++;S.msg=`${T[w.t].n} aprimorada para o nível ${w.lv}!`;guardarProgresso();shop()}
function forgeEv(i){const w=S.inv[i];if(w.r>=4||!can(evC[w.r+1]))return;pay(evC[w.r+1]);w.r++;setModel();S.msg=`${T[w.t].n} evoluiu para ${R[w.r].n}!`;guardarProgresso();shop()}
function forgeAcc(){
 const pool=[0,1,2,3,4,5,6].filter(i=>!S.accs.includes(i)),c={ore:15,crystal:4};
 if(!pool.length||!can(c))return;pay(c);const a=pool[Math.random()*pool.length|0];S.accs.push(a);S.msg='Você forjou: '+ACC[a].n+'!';guardarProgresso();shop();
}
function drop(boss){
 const m=S.mats,r=Math.random,w=S.wave;
 if(boss){m.core+=1+(r()*2|0);m.essence+=2+(r()*3|0);m.crystal+=3+(r()*3|0);m.ore+=10;return}
 if(r()<.4)m.ore+=1+(r()*2|0);if(w>=3&&r()<.14)m.crystal++;if(w>=7&&r()<.06)m.essence++;
}

// ---------- Estado do Jogo ----------
function newGame(keep){
 E.forEach(e=>scene.remove(e.m));B.forEach(b=>scene.remove(b.m));F.forEach(f=>scene.remove(f.m));E=[];B=[];F=[];
 const o=keep?S:null;
 S={wave:0,lvl:1,hp:100,mhp:100,coins:o?o.coins:COST,inv:o?o.inv:[{t:'katana',r:0,lv:1,xp:0}],eq:o?o.eq:0,
  accs:o?o.accs:[],eqAcc:o?o.eqAcc:null,mats:o?o.mats:{ore:0,crystal:0,essence:0,core:0},
  mode:'shop',gameMode:o?o.gameMode:'classic',tab:'roleta',spawn:0,spT:0,cd:0,it:0,swing:0,dur:.2,buffT:0,timeLimit:0,
  msg:o?'Bem-vindo de volta ao lobby!':'Gire a roleta, forje suas armas e escolha seu modo de jogo.'};
 P.position.set(0,0,0);setModel();setAcc();
 if(keep)shop();else title();
}
let restoring = hasStoredSession() && !idleTooLong();
function title(){
 S.mode='title';
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; ov.className = 'lb'; }
 if(restoring){ $('pn').innerHTML=`<h1 style="font-size:42px">Lâmina das Ondas</h1><p>Restaurando sua sessão...</p>`; return; }
 $('pn').innerHTML=`<h1 style="font-size:42px">Lâmina das Ondas</h1><p>Enfrente hordas, derrube chefes de raid e forje lendas.</p>
 <div class="row">
   <button style="font-size:18px;padding:12px 24px" onclick="shop()">Jogar como Convidado</button>
   <button class="g" style="font-size:18px;padding:12px 24px" onclick="loginScreen()">Entrar / Registrar</button>
 </div>`;
}

function loginScreen(){
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; }
 $('pn').innerHTML=`<h1>Conta de Jogador</h1><p>Conecte-se para salvar seu progresso na nuvem via Supabase.</p>
 <div style="display:flex; flex-direction:column; gap:10px; max-width:300px; margin-bottom:16px;">
   <input id="l_email" type="email" placeholder="Seu Email...">
   <input id="l_pass" type="password" placeholder="Sua Senha...">
 </div>
 <div class="row">
   <button onclick="loginPlayer($('l_email').value, $('l_pass').value)">Entrar</button>
   <button class="f" onclick="registerPlayer($('l_email').value, $('l_pass').value)">Criar Conta</button>
   <button class="g" onclick="title()">Voltar</button>
 </div>
 <p style="margin:0"><a href="#" onclick="forgotScreen();return false" style="color:#3ddc97;font-size:13px">Esqueci minha senha</a></p>
`;
}

function forgotScreen(){
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; }
 $('pn').innerHTML=`<h1>Recuperar Senha</h1><p>Informe o email da sua conta. Enviaremos um link para você criar uma nova senha.</p>
 <div style="display:flex; flex-direction:column; gap:10px; max-width:300px; margin-bottom:16px;">
   <input id="f_email" type="email" placeholder="Seu Email..." value="${esc(($('l_email')&&$('l_email').value)||'')}">
 </div>
 <div class="row">
   <button onclick="forgotPassword($('f_email').value)">Enviar link</button>
   <button class="g" onclick="loginScreen()">Voltar</button>
 </div>`;
}

function newPassScreen(){
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; ov.className = ''; }
 $('pn').innerHTML=`<h1>Nova Senha</h1><p>Digite e confirme sua nova senha.</p>
 <div style="display:flex; flex-direction:column; gap:10px; max-width:300px; margin-bottom:16px;">
   <input id="n_pass" type="password" placeholder="Nova senha (mín. 6 caracteres)...">
   <input id="n_pass2" type="password" placeholder="Confirme a nova senha...">
 </div>
 <div class="row">
   <button onclick="updatePassword($('n_pass').value, $('n_pass2').value)">Salvar nova senha</button>
 </div>`;
}

function shop(){
 S.mode='shop';const tb=S.tab;
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; ov.className = 'lb'; }
 P.position.set(0,0,0);
 const l=S.last;
 const wc=(i,x)=>{const it=S.inv[i];return `<div class="card" style="--c:${R[it.r].c}"><b>${T[it.t].ic} ${T[it.t].n}</b><span>${R[it.r].n} · Nível ${it.lv} · Dano ${getDmg(it)}</span><i><u style="width:${it.xp/needXP(it)*100}%"></u></i>${x}</div>`};
 let body;
 if(tb==='roleta')body=`
  <div id="slot" style="--c:${l?R[l.r].c:'#ffffff33'}">${l?`${T[l.t].ic} ${T[l.t].n} (${R[l.r].n})`:'Roleta pronta'}</div>
  <div class="row"><button id="sp" onclick="spin()" ${S.coins<COST?'disabled':''}>Girar roleta (${COST} moedas)</button></div>
  <div class="rt">Chances: ${R.map(r=>`<span style="color:${r.c}">${r.n} ${r.p}%</span>`).join(', ')}</div>`;
 else if(tb==='forja')body=`
  <p>Inimigos soltam ⛏️ minério, 💎 cristais e 🔮 essências. Chefes soltam 🔥 núcleos.</p>
  <h3>Armas</h3><div class="grid">${S.inv.map((it,i)=>{const u=upC(it),e=evC[it.r+1];return wc(i,
   `<button class="f" ${can(u)&&it.lv<100?'':'disabled'} onclick="forgeUp(${i})">Aprimorar +1 (${cs(u)})</button>
    <button class="g" ${it.r<4&&can(e)?'':'disabled'} onclick="forgeEv(${i})">${it.r>=4?'Raridade máxima':`Evoluir para ${R[it.r+1].n} (${cs(e)})`}</button>`)}).join('')}</div>
  <h3>Acessórios</h3><div class="grid"><div class="card" style="--c:#ffb02e"><b>🧿 Forjar acessório</b><span>Sorteia um acessório comum que você ainda não tem.</span>
   <button class="f" ${can({ore:15,crystal:4})&&S.accs.filter(a=>a<7).length<7?'':'disabled'} onclick="forgeAcc()">Forjar (${cs({ore:15,crystal:4})})</button></div></div>`;
 else if(tb==='modos')body=`
  <h3>Selecione o Modo de Jogo</h3>
  <div class="grid">
   <div class="card" style="--c:${S.gameMode==='classic'?'#3ddc97':'#8fa39b'}"><b>⚔️ Clássico / Raid</b><span>Ondas contínuas com Chefes a cada 5 ondas.</span><button class="${S.gameMode==='classic'?'':'g'}" onclick="S.gameMode='classic';shop()">Ativar</button></div>
   <div class="card" style="--c:${S.gameMode==='survival'?'#3ddc97':'#8fa39b'}"><b>♾️ Sobrevivência</b><span>Hordas infinitas sem pausas para descansar.</span><button class="${S.gameMode==='survival'?'':'g'}" onclick="S.gameMode='survival';shop()">Ativar</button></div>
   <div class="card" style="--c:${S.gameMode==='bossrush'?'#3ddc97':'#8fa39b'}"><b>👹 Boss Rush</b><span>Enfrente apenas Chefes de Raid seguidos!</span><button class="${S.gameMode==='bossrush'?'':'g'}" onclick="S.gameMode='bossrush';shop()">Ativar</button></div>
   <div class="card" style="--c:${S.gameMode==='timeattack'?'#3ddc97':'#8fa39b'}"><b>⏱️ Contratempo</b><span>Derrote o máximo de alvos em 120 segundos.</span><button class="${S.gameMode==='timeattack'?'':'g'}" onclick="S.gameMode='timeattack';shop()">Ativar</button></div>
   <div class="card" style="--c:${S.gameMode==='hardcore'?'#ff4d5e':'#8fa39b'}"><b>💀 Hardcore</b><span>Vida cravada em 1 HP. Um golpe é a morte.</span><button class="${S.gameMode==='hardcore'?'':'g'}" onclick="S.gameMode='hardcore';shop()">Ativar</button></div>
   ${EXTRA_MODES.map(m=>`<div class="card" style="--c:${S.gameMode===m.id?m.c:'#8fa39b'}"><b>${m.ic} ${m.n}</b><span>${m.d}</span><button class="${S.gameMode===m.id?'':'g'}" onclick="S.gameMode='${m.id}';shop()">Ativar</button></div>`).join('')}
  </div>`;
 else body=`
  <h3>Suas armas</h3><div class="grid">${S.inv.map((it,i)=>wc(i,
   `<button class="${i===S.eq?'':'g'}" ${i===S.eq?'disabled':''} onclick="equip(${i})">${i===S.eq?'Equipada':'Equipar'}</button>
    <button class="g" ${i===S.eq||S.inv.length<2?'disabled':''} onclick="sell(${i})">Vender (${price(it)})</button>`)).join('')}</div>
  <h3>Seus acessórios</h3><div class="grid">${S.accs.length?S.accs.map(ai=>{const ac=ACC[ai];return `<div class="card" style="--c:${R[ac.r].c}"><b>${ac.ic} ${ac.n}</b><span>${R[ac.r].n}</span><span>${ac.desc}</span>
   <button class="${S.eqAcc===ai?'':'g'}" onclick="equipAcc(${ai})">${S.eqAcc===ai?'Desequipar':'Equipar'}</button></div>`}).join(''):'<p style="grid-column:1/-1">Nenhum acessório. Derrote chefes ou use a forja.</p>'}</div>`;
 $('pn').innerHTML=`
  <h1>${S.wave?'Onda '+S.wave+' concluída':'Lobby'}</h1><p>${S.msg}</p>
  <div class="row"><button onclick="go()">Entrar na onda ${S.wave+1}</button><button class="g" onclick="codeScreen()">Código</button><button class="g" onclick="nameScreen()">✏️ ${esc(playerName)}</button>${ADM?'<button class="f" onclick="admOpen()">Painel ADM</button>':''}<b style="margin-left:auto">Moedas: ${S.coins}</b></div>
  <div class="mats">${MT.map(m=>`<span title="${m[1]}">${m[2]} ${S.mats[m[0]]}</span>`).join('')}</div>
  <div class="row" style="margin:0;gap:2px">${[['roleta','Roleta'],['forja','Forja'],['modos','Modos de Jogo'],['inv','Inventário']].map(t=>`<button class="t ${tb===t[0]?'on':''}" onclick="S.tab='${t[0]}';shop()">${t[1]}</button>`).join('')}</div>
  ${body}`;
}
function equip(i){S.eq=i;setModel();shop()}
function equipAcc(i){S.eqAcc=S.eqAcc===i?null:i;setAcc();shop()}
function sell(i){if(S.inv.length<2||i===S.eq||spinning)return;const p=price(S.inv[i]);S.coins+=p;S.inv.splice(i,1);if(i<S.eq)S.eq--;S.msg='Arma vendida por '+p+' moedas.';guardarProgresso();shop()}

function rollR(){let n=Math.random()*100,a=0;for(let i=0;i<5;i++){a+=R[i].p;if(n<a)return i}return 0}
function spin(forceHigh){
 if(spinning||(S.coins<COST&&!forceHigh))return;
 if(forceHigh){S.tab='roleta';shop()}
 spinning=1;if(!forceHigh)S.coins-=COST;
 const res={t:K[Math.random()*K.length|0],r:forceHigh?(2+Math.random()*3|0):rollR(),lv:1,xp:0};
 let i=0,dl=50;const slot=$('slot');
 const step=()=>{
  const last=i>=15,f=last?res:{t:K[Math.random()*K.length|0],r:Math.random()*5|0};
  slot.textContent=T[f.t].ic+' '+T[f.t].n+' '+R[f.r].n;slot.style.setProperty('--c',R[f.r].c);
  if(!last){i++;dl*=1.12;setTimeout(step,dl)}else{
   S.inv.push(res);S.last=res;
   if(getDmg(res)>getDmg(S.inv[S.eq])){S.eq=S.inv.length-1;setModel();S.msg='Nova arma mais forte equipada automaticamente!'}
   else S.msg='Arma guardada no inventário.';
   spinning=0;guardarProgresso();shop();
  }
 };step();
}

function codeScreen(msg){
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; }
 $('pn').innerHTML=`<h1>Resgatar código</h1><p>${msg||'Digite um código para resgatar buffs.'}</p>
 <div class="row"><input id="cd" type="text" placeholder="Código..." onkeydown="if(event.key==='Enter')useCode()"><button onclick="useCode()">Ativar</button>
 <button class="g" onclick="shop()">Voltar</button></div>`;
 setTimeout(()=>$('cd').focus(),50);
}
function usedCodes(){try{return JSON.parse(localStorage.getItem('usedCodes')||'[]')}catch(e){return[]}}
function markCode(c){try{const u=usedCodes();u.push(c);localStorage.setItem('usedCodes',JSON.stringify(u))}catch(e){}}
function useCode(){
 const code=$('cd').value.trim().toLowerCase();
 if(code!=='supersaiajin'&&['moedas!','mestre','sortegrande'].includes(code)){if(usedCodes().includes(code))return codeScreen('Esse código já foi usado.');if(code==='sortegrande'&&spinning)return;markCode(code)}
 if(code==='moedas!'){S.coins+=1500;S.inv[S.eq].xp+=300;S.msg='Buff "moedas!": +1500 moedas!';shop()}
 else if(code==='supersaiajin'){S.buffT=25;S.msg='Buff "supersaiajin": 2x dano e super velocidade por 25s!';shop()}
 else if(code==='mestre'){S.inv[S.eq].lv+=3;S.msg='Buff "mestre": +3 níveis na arma!';shop()}
 else if(code==='sortegrande')spin(true);
 else codeScreen('Código incorreto.');
}
function admOff(){
  const a=$('adm');
  if(a){ a.hidden = true; a.style.display = 'none'; }
}
function killAll(){E.forEach(e=>scene.remove(e.m));E=[];S.spawn=0}
function admShow(){
 if(!isAdmin()){ADM=0;god=0;admOff();return}
 ADM=1;
 const a=$('adm');
 if(a){ a.hidden = false; a.style.display = 'flex'; }
 a.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><b>PAINEL ADM DEVS</b><button class="g" onclick="admOff()">Fechar</button></div>
 <div class="row"><button onclick="S.coins+=2000;shop()">+2000 moedas</button><button onclick="for(const k in S.mats)S.mats[k]+=50;shop()">+50 materiais</button>
 <button onclick="S.hp=getMaxHP()">Vida cheia</button><button onclick="god=!god;this.textContent='Godmode: '+(god?'ON':'OFF')">Godmode: ${god?'ON':'OFF'}</button><button onclick="killAll()">Limpar inimigos</button></div>
 <b>Alterar Modo de Jogo:</b>
 <select id="gmode" onchange="S.gameMode=this.value;shop()">
  <option value="classic" ${S.gameMode==='classic'?'selected':''}>Clássico / Raid</option>
  <option value="survival" ${S.gameMode==='survival'?'selected':''}>Sobrevivência</option>
  <option value="bossrush" ${S.gameMode==='bossrush'?'selected':''}>Boss Rush</option>
  <option value="timeattack" ${S.gameMode==='timeattack'?'selected':''}>Contratempo</option>
  <option value="hardcore" ${S.gameMode==='hardcore'?'selected':''}>Hardcore (1 HP)</option>
  ${EXTRA_MODES.map(m=>`<option value="${m.id}" ${S.gameMode===m.id?'selected':''}>${m.n}</option>`).join('')}
 </select>
 <b style="display:block;margin-top:6px">Salto de Raid:</b>
 <div class="row"><button onclick="jumpRaid(1)">+1 raid</button><button onclick="jumpRaid(5)">+5 raids</button><button onclick="jumpRaid(50)">+50 raids</button></div>
 <b>Dar arma:</b><select id="gt">${K.map(k=>`<option value="${k}">${T[k].n}</option>`).join('')}</select>
 <select id="gr">${R.map((r,i)=>`<option value="${i}">${r.n}</option>`).join('')}</select>
 <input id="glv" type="number" value="1" min="1" max="100"><button onclick="S.inv.push({t:$('gt').value,r:+$('gr').value,lv:+$('glv').value||1,xp:0});shop()">Dar arma</button>
 <b style="display:block;margin-top:6px">Dar acessório:</b><select id="gacc">${ACC.map((ac,i)=>`<option value="${i}">${ac.n}</option>`).join('')}</select>
 <button onclick="if(!S.accs.includes(+$('gacc').value))S.accs.push(+$('gacc').value);shop()">Dar acessório</button>
 ${isOwner()?`<b style="display:block;margin-top:8px;color:#ffb02e">👑 Gerenciar admins (só dono)</b>
 <div class="row" style="margin:0"><input id="adm_new" type="email" placeholder="email do jogador..." onkeydown="if(event.key==='Enter')admAdd()"><button onclick="admAdd()">Dar ADM</button></div>
 <div id="adm_mgr" style="display:flex;flex-direction:column;gap:4px">Carregando...</div>`:''}`;
 a.style.maxHeight='85vh';a.style.overflowY='auto';
 if(isOwner())loadAdmList();
}
function jumpRaid(n){S.wave+=n*5;S.msg=`Avançou +${n*5} ondas.`;shop()}

function go(){
 if(spinning)return;
 S.wave++;
 S.mode='play';
 
 const ov = $('ov');
 if(ov){
   ov.hidden = true;
   ov.style.display = 'none';
 }

 S.spawn=(S.gameMode==='bossrush')?0:(S.gameMode==='giants'?Math.ceil((6+S.wave*2)/2):(S.gameMode==='swarm'?(6+S.wave*2)*3:(6+S.wave*2)));S.spT=.4;
 S.hp=S.gameMode==='hardcore'?1:getMaxHP();
 if(S.gameMode==='timeattack')S.timeLimit=120;
 const isBoss=(S.wave%5===0||S.gameMode==='bossrush');
 if(isBoss)spawnE(1);
 const b=$('banner');b.textContent=isBoss?'Onda '+S.wave+' - CHEFÃO DE RAID!':'Onda '+S.wave;
 b.classList.remove('b');void b.offsetWidth;b.classList.add('b');
}
function spawnE(boss){
 const a=Math.random()*PI*2,s=boss?2.5:(S.gameMode==='giants'?1.8:(S.gameMode==='swarm'?.7:1));
 const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,1),new THREE.MeshStandardMaterial({color:boss?0x8b10af:0x7a1f2b,emissive:0x2a0508}));
 m.scale.setScalar(s);m.position.set(Math.sin(a)*28,.8*s,Math.cos(a)*28);scene.add(m);
 const hp=(30+12*S.wave)*(boss?10:1)*(!boss&&S.gameMode==='giants'?3:1)*(!boss&&S.gameMode==='swarm'?.4:1);
 const spMul=(boss?.6:1)*(S.gameMode==='frenzy'?1.6:1)*(!boss&&S.gameMode==='giants'?.8:1);
 E.push({m,hp,mhp:hp,s,sp:Math.min(2.6+.12*S.wave,5.5)*spMul,boss,attackCd:0});
}
function hit(e,d){
 e.hp-=d;
 const dx=e.m.position.x-P.position.x,dz=e.m.position.z-P.position.z,l=Math.hypot(dx,dz)||1;
 e.m.position.x+=dx/l*.7;e.m.position.z+=dz/l*.7;
 if(e.hp<=0){
  if(e.boss){const d=[7,8,9,10][Math.random()*4|0];if(!S.accs.includes(d))S.accs.push(d);S.coins+=Math.round((200+S.wave*15)*modeCoin())}
  else S.coins+=Math.round((5+S.wave)*(S.eqAcc!==null?ACC[S.eqAcc].coins:1)*modeCoin());
  if(S.gameMode==='drain')S.hp=Math.min(getMaxHP(),S.hp+4);
  drop(e.boss);scene.remove(e.m);E.splice(E.indexOf(e),1);
 }
}
function attack(){
 const w=S.inv[S.eq],t=T[w.t],d=getDmg(w),pa=P.rotation.y;
 S.cd=t.cd;S.swing=S.dur=Math.min(t.cd,.28);
 if(w.t==='gun'||w.t==='bow'){
  const n=w.r>=3?3:1;
  for(let i=0;i<n;i++){
   const a=pa+(i-(n-1)/2)*.16,m=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),new THREE.MeshBasicMaterial({color:R[w.r].c}));
   m.position.set(P.position.x+Math.sin(a)*1.2,1.1,P.position.z+Math.cos(a)*1.2);scene.add(m);
   B.push({m,vx:Math.sin(a)*42,vz:Math.cos(a)*42,l:1.1,d,isHostile:false});
  }return;
 }
 const arc=t.arc||PI*.75;
 const fx=new THREE.Mesh(new THREE.CylinderGeometry(t.range,t.range,.1,32,1,false,-arc/2,arc),new THREE.MeshBasicMaterial({color:R[w.r].c,transparent:true,opacity:.45}));
 fx.position.set(P.position.x,.15,P.position.z);fx.rotation.y=pa;scene.add(fx);F.push({m:fx,l:.18});
 for(const e of E.slice()){
  const dx=e.m.position.x-P.position.x,dz=e.m.position.z-P.position.z;
  if(Math.hypot(dx,dz)>t.range+.5*e.s)continue;
  let df=Math.atan2(dx,dz)-pa;df=Math.atan2(Math.sin(df),Math.cos(df));
  if(Math.abs(df)<=arc/2)hit(e,d);
 }
}
function clearField(){E.forEach(e=>scene.remove(e.m));E=[];B.forEach(b=>scene.remove(b.m));B=[];S.spawn=0}
function endWave(){
 clearField();
 const w=S.inv[S.eq],xp=30+12*S.wave;w.xp+=xp;let up=0;
 while(w.xp>=needXP(w)){w.xp-=needXP(w);w.lv++;up++}
 S.lvl++;S.mhp+=10;S.hp=getMaxHP();S.mats.ore+=2+S.wave;
 const bonus=Math.round((30+10*S.wave)*(S.eqAcc!==null?ACC[S.eqAcc].coins:1)*modeCoin());S.coins+=bonus;
 S.msg=`+${xp} XP para ${T[w.t].n}${up?` (subiu ${up} níveis!)`:''}. Bônus: ${bonus} moedas e ⛏️${2+S.wave}.`;
 guardarProgresso();
 shop();
}
function die(){
 S.mode='dead';
 const ov = $('ov');
 if(ov){ ov.hidden = false; ov.style.display = 'flex'; }
 const fell=S.wave;
 // Perdeu: a corrida zera (onda 1 e nível 1), mas armas, acessórios e materiais ficam.
 S.wave=0;S.lvl=1;S.mhp=100;
 $('pn').innerHTML=`<h1>Você caiu na onda ${fell}!</h1><p>Suas armas, acessórios e materiais foram salvos. A corrida recomeça na onda 1.</p><button onclick="newGame(1)">Voltar ao lobby</button>`;
 guardarProgresso();
}

// Loop Principal
const ray=new THREE.Raycaster(),pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),v3=new THREE.Vector3(),ck=new THREE.Clock();
function loop(){
 requestAnimationFrame(loop);
 let dt = ck.getDelta();
 if (isNaN(dt) || dt > 0.1) dt = 0.016;
 tm += dt;

 if(S && S.mode==='play'){
  if(S.buffT>0)S.buffT-=dt;
  if(S.gameMode==='drain'&&!god)S.hp-=2*dt;
  if(S.gameMode==='timeattack'){
   S.timeLimit-=dt;
   if(S.timeLimit<=0){S.timeLimit=0;endWave();}
  }
  const spd=4.5*(S.eqAcc!==null?ACC[S.eqAcc].spd:1)*(S.buffT>0?1.5:1);
  const ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),l=Math.hypot(ix,iz);
  if(l){P.position.x+=ix/l*spd*1.8*dt;P.position.z+=iz/l*spd*1.8*dt}
  const r=Math.hypot(P.position.x,P.position.z);if(r>29.5){P.position.x*=29.5/r;P.position.z*=29.5/r}
  ray.setFromCamera({x:mx,y:my},cam);if(ray.ray.intersectPlane(pl,v3))P.rotation.y=Math.atan2(v3.x-P.position.x,v3.z-P.position.z);
  S.cd-=dt;S.it-=dt;if(down&&S.cd<=0)attack();
  
  if(S.spawn>0||S.gameMode==='survival'){
   S.spT-=dt;
   if(S.spT<=0){
    spawnE(0);
    if(S.gameMode!=='survival')S.spawn--;
    S.spT=Math.max(.15,.8-.03*S.wave)*(S.gameMode==='frenzy'?.5:(S.gameMode==='swarm'?.4:1));
   }
  }

  for(const e of E.slice()){
   if(e.boss) {
    try { updateBossBehavior(e, dt); } catch(err) { console.error(err); }
   }
   const dx=P.position.x-e.m.position.x,dz=P.position.z-e.m.position.z,d=Math.hypot(dx,dz)||1;
   e.m.position.x+=dx/d*e.sp*dt;e.m.position.z+=dz/d*e.sp*dt;e.m.rotation.y=Math.atan2(dx,dz);
   if(d<1.1*e.s&&S.it<=0){if(!god)S.hp-=(8+S.wave)*(e.s>1?2:1)*dmgIn();S.it=.5;if(S.hp<=0){S.hp=0;die();break}}
  }

  for(const b of B.slice()){
   b.m.position.x+=b.vx*dt;b.m.position.z+=b.vz*dt;b.l-=dt;let gone=b.l<=0;
   if(!gone){
    if(b.isHostile){
     if(Math.hypot(P.position.x-b.m.position.x, P.position.z-b.m.position.z) < 1.0){
      if(!god) S.hp -= b.d*dmgIn();
      gone = true;
     }
    } else {
     for(const e of E){
      if(Math.hypot(e.m.position.x-b.m.position.x,e.m.position.z-b.m.position.z)<.9*e.s){
       hit(e,b.d);gone=1;break;
      }
     }
    }
   }
   if(gone){scene.remove(b.m);B.splice(B.indexOf(b),1)}
  }

  if(S.mode==='play'&&S.hp<=0){S.hp=0;die()}
  if(S.mode==='play'&&S.spawn===0&&E.length===0&&S.gameMode!=='survival'&&S.gameMode!=='timeattack')endWave();
 }

 for(const f of F.slice()){f.l-=dt;f.m.material.opacity=Math.max(0,f.l/.18*.45);if(f.l<=0){scene.remove(f.m);F.splice(F.indexOf(f),1)}}
 if(S&&S.swing>0){S.swing-=dt;const p=1-Math.max(S.swing,0)/S.dur;wg.rotation.y=1.1-2.2*p;if(S.swing<=0)wg.rotation.y=0}
 if(spinG)spinG.rotation.y+=dt*1.6;
 wg.position.y=Math.sin(tm*2.4)*.03;
 if(S){
  const play=S.mode==='play';LB.visible=!play;
  const dark=play&&S.gameMode==='darkness';
  scene.fog.near+=((dark?2:25)-scene.fog.near)*.1;scene.fog.far+=((dark?15:65)-scene.fog.far)*.1;$('hud').style.display=play?'':'none';
  if(play){cam.position.lerp(v3.set(P.position.x,18,P.position.z+14),.1);cam.lookAt(P.position.x,0,P.position.z);hud()}
  else{
   const tx=-1.4+Math.sin(tm*.25)*.6;cam.position.lerp(v3.set(tx,3.1,8.6),.06);cam.lookAt(tx+.1,1.2,0);
   P.rotation.y=Math.sin(tm*.6)*.45;portal.rotation.y=tm*.5;
   forgeLight.intensity=1.3+Math.sin(tm*9)*.25+Math.sin(tm*23)*.1;
   embers.forEach(e=>{const t=(tm*.5+e.userData.o)%1;e.position.y=1+t*2.2;e.position.x+=Math.sin(tm*3+e.userData.o)*.002;e.scale.setScalar(1-t)});
  }
 }
 ren.render(scene,cam);
}
function hud(){
 const w=S.inv[S.eq],maxHp=getMaxHP();
 $('hp').style.width=Math.max(0,S.hp/maxHp*100)+'%';
 $('lv').textContent=`${playerName} · Nível ${S.lvl} | HP: ${Math.ceil(S.hp)} / ${maxHp}`;
 $('wv').textContent=`Onda ${S.wave} (${S.gameMode.toUpperCase()})`;
 $('en').textContent=S.gameMode==='timeattack'?`Tempo: ${Math.ceil(S.timeLimit)}s`:`Inimigos: ${E.length+(S.gameMode==='survival'?'∞':S.spawn)}`;
 $('co').textContent=`Moedas: ${S.coins}`;
 $('mt').textContent=MT.map(m=>m[2]+' '+S.mats[m[0]]).join('  ');
 $('wn').innerHTML=`<span style="color:${R[w.r].c}">${T[w.t].n} (${R[w.r].n})</span> Nv. ${w.lv} | Dano ${getDmg(w)}`;
 $('wx').style.width=w.xp/needXP(w)*100+'%';$('wx').style.setProperty('--c',R[w.r].c);
 $('ac').innerHTML=S.eqAcc!==null?`Acessório: <span style="color:${R[ACC[S.eqAcc].r].c}">${ACC[S.eqAcc].n}</span>`:'Sem acessório';
}

addEventListener('keydown',e=>keys[e.code]=1);addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=-(e.clientY/innerHeight)*2+1});
ren.domElement.addEventListener('pointerdown',()=>down=1);addEventListener('pointerup',()=>down=0);
addEventListener('resize',()=>{ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()});
newGame();loop();restoreSession();