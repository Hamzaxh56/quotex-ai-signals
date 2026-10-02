/*
  QUOTEX AI V5 - Live Market
  IMPORTANT: Put your own licensed market-data API key below.
  This version uses Twelve Data REST candles. It does NOT place trades.
*/
const API_KEY = "PUT_YOUR_TWELVE_DATA_API_KEY_HERE";
const API_URL = "https://api.twelvedata.com/time_series";

const svg=document.getElementById("chart");
const tf=document.getElementById("tf");
const pair=document.getElementById("pair");
const history=document.getElementById("history");
const NS="http://www.w3.org/2000/svg";

const names={1:"1 MIN",5:"5 MIN",15:"15 MIN",30:"30 MIN",60:"1 HOUR",240:"4 HOURS",1440:"1 DAY"};
const intervals={1:"1min",5:"5min",15:"15min",30:"30min",60:"1h",240:"4h",1440:"1day"};

let candles=[];
let expiryAt=null;
let expiryTimer=null;
let refreshTimer=null;

function E(t,a){const e=document.createElementNS(NS,t);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));return e}

function tfSeconds(){return Number(tf.value)*60}

function formatTime(sec){
  sec=Math.max(0,Math.floor(sec));
  const h=Math.floor(sec/3600); sec%=3600;
  const m=Math.floor(sec/60); const s=sec%60;
  return h?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function startExpiry(){
  if(expiryTimer) clearInterval(expiryTimer);
  expiryAt=Date.now()+tfSeconds()*1000;
  updateExpiry();
  expiryTimer=setInterval(updateExpiry,250);
}

function updateExpiry(){
  const c=document.getElementById("expiryCountdown");
  const a=document.getElementById("expiryAt");
  if(!expiryAt)return;
  const remaining=Math.max(0,(expiryAt-Date.now())/1000);
  c.textContent=remaining>0?formatTime(remaining):"EXPIRED";
  a.textContent=remaining>0
    ?"Same timeframe • expires at "+new Date(expiryAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})
    :"Signal expired — analyze again for a new signal";
  if(remaining<=0 && expiryTimer){clearInterval(expiryTimer);expiryTimer=null}
}

function draw(){
  svg.replaceChildren();
  for(let y=30;y<280;y+=42)svg.appendChild(E("line",{x1:0,y1:y,x2:700,y2:y,stroke:"#29313b","stroke-width":1}));
  if(!candles.length)return;
  const mn=Math.min(...candles.map(x=>x.low)),mx=Math.max(...candles.map(x=>x.high)),r=mx-mn||1;
  const step=700/candles.length, Y=v=>260-(v-mn)/r*225;
  candles.forEach((c,i)=>{
    const x=i*step+step/2,up=c.close>=c.open;
    svg.appendChild(E("line",{x1:x,y1:Y(c.high),x2:x,y2:Y(c.low),stroke:up?"#25ff55":"#ff526b","stroke-width":2}));
    svg.appendChild(E("rect",{x:x-step*.3,y:Math.min(Y(c.open),Y(c.close)),width:step*.6,height:Math.max(3,Math.abs(Y(c.open)-Y(c.close))),fill:up?"#20ef4b":"#ff526b"}));
  });
}

function signalFromData(){
  if(candles.length<8)return null;
  const closes=candles.map(c=>c.close);
  const last=closes.at(-1);
  const prev=closes.at(-2);
  const old=closes.at(-6);
  const momentum=((last-old)/old)*100;
  const short=((last-prev)/prev)*100;
  const up=momentum+short>=0;
  const strength=Math.min(95,Math.max(51,Math.round(55+Math.abs(momentum)*1200+Math.abs(short)*800)));
  return {up,score:strength};
}

function showSignal(){
  const s=signalFromData();
  if(!s)return;
  const arrow=document.getElementById("arrow"),direction=document.getElementById("direction");
  arrow.textContent=s.up?"↑":"↓";
  direction.textContent=s.up?"UP":"DOWN";
  arrow.style.color=s.up?"#20ff4d":"#ff315d";
  direction.style.color=s.up?"#20ff4d":"#ff315d";
  document.getElementById("confidence").textContent=s.score+"%";
  document.getElementById("tfOut").textContent=names[tf.value]+" / "+names[tf.value];
  document.getElementById("chartTf").textContent=names[tf.value];
  document.getElementById("price").textContent=candles.at(-1).close.toFixed(5);
  const d=document.createElement("div");
  d.className="row";
  d.innerHTML=`<span>${pair.value} • ${names[tf.value]} → ${names[tf.value]}</span><b class="${s.up?"up":"down"}">${s.up?"UP":"DOWN"} ${s.score}%</b>`;
  history.prepend(d);
  while(history.children.length>8)history.lastChild.remove();
  startExpiry();
}

async function loadMarket(){
  const status=document.getElementById("status");
  if(!API_KEY || API_KEY.includes("PUT_YOUR")){
    status.textContent="Live market is ready, but you must add your Twelve Data API key in app.js.";
    return;
  }
  status.textContent=`Connecting to live ${pair.value} ${names[tf.value]} market data…`;
  try{
    const url=`${API_URL}?symbol=${encodeURIComponent(pair.value)}&interval=${intervals[tf.value]}&outputsize=40&apikey=${encodeURIComponent(API_KEY)}`;
    const res=await fetch(url);
    const json=await res.json();
    if(json.status==="error" || !json.values)throw new Error(json.message||"Market data error");
    candles=json.values.reverse().map(v=>({open:+v.open,high:+v.high,low:+v.low,close:+v.close}));
    draw();
    showSignal();
    status.textContent=`LIVE • ${pair.value} • ${names[tf.value]} candles • updated ${new Date().toLocaleTimeString()}`;
  }catch(err){
    status.textContent="Live data error: "+err.message;
  }
}

function scheduleRefresh(){
  if(refreshTimer)clearInterval(refreshTimer);
  refreshTimer=setInterval(loadMarket,15000);
}

document.getElementById("analyze").addEventListener("click",loadMarket);
tf.addEventListener("change",()=>{loadMarket();scheduleRefresh()});
pair.addEventListener("change",loadMarket);

draw();
loadMarket();
scheduleRefresh();
