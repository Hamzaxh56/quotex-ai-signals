const $=id=>document.getElementById(id);
const API_BASE="https://api.twelvedata.com/time_series";
let candles=[], signal=null, history=JSON.parse(localStorage.getItem("signalHistoryV6")||"[]");
let apiKey=localStorage.getItem("td_api_key")||"";
$("apiKey").value=apiKey;

function tfLabel(tf){return tf==="1min"?"1 MIN":tf==="5min"?"5 MIN":"15 MIN"}
function intervalMs(tf){return tf==="1min"?60000:tf==="5min"?300000:900000}
function fmtTime(d){return new Intl.DateTimeFormat([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(d)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

async function fetchCandles(){
  if(!apiKey){setStatus(false); return}
  const symbol=encodeURIComponent($("pair").value);
  const interval=$("tf").value;
  const url=`${API_BASE}?symbol=${symbol}&interval=${interval}&outputsize=80&timezone=UTC&apikey=${encodeURIComponent(apiKey)}`;
  const r=await fetch(url,{cache:"no-store"});
  const j=await r.json();
  if(!r.ok || j.status==="error" || !j.values) throw new Error(j.message||"Market data request failed");
  candles=j.values.reverse().map(x=>({time:new Date(x.datetime+"Z"),open:+x.open,high:+x.high,low:+x.low,close:+x.close}));
  setStatus(true); drawChart(); analyze();
}

function setStatus(ok){$("status").textContent=ok?"LIVE DATA":"OFFLINE";$("status").className="status "+(ok?"online":"offline")}

function ema(vals,n){let k=2/(n+1),e=vals[0];return vals.map((v,i)=>i?e=v*k+e*(1-k):e)}
function rsi(vals,n=14){
  if(vals.length<n+1)return 50;
  let g=0,l=0;
  for(let i=vals.length-n;i<vals.length;i++){let d=vals[i]-vals[i-1];if(d>0)g+=d;else l-=d}
  if(l===0)return 100; return 100-(100/(1+g/l));
}
function macd(vals){let e12=ema(vals,12),e26=ema(vals,26);let line=vals.map((_,i)=>e12[i]-e26[i]);let sig=ema(line.slice(25),9).at(-1);return {line:line.at(-1),sig}}
function analyze(){
  if(candles.length<30)return;
  const closes=candles.map(c=>c.close), e9=ema(closes,9).at(-1), e21=ema(closes,21).at(-1), rr=rsi(closes), mm=macd(closes);
  let score=0;
  if(e9>e21)score++; else score--;
  if(rr>52)score++; else if(rr<48)score--;
  if(mm.line>mm.sig)score++; else score--;
  const dir=score>=2?"UP":score<=-2?"DOWN":"WAIT";
  const strength=Math.round(50+Math.min(40,Math.abs(score)*13));
  signal={dir,strength,createdAt:new Date(),entry:candles.at(-1).close,tf:$("tf").value,expiry:+$("expiry").value};
  renderSignal();
}
function renderSignal(){
  if(!signal)return;
  $("direction").textContent=signal.dir;
  $("direction").className="direction "+(signal.dir==="UP"?"up":signal.dir==="DOWN"?"down":"neutral");
  $("directionIcon").textContent=signal.dir==="UP"?"↑":signal.dir==="DOWN"?"↓":"—";
  $("strength").textContent=signal.dir==="WAIT"?"WAIT":signal.strength+"% strength";
  $("reason").textContent="Based on EMA(9/21), RSI(14) and MACD. Strength is not a win probability.";
  $("metricTf").textContent=tfLabel(signal.tf);
  $("feedTf").textContent=tfLabel(signal.tf);
  $("price").textContent="Live price: "+candles.at(-1).close.toFixed(5);
}
function nextBoundary(){
  const now=Date.now(), ms=intervalMs($("tf").value);
  return Math.ceil(now/ms)*ms;
}
function tick(){
  const target=nextBoundary(), diff=Math.max(0,target-Date.now());
  const sec=Math.floor(diff/1000), m=Math.floor(sec/60), s=sec%60;
  $("countdown").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  $("expiresAt").textContent="Next candle boundary: "+fmtTime(new Date(target));
}
setInterval(tick,250); tick();

function drawChart(){
  const c=$("chart"),ctx=c.getContext("2d"),dpr=devicePixelRatio||1;
  c.width=c.clientWidth*dpr;c.height=c.clientHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=c.clientWidth,h=c.clientHeight,pad=14, view=candles.slice(-40);
  if(!view.length)return;
  const hi=Math.max(...view.map(x=>x.high)),lo=Math.min(...view.map(x=>x.low)),range=hi-lo||1;
  const y=v=>pad+(hi-v)/range*(h-pad*2), cw=(w-pad*2)/view.length;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle="#273038";ctx.lineWidth=1;
  for(let i=1;i<6;i++){let yy=pad+i*(h-pad*2)/6;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(w,yy);ctx.stroke()}
  view.forEach((x,i)=>{let xx=pad+i*cw+cw/2, up=x.close>=x.open;ctx.strokeStyle=up?"#20ef55":"#ff5274";ctx.fillStyle=ctx.strokeStyle;
    ctx.beginPath();ctx.moveTo(xx,y(x.high));ctx.lineTo(xx,y(x.low));ctx.stroke();
    const top=y(Math.max(x.open,x.close)),bot=y(Math.min(x.open,x.close));ctx.fillRect(xx-cw*.28,top,Math.max(2,cw*.56),Math.max(2,bot-top));
  });
}
function renderHistory(){
  $("history").innerHTML=history.slice(0,10).map(x=>`<div class="history-row"><span>${esc(x.pair)} · ${esc(tfLabel(x.tf))}</span><b class="${x.result.toLowerCase()}">${esc(x.result)}</b></div>`).join("")||"<div class='reason'>No completed signals yet.</div>";
}
function saveHistory(){localStorage.setItem("signalHistoryV6",JSON.stringify(history.slice(0,30)));renderHistory()}
$("saveKey").onclick=()=>{apiKey=$("apiKey").value.trim();localStorage.setItem("td_api_key",apiKey);fetchCandles().catch(e=>alert(e.message))};
$("reanalyze").onclick=()=>fetchCandles().catch(e=>{setStatus(false);alert(e.message)});
$("pair").onchange=()=>fetchCandles().catch(e=>{setStatus(false);alert(e.message)});
$("tf").onchange=()=>fetchCandles().catch(e=>{setStatus(false);alert(e.message)});
$("expiry").onchange=()=>{if(signal)signal.expiry=+$("expiry").value};

renderHistory();
if(apiKey)fetchCandles().catch(e=>{setStatus(false);$("reason").textContent=e.message});
window.addEventListener("resize",drawChart);
