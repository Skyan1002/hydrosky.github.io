/* ---- ambient rain on title + closing slides ---- */
function makeRain(el, n){
  if(!el) return;
  for(let i=0;i<n;i++){
    const d = document.createElement('i');
    d.style.left = Math.random()*100 + '%';
    d.style.animationDuration = (0.6 + Math.random()*0.9) + 's';
    d.style.animationDelay = (Math.random()*2) + 's';
    d.style.height = (50 + Math.random()*70) + 'px';
    d.style.opacity = 0.15 + Math.random()*0.35;
    el.appendChild(d);
  }
}
makeRain(document.getElementById('heroRain'), 80);
makeRain(document.getElementById('closeRain'), 60);

/* ---- cell-to-cell routing as an isometric ELEVATION grid ----
   Each cell is a 3-D block raised by its elevation (terrain colour ramp);
   D8 steepest-descent arrows flow from every cell down to its lowest
   neighbour, converging on the outlet -> hydrograph. */
(function(){
  const g = document.querySelector('.routing-grid');
  if(!g) return;
  const ns='http://www.w3.org/2000/svg';
  const cols=6, rows=4, wHalf=33, hHalf=16, zScale=56, minH=10;
  const ox=180, oy=94;                       // iso origin (routing-group coords)

  // deterministic pseudo-random in [0,1)
  const rnd=(r,c)=>{ const v=Math.sin(r*127.1+c*311.7)*43758.5453; return v-Math.floor(v); };

  // elevation: plane draining to front-right (rows-1,cols-1) + terrain noise
  const denom=(rows-1)+(cols-1), elev=[];
  for(let r=0;r<rows;r++){ elev[r]=[]; for(let c=0;c<cols;c++){
    const base=((rows-1-r)+(cols-1-c))/denom;           // 1 back-left -> 0 front-right
    elev[r][c]=Math.max(0,Math.min(1, base*0.7 + rnd(r,c)*0.32));
  }}
  let omin=2,or=0,oc=0;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) if(elev[r][c]<omin){omin=elev[r][c];or=r;oc=c;}

  const top=(r,c)=>({ x: ox+(c-r)*wHalf, y: oy+(c+r)*hHalf - (elev[r][c]*zScale+minH) });

  // terrain colour ramp: low green -> tan -> brown high
  const stops=[[60,140,86],[206,182,98],[150,98,64]];
  const L=(a,b,t)=>a+(b-a)*t;
  const ramp=t=>{ t=Math.max(0,Math.min(1,t)); const s=t*(stops.length-1),i=Math.min(Math.floor(s),stops.length-2),f=s-i,a=stops[i],b=stops[i+1];
    return `rgb(${Math.round(L(a[0],b[0],f))},${Math.round(L(a[1],b[1],f))},${Math.round(L(a[2],b[2],f))})`; };
  const shade=(col,m)=>{ const n=col.match(/\d+/g).map(Number); return `rgb(${Math.round(n[0]*m)},${Math.round(n[1]*m)},${Math.round(n[2]*m)})`; };
  const el=(t,a)=>{ const e=document.createElementNS(ns,t); for(const k in a) e.setAttribute(k,a[k]); g.appendChild(e); return e; };
  const poly=(pts,fill,stroke)=>el('polygon',Object.assign({points:pts.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' '),fill},stroke?{stroke,'stroke-width':0.6}:{}));

  // blocks, painted back-to-front
  const cells=[]; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) cells.push([r,c]);
  cells.sort((A,B)=>(A[0]+A[1])-(B[0]+B[1]));
  cells.forEach(([r,c])=>{
    const t=top(r,c), h=elev[r][c]*zScale+minH;
    const N={x:t.x,y:t.y-hHalf},E={x:t.x+wHalf,y:t.y},S={x:t.x,y:t.y+hHalf},W={x:t.x-wHalf,y:t.y};
    const Sb={x:S.x,y:S.y+h},Eb={x:E.x,y:E.y+h},Wb={x:W.x,y:W.y+h};
    const col=ramp(elev[r][c]);
    poly([W,S,Sb,Wb],shade(col,0.60));                 // left face
    poly([S,E,Eb,Sb],shade(col,0.80));                 // right face
    poly([N,E,S,W],col,'rgba(20,40,60,.35)');          // top face
  });

  // D8 flow arrows (drawn on top of all blocks)
  const nb=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    let lr=-1,lc=-1,le=elev[r][c];
    nb.forEach(([dr,dc])=>{ const nr=r+dr,nc=c+dc; if(nr<0||nc<0||nr>=rows||nc>=cols)return; if(elev[nr][nc]<le){le=elev[nr][nc];lr=nr;lc=nc;} });
    if(lr<0) continue;
    const a=top(r,c),b=top(lr,lc),dx=b.x-a.x,dy=b.y-a.y;
    const x1=a.x+dx*0.16,y1=a.y+dy*0.16,x2=a.x+dx*0.7,y2=a.y+dy*0.7;
    el('line',{x1,y1,x2,y2,stroke:'#fff','stroke-width':3.4,'stroke-linecap':'round'});            // halo
    el('line',{x1,y1,x2,y2,stroke:'#0b66c2','stroke-width':1.8,'marker-end':'url(#flow)'});         // flow
  }

  // outlet marker + animated connector to the hydrograph (left edge ~ 560,111)
  const o=top(or,oc);
  el('circle',{cx:o.x,cy:o.y,r:5,fill:'#0b66c2',stroke:'#fff','stroke-width':1.5});
  const conn=el('path',{d:`M${o.x},${o.y} C${o.x+70},${o.y} 500,111 556,111`,fill:'none',stroke:'#0b66c2','stroke-width':2.5,'marker-end':'url(#arr)','stroke-dasharray':'6 5'});
  conn.style.animation='dash 1s linear infinite';

  // elevation legend (High -> Low)
  const lx=442,ly=24,lw=14,lh=84;
  const grad=el('linearGradient',{id:'elevLeg',x1:0,y1:0,x2:0,y2:1});
  [[0,ramp(1)],[0.5,ramp(0.5)],[1,ramp(0)]].forEach(([off,col])=>{ const s=document.createElementNS(ns,'stop'); s.setAttribute('offset',off); s.setAttribute('stop-color',col); grad.appendChild(s); });
  el('rect',{x:lx,y:ly,width:lw,height:lh,rx:3,fill:'url(#elevLeg)',stroke:'rgba(20,40,60,.3)','stroke-width':0.6});
  const txt=(x,y,t,anchor)=>{ const e=el('text',Object.assign({x,y,'class':'tiny'},anchor?{'text-anchor':anchor}:{})); e.textContent=t; };
  txt(lx-2,ly-6,'elevation'); txt(lx+lw+6,ly+9,'high'); txt(lx+lw+6,ly+lh,'low');
})();

/* ---- count-up animation, triggered when impact slide shows ---- */
function runCounters(scope){
  scope.querySelectorAll('.num[data-target]').forEach(el=>{
    if(el.dataset.done) return;
    el.dataset.done='1';
    const target=+el.dataset.target, suffix=el.dataset.suffix||'';
    const dur=1500, t0=performance.now();
    function step(t){
      const p=Math.min(1,(t-t0)/dur);
      const ease=1-Math.pow(1-p,3);
      const val=Math.round(target*ease);
      el.textContent = val.toLocaleString() + (p===1?suffix:'');
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ---- world choropleth: CREST publications by country (recreated from the lab's 2011–2021 map) ---- */
const WM_PUB={ 'China':29,'USA':27,'Ethiopia':6,'Kenya':6,'Uganda':5,'Namibia':3,
  'Thailand':1,'Argentina':1,'Angola':1,'Bolivia':1,'Brazil':1,'Cambodia':1,'Bhutan':1,'Colombia':1,
  'Ecuador':1,'Egypt':1,'Vietnam':1,'Honduras':1,'India':1,'Laos':1,'Lebanon':1,'Morocco':1,'Myanmar':1,
  'Peru':1,'South Korea':1,'United Republic of Tanzania':1,'Tunisia':1,'Jordan':1 };
(function(){
  const svg=document.getElementById('worldmap'); if(!svg||!window.WORLD_GEOJSON) return;
  const NS='http://www.w3.org/2000/svg';
  const W=1000, latTop=84, latBot=-58, H=(latTop-latBot)/360*W;
  const proj=(lon,lat)=>[ (lon+180)/360*W, (latTop-lat)/(latTop-latBot)*H ];
  const ring=r=>{ let d=''; for(let i=0;i<r.length;i++){ const p=proj(r[i][0],r[i][1]); d+=(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1); } return d+'Z'; };
  const featPath=g=>{ let d=''; if(g.type==='Polygon') g.coordinates.forEach(r=>d+=ring(r)); else if(g.type==='MultiPolygon') g.coordinates.forEach(pp=>pp.forEach(r=>d+=ring(r))); return d; };
  // warm YlOrRd-style ramp: low values stay clearly visible (amber), high -> deep maroon
  const NODATA='#e4ddcf';
  const CS=[[0,[255,238,200]],[1,[255,201,112]],[3,[252,166,72]],[6,[244,114,44]],[12,[222,72,38]],[20,[170,28,42]],[30,[112,15,31]]];
  const col=v=>{ if(v<=0) return NODATA; for(let i=0;i<CS.length-1;i++){ const a=CS[i],b=CS[i+1]; if(v>=a[0]&&v<=b[0]){ const t=(v-a[0])/(b[0]-a[0]),c=a[1],d=b[1]; return `rgb(${Math.round(c[0]+(d[0]-c[0])*t)},${Math.round(c[1]+(d[1]-c[1])*t)},${Math.round(c[2]+(d[2]-c[2])*t)})`; } } const l=CS[CS.length-1][1]; return `rgb(${l[0]},${l[1]},${l[2]})`; };
  const mk=(t,a,p)=>{ const e=document.createElementNS(NS,t); for(const k in a) e.setAttribute(k,a[k]); (p||svg).appendChild(e); return e; };
  const gMap=mk('g',{});
  WORLD_GEOJSON.features.forEach(f=>{ const nm=f.properties&&f.properties.name; const d=featPath(f.geometry); if(!d) return;
    const v=WM_PUB[nm]||0; const path=mk('path',{d:d,'class':'wm-country'+(v>0?' wm-data':''),fill:NODATA},gMap);
    if(v>0){ path.dataset.fill=col(v); path.dataset.v=v; const tt=mk('title',{},path); tt.textContent=nm+': '+v+(v>1?' publications':' publication'); } });
  // colour bar
  const bx=330,bw=340,by=H+22,bh=13;
  const grad=mk('linearGradient',{id:'wmGrad',x1:0,x2:1,y1:0,y2:0});
  [0,1,3,6,12,20,30].forEach(v=>{ const s=document.createElementNS(NS,'stop'); s.setAttribute('offset',(v/30)); s.setAttribute('stop-color',col(v||0.001)); grad.appendChild(s); });
  svg.appendChild(grad);
  mk('text',{x:bx+bw/2,y:by-6,'class':'wm-cbar-lbl','text-anchor':'middle'}).textContent='# publications (2011–2021)';
  mk('rect',{x:bx,y:by,width:bw,height:bh,rx:2,fill:'url(#wmGrad)',stroke:'rgba(20,40,60,.3)','stroke-width':.6});
  [0,1,3,6,10,20,30].forEach(v=>{ const x=bx+(v/30)*bw; mk('line',{x1:x,y1:by+bh,x2:x,y2:by+bh+4,stroke:'#7f93a6','stroke-width':.8}); const t=mk('text',{x:x,y:by+bh+16,'class':'wm-cbar-lbl','text-anchor':'middle'}); t.textContent=v; });
  // key-country pulse markers
  [['USA',-98,39],['China',104,35],['Ethiopia',40,9],['Kenya',38,1],['Peru',-75,-10]].forEach(m=>{ const p=proj(m[1],m[2]); mk('circle',{cx:p[0],cy:p[1],r:4,'class':'wm-mk'}); });
})();
function animateWorldMap(){
  const svg=document.getElementById('worldmap'); if(!svg) return;
  const data=[...svg.querySelectorAll('.wm-data')];
  data.forEach(p=>{ p.style.fill='#e4ddcf'; });
  data.sort((a,b)=>(+b.dataset.v)-(+a.dataset.v));
  data.forEach((p,i)=>{ setTimeout(()=>{ p.style.fill=p.dataset.fill; }, 150+i*45); });
}

/* ---- CREST family tree: faithful recreation of the lab's "Model Development of
   the CREST family" chart; grows left -> right over time ---- */
const FT_X0=40, FT_X1=1300;
const FT_XY={2011:78,2012:158,2013:238,2014:318,2015:398,2016:470,2017:560,2018:680,2019:760,2020:835,2021:918,2022:1000,2023:1085,2024:1150,2025:1212,2026:1295};
function FT_yearAt(x){ const ys=Object.keys(FT_XY).map(Number).sort((a,b)=>a-b);
  if(x<=FT_XY[ys[0]]) return ys[0]; if(x>=FT_XY[ys[ys.length-1]]) return 2026;
  for(let i=0;i<ys.length-1;i++){ const a=ys[i],b=ys[i+1]; if(x>=FT_XY[a]&&x<=FT_XY[b]) return Math.round(a+(b-a)*(x-FT_XY[a])/(FT_XY[b]-FT_XY[a])); }
  return 2026; }
(function(){
  const svg=document.getElementById('famtree'); if(!svg) return;
  const NS='http://www.w3.org/2000/svg';
  const AX=420, EAX=690;                       // main axis y, EF5 sub-axis y
  const FX=y=>FT_XY[y]!=null?FT_XY[y]:(FT_X0+(y-2011)*((FT_X1-FT_X0)/15));
  const mk=(t,a,p)=>{ const e=document.createElementNS(NS,t); for(const k in a) e.setAttribute(k,a[k]); (p||svg).appendChild(e); return e; };
  const FAM={ core:['#f4a6b4','#cf6076'], land:['#ffd9a8','#d98a2b'], wrf:['#bcd4f2','#3f73b8'],
    imap:['#d9b8e8','#8a4fbf'], ai:['#e6c6e8','#9a4f97'], snow:['#cfeaff','#5aa0d6'], vec:['#bfe7da','#3fa890'],
    gw:['#ddd0bf','#9a7f55'], ef5:['#f8cda0','#d9772f'], wof:['#f7b9a8','#d65a3a'], modflow:['#cfe6b8','#6a9e3a'] };
  let FC=FAM.core;
  // defs: arrowheads
  const defs=mk('defs',{});
  const am=(id,w,fill)=>{ const m=mk('marker',{id:id,markerWidth:w,markerHeight:w,refX:w*0.78,refY:w/2,orient:'auto',markerUnits:'userSpaceOnUse'},defs); mk('path',{d:`M0,0 L${w*0.85},${w/2} L0,${w} Z`,fill:fill},m); };
  am('ftA',9,'#5b6b7d'); am('ftAb',15,'#9aa7b5');

  function wrap(str,maxc){ const w=str.split(/\s+/),L=[]; let c=''; w.forEach(t=>{ if((c?c+' '+t:t).length<=maxc) c=c?c+' '+t:t; else { if(c)L.push(c); c=t; } }); if(c)L.push(c); return L; }
  // white description box; where='up' => bottom edge at anchorY, 'down' => top edge at anchorY
  function desc(cx,anchorY,where,text,w,maxc,xrev){ const lines=wrap(text,maxc),lh=11,h=lines.length*lh+9,top=where==='up'?anchorY-h:anchorY;
    const g=mk('g',{'class':'ft-node'}); g.dataset.x=(xrev!=null?xrev:cx);
    mk('rect',{x:cx-w/2,y:top,width:w,height:h,rx:3,fill:'#fff',stroke:'#c9d3df','stroke-width':1},g);
    const tx=mk('text',{x:cx,y:top+12,'class':'ft-d','text-anchor':'middle'},g);
    lines.forEach((ln,i)=>{ const s=document.createElementNS(NS,'tspan'); s.setAttribute('x',cx); s.setAttribute('dy',i?lh:0); s.textContent=ln; tx.appendChild(s); }); }
  // pink version box
  function ver(cx,cy,label,big,xrev){ const w=Math.max(54,label.length*6.6+14),h=big?32:24;
    const g=mk('g',{'class':'ft-node'}); g.dataset.x=(xrev!=null?xrev:cx);
    mk('rect',{x:cx-w/2,y:cy-h/2,width:w,height:h,rx:5,fill:FC[0],stroke:FC[1],'stroke-width':1.3},g);
    const t=mk('text',{x:cx,y:cy,'class':'ft-v','text-anchor':'middle','dominant-baseline':'central'},g); t.textContent=label; return {w,h}; }
  // grey connector path with optional arrowhead
  function conn(d,arrow,xrev){ const p=mk('path',{d:d,fill:'none',stroke:FC[1],'stroke-width':1.8,'class':'ft-grow',pathLength:1}); if(arrow)p.setAttribute('marker-end','url(#ftA)'); p.dataset.x=xrev; return p; }

  /* ---- main year axis (faint baseline + growing accent + arrowhead) ---- */
  mk('line',{x1:FT_X0,y1:AX,x2:1300,y2:AX,stroke:'#cdd9e6','stroke-width':4,'marker-end':'url(#ftAb)'});
  mk('line',{id:'ft-trunk',x1:FT_X0,y1:AX,x2:FT_X0,y2:AX,stroke:'#1773d1','stroke-width':4,'stroke-linecap':'round'});
  // year ticks (dots + labels) + dashed 2026
  [2011,2013,2016,2017,2018,2020,2022,2023,2025].forEach(y=>{ const x=FX(y); mk('circle',{cx:x,cy:AX,r:4,fill:'#f4a6b4',stroke:'#cf6076','stroke-width':1}); const t=mk('text',{x:x,y:AX+20,'class':'ft-tick','text-anchor':'middle'}); t.textContent=y; });
  mk('line',{x1:1300,y1:30,x2:1300,y2:906,stroke:'#7f93a6','stroke-width':1.5,'stroke-dasharray':'7 6'});
  const yl=mk('text',{x:1300,y:AX-8,'class':'ft-tick','text-anchor':'end'}); yl.textContent='Year 2026';

  /* ---- CORE versions on the axis (+ descriptions above) ---- */
  const core=[
    [2011,'CREST v1.0','Origin of CREST three-layer soil accounting + linear reservoir routing'],
    [2012,'CREST v1.6','One-layer soil accounting + linear reservoir routing'],
    [2013,'CREST v2.0','Improve efficiency; distributed parameter set; modular design framework'],
    [2014,'CREST v2.1','Modified linear reservoir routing to a fully distributed linear reservoir routing'],
    [2017,'CREST v3.0','Separate one-layer soil into three-layer; add free-water storage; include groundwater; flow concentration'],
  ];
  core.forEach(([y,l,d])=>{ const x=FX(y); desc(x,372,'up',d, y===2017?96:80, y===2017?14:12); ver(x,392,l); });

  /* ---- UP branches ---- */
  // landslide (vertical at 2016, two boxes, long arrow right)
  FC=FAM.land;
  conn(`M470,${AX} L470,108`,false,470);
  conn('M502,120 L690,120',true,520);
  desc(470,238,'up','Coupled CREST and landslide model',104,16); ver(470,250,'iCRESTRGRS');
  desc(470,108,'up','Coupled CREST and landslide model',104,16); ver(470,120,'CRESLIDE');
  // WRF+CREST+ADCIRC (2018)
  FC=FAM.wrf;
  conn(`M680,${AX} L680,316`,true,680);
  desc(680,286,'up','Atmosphere–runoff–surge triple coupling framework',122,20); ver(680,300,'WRF+CREST+ADCIRC',true);
  // CREST-iMAP (2020-2021)
  FC=FAM.imap;
  conn(`M835,${AX} L835,330`,true,835);
  conn('M889,318 L1004,318',true,945);
  desc(835,306,'up','Based on CREST v2.1, add a hydraulic model to solve SWE',120,18); ver(835,318,'CREST-iMAP v1.0');
  desc(945,306,'up','Re-infiltration',86,14); ver(945,318,'CREST-iMAP v1.1');
  // AI (2025)
  FC=FAM.ai;
  conn(`M1212,${AX} L1212,222`,true,1212);
  conn('M1244,210 L1275,210 L1275,266',true,1244);
  conn('M1255,196 L1308,196',true,1255);
  desc(1212,198,'up','AI-enhanced model operation and CREST model automation',112,16); ver(1212,210,'AI Agent');
  desc(1278,292,'down','AI-facilitated CREST parameter calibration',112,16); ver(1278,278,'AI Calibration');

  /* ---- DOWN branches ---- */
  FC=FAM.snow; conn(`M560,${AX} L560,493`,true,560);   desc(560,519,'down','Add snow- and glacier-meltwater module to CREST',112,16); ver(560,505,'CREST-Snow');
  FC=FAM.vec;  conn(`M918,${AX} L918,493`,true,918);   desc(918,519,'down','Vector-based routing',96,16); ver(918,505,'CREST-VEC v1.0');
  FC=FAM.core; conn(`M1212,${AX} L1212,493`,true,1212);desc(1212,519,'down','Lake module and elevation-based temperature adjustments',112,16); ver(1212,505,'CREST v4.2');

  /* ---- EF5 lower sub-timeline ---- */
  FC=FAM.ef5;
  conn(`M330,${AX} L330,${EAX} L1085,${EAX}`,true,330);     // branches down ~2015 then runs right
  FC=FAM.gw;
  conn(`M1085,${EAX} L1085,517`,true,1085);                 // EF5 line curves up to v3.0n
  conn('M1085,493 L1085,424',true,1085);                    // 2023 merge: EF5 branch rejoins the main CREST axis
  desc(1085,519,'down','Conceptual groundwater module',110,16); ver(1085,505,'CREST v3.0n (EF5)');
  // EF5 boxes sit on the sub-axis (y=705)
  FC=FAM.ef5;
  desc(560,719,'down','Add land-surface modeling based on CREST v2.1',114,16); ver(560,705,'CREST-SVAS');
  desc(672,719,'down','Based on CREST v2.0; add three ensemble members; add kinematic-wave routing',120,18); ver(672,705,'EF5 v1.0');
  desc(835,719,'down','Updated CONUS & global a-priori parameters based on EF5 v1.0 (operational)',120,18); ver(835,705,'EF5 v1.2');
  desc(960,719,'down','Add CREST v3.0 to hydrologic model framework',114,16); ver(960,705,'EF5 v1.3');
  // WoF-FLASH (up from EF5 line)
  FC=FAM.wof; conn(`M790,${EAX} L790,646`,true,790); desc(790,576,'up','Atmospheric ensemble forecast + EF5 to produce flood forecast',120,18); ver(790,632,'WoF-FLASH');
  // CREST-MODFLOW (own row, clear of EF5 v1.2)
  FC=FAM.modflow; conn(`M755,${EAX} L755,862 L760,862`,true,755); desc(808,848,'up','Couple CREST with groundwater model MODFLOW',124,18); ver(808,862,'CREST-MODFLOW');

  // footnote
  const fn=mk('text',{x:60,y:902,'class':'ft-foot'}); fn.textContent='*Milestones list only versions with available publications; private development is not counted.';

  /* ---- sweeping marker + big year readout ---- */
  const m=mk('g',{id:'ft-marker'}); mk('line',{x1:0,y1:30,x2:0,y2:906,stroke:'#1773d1','stroke-width':1.5,'stroke-dasharray':'4 4',opacity:.5},m);
  mk('text',{id:'ft-year',x:1295,y:905,'class':'ft-yearbig','text-anchor':'end'}).textContent='2011';
})();

function animateFamilyTree(){
  const svg=document.getElementById('famtree'); if(!svg) return;
  const items=[...svg.querySelectorAll('.ft-node, .ft-grow')];
  items.forEach(el=>el.classList.remove('show'));
  const trunk=svg.querySelector('#ft-trunk'), marker=svg.querySelector('#ft-marker'), yr=svg.querySelector('#ft-year');
  if(marker) marker.style.opacity='';
  const D=7200; let t0=null;
  function frame(t){ if(t0===null)t0=t; const p=Math.min(1,(t-t0)/D); const tip=FT_X0+(FT_X1-FT_X0)*p;
    if(trunk) trunk.setAttribute('x2',tip);
    if(marker) marker.setAttribute('transform',`translate(${tip},0)`);
    if(yr) yr.textContent=(typeof FT_yearAt==='function')?FT_yearAt(tip):Math.round(2011+15*p);
    items.forEach(el=>{ if(!el.classList.contains('show') && (+el.dataset.x)<=tip+1) el.classList.add('show'); });
    if(p<1) requestAnimationFrame(frame); else if(marker) marker.style.opacity='0';
  }
  requestAnimationFrame(frame);
}
const _ftReplay=document.getElementById('ftReplay'); if(_ftReplay) _ftReplay.addEventListener('click',animateFamilyTree);

/* ---- milestone figure balloons: click card -> figure; click figure -> paper ---- */
(function(){
  const balloon=document.getElementById('msBalloon'); if(!balloon) return;
  if(balloon.parentElement!==document.body) document.body.appendChild(balloon);  // escape reveal's transform
  const img=document.getElementById('msBalloonImg'), cap=document.getElementById('msBalloonCap');
  let curDoi=null;
  const close=()=>{ balloon.hidden=true; img.removeAttribute('src'); curDoi=null; };
  document.querySelectorAll('.ms-card').forEach(card=>{
    card.addEventListener('click',()=>{ const fig=card.dataset.fig, doi=card.dataset.doi;
      if(fig){ img.src=fig; cap.innerHTML=card.dataset.cap||''; curDoi=doi||null; balloon.hidden=false; }
      else if(doi){ window.open(doi,'_blank','noopener'); } });
  });
  document.getElementById('msBalloonInner').addEventListener('click',e=>{ if(e.target.id==='msBalloonX') return; if(curDoi) window.open(curDoi,'_blank','noopener'); });
  document.getElementById('msBalloonX').addEventListener('click',e=>{ e.stopPropagation(); close(); });
  balloon.addEventListener('click',e=>{ if(e.target===balloon) close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!balloon.hidden){ e.stopPropagation(); close(); } },true);
})();

/* ---- init reveal ---- */
Reveal.initialize({
  hash:true,
  controls:true,
  progress:true,
  center:false,
  transition:'slide',
  backgroundTransition:'fade',
  loop:true,
  autoSlide:14000,
  autoSlideStoppable:true,
  width:1280, height:720, margin:0.06,
  minScale:0.2, maxScale:2.0
});

function onSlide(s){
  if(!s) return;
  if(s.classList.contains('impact-slide')) runCounters(s);
  if(s.classList.contains('famtree-slide')) animateFamilyTree();
  if(s.classList.contains('worldmap-slide')) animateWorldMap();
}
Reveal.on('slidechanged', e=>onSlide(e.currentSlide));
Reveal.on('ready', e=>onSlide(e.currentSlide));
