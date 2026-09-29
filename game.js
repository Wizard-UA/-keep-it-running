const $=s=>document.querySelector(s), clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let lang=localStorage.kirLang||'uk', start, alive, temp,pressure,chaos, siren=true, best=+(localStorage.kirBest5||0), timer, current;
const L={
uk:{shift:'ТИ ТУТ ВЖЕ',record:'РЕКОРД',sit:'СИТУАЦІЯ',silence:'ЗАТКНУТИ СИРЕНУ',silenceSub:'аварію не усуває',mystery:'РУБИЛЬНИК «ХЗ»',mysterySub:'ніхто не знає',g:['ТЕМП.','ТИСК','ПИЗДЕЦЬ'],again:'ЩЕ ОДНА ЗМІНА',dead:'ЗМІНУ ЗАКІНЧЕНО',red:['Ти натиснув кнопку «НЕ НАТИСКАТИ». Логічно.','Десь дуже далеко щось велике клацнуло.','Начальник: «ХТО ЦЕ ЗРОБИВ?!»'],quiet:'Сирена замовкла. Проблема — ні.',hz:['Нічого не сталося. Підозріло.','Вимкнулось світло в туалеті.','Манометр тепер показує погоду.','Щось запрацювало. Не чіпай.']},
en:{shift:'YOU HAVE BEEN HERE',record:'RECORD',sit:'SITUATION',silence:'SILENCE THE ALARM',silenceSub:'does not fix anything',mystery:'SWITCH “???”',mysterySub:'nobody knows',g:['TEMP','PRESSURE','OH SHIT'],again:'ANOTHER SHIFT',dead:'SHIFT OVER',red:['You pressed the DO NOT PRESS button. Naturally.','Something very large clicked far away.','Boss: “WHO DID THAT?!”'],quiet:'Alarm silenced. Problem remains.',hz:['Nothing happened. Suspicious.','The bathroom lights went out.','The pressure gauge now predicts weather.','Something started working. Do not touch it.']}
};
const S=[
{uk:['ЩОСЬ ГУДЕ','Зліва. А може справа. Раніше так не гуділо.'],en:['SOMETHING IS HUMMING','Left side. Maybe right. It did not hum like this before.'],c:[
['ВДАРИТИ ПО ПУЛЬТУ','HIT THE PANEL',-8,2,-2,'Перестало. Професіонал.','It stopped. Professional.'],
['ПРИСЛУХАТИСЬ','LISTEN CLOSER',3,5,2,'Тепер ти точно знаєш: воно гуде.','Confirmed: it is definitely humming.'],
['ЗРОБИТИ ВИГЛЯД, ЩО ТАК І БУЛО','PRETEND IT ALWAYS DID THAT',8,3,7,'Переконливо. Реактор не повірив.','Convincing. Reactor disagrees.']]},
{uk:['ЗВІДТИ ЙДЕ ДИМ','Диму небагато. Поки що.'],en:['SMOKE IS COMING FROM THERE','Not much smoke. Yet.'],c:[
['ПОДУТИ','BLOW ON IT',1,-3,1,'Дим образився, але лишився.','Smoke is offended but remains.'],
['НАКРИТИ ГАНЧІРКОЮ','COVER IT WITH A RAG',10,1,8,'Тепер диму не видно. Проблему вирішено?','Smoke is invisible now. Fixed?'],
['ВИМКНУТИ ОЦЕ','TURN THIS THING OFF',-9,-4,-5,'О. Допомогло. Що саме ти вимкнув — невідомо.','Oh. That helped. What you switched off is unknown.']]},
{uk:['НАЧАЛЬНИК ДЗВОНИТЬ','Питає, чого температура росте.'],en:['THE BOSS IS CALLING','Asking why temperature is rising.'],c:[
['ДАТЧИК ПИЗДИТЬ','THE SENSOR IS LYING',2,0,-4,'Начальник: «А. Ну добре.»','Boss: “Ah. Okay then.”'],
['НЕ БРАТИ','IGNORE CALL',4,2,4,'Дзвонить ще раз. Наполегливий.','Calling again. Persistent.'],
['СКАЗАТИ «ВСЕ ПІД КОНТРОЛЕМ»','SAY “UNDER CONTROL”',6,2,5,'Після цих слів завжди щось стається.','Those words always trigger something.']]},
{uk:['ТИСК РОСТЕ','Манометр уже в червоному. Але червоний гарний.'],en:['PRESSURE IS RISING','Gauge is in the red. Red looks nice though.'],c:[
['ПОСТУКАТИ ПО МАНОМЕТРУ','TAP THE GAUGE',0,-12,4,'Стрілка впала. Сам тиск — питання відкрите.','Needle dropped. Actual pressure is another matter.'],
['ВІДКРИТИ ЯКИЙСЬ КЛАПАН','OPEN SOME VALVE',-2,-15,-5,'Пшшшш. Звучить переконливо.','Pssshhh. Sounds convincing.'],
['ЗАТИСНУТИ ПАЛЬЦЕМ','HOLD IT WITH A FINGER',3,8,8,'Це був не той отвір.','Wrong hole.']]},
{uk:['КУЛЕР НЕ СПРАВЛЯЄТЬСЯ','Температура повзе вгору. Інженерів немає.'],en:['COOLING IS NOT COPING','Temperature is climbing. No engineers around.'],c:[
['ВІДКРИТИ ВІКНО','OPEN A WINDOW',-5,0,-2,'Стало прохолодніше тобі. Уже результат.','You feel cooler. That counts.'],
['ДУТИ СИЛЬНІШЕ','BLOW HARDER',-2,0,1,'Технології майбутнього.','Future technology.'],
['НАЛИТИ ВОДИ','POUR WATER ON IT',-14,7,9,'Температура впала. Електрика має питання.','Temperature dropped. Electricity has questions.']]},
{uk:['ГОРИТЬ ЛАМПОЧКА','Червона. Підпис стерся у 1987-му.'],en:['A LIGHT IS ON','Red. Label wore off in 1987.'],c:[
['НАТИСНУТИ НА ЛАМПОЧКУ','PRESS THE LIGHT',4,4,5,'Це лампочка. Не кнопка.','It is a light. Not a button.'],
['ВИКРУТИТИ ЛАМПОЧКУ','REMOVE THE BULB',0,0,-6,'Тривоги більше нема. Технічно.','No warning light anymore. Technically.'],
['ПОКЛИКАТИ КОЛЕГУ','CALL A COWORKER',-4,-4,-5,'Колега сказав: «ХЗ». Але стало легше.','Coworker said “dunno”. Somehow it helped.']]}
];
function tr(a){return a[lang==='uk'?0:1]}
function fmt(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function buzz(p){navigator.vibrate?.(p)}
function tone(f=300,d=.07){try{let A=window._a||(window._a=new (AudioContext||webkitAudioContext)()),o=A.createOscillator(),g=A.createGain();o.frequency.value=f;g.gain.value=.035;o.connect(g);g.connect(A.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,A.currentTime+d);o.stop(A.currentTime+d)}catch{}}
function toast(x){$('#toast').textContent=x;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1500)}
function next(){current=S[Math.floor(Math.random()*S.length)];$('#problem').textContent=tr(current[lang]);$('#detail').textContent=current[lang][1];$('#choices').innerHTML='';current.c.forEach((c,i)=>{let b=document.createElement('button');b.innerHTML=`<b>${c[lang==='uk'?0:1]}</b>`;b.onclick=()=>choose(c);$('#choices').appendChild(b)})}
function choose(c){if(!alive)return;temp+=c[2]+Math.random()*5;pressure+=c[3]+Math.random()*4;chaos+=c[4]+Math.random()*4;toast(c[lang==='uk'?5:6]);tone(260+Math.random()*300);buzz(25);render();if(alive)setTimeout(next,650)}
function render(){temp=clamp(temp,0,110);pressure=clamp(pressure,0,110);chaos=clamp(chaos,0,110);$('#temp').value=temp;$('#pressure').value=pressure;$('#chaos').value=chaos;document.body.classList.toggle('bad',Math.max(temp,pressure,chaos)>75);if(Math.max(temp,pressure,chaos)>=100)die()}
function die(){if(!alive)return;alive=false;clearInterval(timer);let t=(Date.now()-start)/1000;if(t>best){best=t;localStorage.kirBest5=best}$('#problem').textContent=L[lang].dead;$('#detail').textContent=lang==='uk'?'Офіційна причина: «людський фактор». Несподівано.':'Official cause: “human factor”. Shocking.';$('#choices').innerHTML='';$('#restart').classList.remove('hidden');buzz([150,80,150,80,400]);tone(120,.5)}
function reset(){alive=true;temp=30;pressure=34;chaos=6;siren=true;start=Date.now();$('#restart').classList.add('hidden');next();render();clearInterval(timer);timer=setInterval(()=>{$('#time').textContent=fmt((Date.now()-start)/1000);$('#best').textContent=fmt(best);temp+=.35;pressure+=.22;chaos+=.18;render()},1000)}
function labels(){let l=L[lang];$('#shiftLabel').textContent=l.shift;$('#recordLabel').textContent=l.record;$('#situationLabel').textContent=l.sit;$('#silenceText').textContent=l.silence;$('#silenceSub').textContent=l.silenceSub;$('#mysteryText').textContent=l.mystery;$('#mysterySub').textContent=l.mysterySub;$('#g1').textContent=l.g[0];$('#g2').textContent=l.g[1];$('#g3').textContent=l.g[2];$('#restart').textContent=l.again;$('#lang').textContent=lang==='uk'?'UA':'EN'}
$('#lang').onclick=()=>{lang=lang==='uk'?'en':'uk';localStorage.kirLang=lang;labels();next()};
$('#silence').onclick=()=>{siren=!siren;toast(L[lang].quiet);chaos+=2;tone(180,.04);render()};
$('#mystery').onclick=()=>{let a=L[lang].hz;toast(a[Math.floor(Math.random()*a.length)]);temp+=Math.random()*16-8;pressure+=Math.random()*16-8;chaos+=Math.random()*14-4;tone(190,.12);render()};
$('#red').onclick=()=>{let a=L[lang].red;toast(a[Math.floor(Math.random()*a.length)]);chaos+=18;temp+=8;pressure+=7;buzz([80,40,80]);tone(90,.25);render()};
$('#restart').onclick=reset;labels();reset();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=005').then(r=>r.update()).catch(()=>{});
