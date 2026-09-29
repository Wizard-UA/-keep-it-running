const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let s,alive,last,started,best=Number(localStorage.kirBest||0),coolCharges;
const defs=[['temp','ТЕМП. ЯДРА',420,0,1000,'°C'],['pressure','ТИСК',55,0,100,'%'],['power','ПОТУЖНІСТЬ',72,0,120,'%'],['coolant','ТЕПЛОНОСІЙ',78,0,100,'%'],['stability','СТАБІЛЬНІСТЬ',86,0,100,'%']];
const meters=document.querySelector('#meters');
defs.forEach(([k,n])=>meters.insertAdjacentHTML('beforeend',`<div class="meter"><span>${n}</span><div class="track"><div id="bar-${k}" class="fill"></div></div><span id="v-${k}" class="value"></span></div>`));
function reset(){s={temp:420,pressure:55,power:72,coolant:78,stability:86,pump:false,generator:false,valve:50,vent:false,scram:false};coolCharges=2;alive=true;started=performance.now();last=started;document.querySelector('#restart').classList.add('hidden');log('R-01 у мережі. Утримуй систему стабільною.');render();requestAnimationFrame(loop)}
function log(x){document.querySelector('#log').textContent=x}
function fmt(ms){let sec=ms/1000,m=Math.floor(sec/60),ss=(sec%60).toFixed(1).padStart(4,'0');return `${String(m).padStart(2,'0')}:${ss}`}
function loop(t){if(!alive)return;let dt=Math.min((t-last)/1000,.1);last=t;let demand=74+8*Math.sin((t-started)/8500)+Math.min(18,(t-started)/60000*4);
 if(s.scram){s.power-=35*dt;s.temp-=18*dt;s.pressure-=7*dt;s.stability+=5*dt}else{
  s.power+=(s.generator?8:-2.2)*dt+(s.valve-50)*.045*dt+(demand-s.power)*.045*dt;
  s.temp+=(s.power-64)*.115*dt+(s.generator?2.4:0)*dt-(s.pump?9.5:0)*dt;
  s.pressure+=(s.temp-410)*.012*dt+(s.valve-50)*.055*dt-(s.vent?9:0)*dt;
  s.coolant-=((s.pump?1.15:.13)+(s.vent?.7:0))*dt;
 }
 let stress=Math.max(0,s.temp-690)/16+Math.max(0,s.pressure-82)/3+Math.max(0,38-s.power)/4+Math.max(0,22-s.coolant)/2;
 s.stability+=(2.1-stress)*dt;
 for(let k of ['pressure','power','coolant','stability'])s[k]=clamp(s[k],0,k==='power'?120:100);s.temp=clamp(s.temp,0,1100);
 if(s.temp>=960||s.pressure>=100||s.stability<=0||s.coolant<=0){die()}
 render();if(alive)requestAnimationFrame(loop)}
function die(){alive=false;let score=performance.now()-started;if(score>best){best=score;localStorage.kirBest=best}document.querySelector('#status').className='status bad';document.querySelector('#status').textContent='БЛОК ВТРАЧЕНО';document.querySelector('#restart').classList.remove('hidden');log(s.temp>=960?'ПЕРЕГРІВ ЯДРА. Блок втрачено.':s.pressure>=100?'РУЙНУВАННЯ КОРПУСУ ВІД ТИСКУ.':s.coolant<=0?'ТЕПЛОНОСІЙ ВИЧЕРПАНО.':'СИСТЕМА НЕСТАБІЛЬНА. Блок втрачено.');render()}
function render(){let now=alive?performance.now():last;document.querySelector('#timer').textContent=fmt(now-started);document.querySelector('#best').textContent='РЕКОРД '+fmt(best);defs.forEach(([k,n,init,min,max,u])=>{let pct=k==='temp'?s[k]/10:k==='power'?s[k]/1.2:s[k];document.querySelector('#bar-'+k).style.width=clamp(pct,0,100)+'%';document.querySelector('#v-'+k).textContent=Math.round(s[k])+(k==='temp'?u:'%')});let alarms=[];if(s.temp>720)alarms.push('ВИСОКА ТЕМПЕРАТУРА ЯДРА');if(s.pressure>82)alarms.push('ВИСОКИЙ ТИСК');if(s.power<38)alarms.push('НИЗЬКА ПОТУЖНІСТЬ МЕРЕЖІ');if(s.coolant<25)alarms.push('НИЗЬКИЙ РІВЕНЬ ТЕПЛОНОСІЯ');if(s.stability<35)alarms.push('СИСТЕМА НЕСТАБІЛЬНА');document.querySelector('#alarms').innerHTML=alarms.length?alarms.map(a=>`<div class="alarm hot">⚠ ${a}</div>`).join(''):'<div class="alarm">НЕМАЄ АКТИВНИХ ТРИВОГ</div>';if(alive){let bad=alarms.length>1,warn=alarms.length>0;let st=document.querySelector('#status');st.className='status '+(bad?'bad':warn?'warn':'ok');st.textContent=bad?'КРИТИЧНО':warn?'УВАГА':'СТАБІЛЬНО'}document.querySelectorAll('[data-act]').forEach(b=>{let a=b.dataset.act;b.classList.toggle('active',!!s[a]);let sp=b.querySelector('span');if(a==='pump'||a==='generator')sp.textContent=s[a]?'УВІМК':'ВИМК';if(a==='valve')sp.textContent=s.valve+'%';if(a==='vent')sp.textContent=s.vent?'ВІДКРИТО':'ЗАКРИТО';if(a==='cool')sp.textContent=coolCharges+' ЗАРЯДИ';if(a==='scram')sp.textContent=s.scram?'СПРАЦЮВАВ':'ГОТОВИЙ'})}
document.querySelector('.controls').addEventListener('click',e=>{let b=e.target.closest('button');if(!b||!alive)return;let a=b.dataset.act;if(a==='pump'||a==='generator'||a==='vent')s[a]=!s[a];if(a==='valve'){s.valve=s.valve>=80?20:s.valve+15;log('Головний клапан: '+s.valve+'%.')}if(a==='cool'&&coolCharges>0){coolCharges--;s.temp-=150;s.pressure-=12;s.coolant=Math.min(100,s.coolant+10);s.stability+=8;log('Аварійне охолодження активовано.')}if(a==='scram'&&!s.scram){s.scram=true;log('SCRAM активовано. Триває зупинка реактора.')}render()});
document.querySelector('#restart').onclick=reset;
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});reset();
