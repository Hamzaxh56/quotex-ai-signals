const svg=document.getElementById('chart'),tf=document.getElementById('tf'),expiry=document.getElementById('expiry'),pair=document.getElementById('pair'),history=document.getElementById('history');let data=[],last=100;const NS='http://www.w3.org/2000/svg';const names={1:'1 MIN',5:'5 MIN',15:'15 MIN',30:'30 MIN',60:'1 HOUR',240:'4 HOURS',1440:'1 DAY'};function E(t,a){const e=document.createElementNS(NS,t);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));return e}function seed(){data=[];last=100;for(let i=0;i<38;i++){let o=last,c=o+(Math.random()-.47)*5,h=Math.max(o,c)+Math.random()*3,l=Math.min(o,c)-Math.random()*3;data.push({o,h,l,c});last=c}draw()}function draw(){svg.replaceChildren();for(let y=30;y<280;y+=42)svg.appendChild(E('line',{x1:0,y1:y,x2:700,y2:y,stroke:'#29313b','stroke-width':1}));let mn=Math.min(...data.map(x=>x.l)),mx=Math.max(...data.map(x=>x.h)),r=mx-mn||1,step=700/data.length,Y=v=>260-(v-mn)/r*225;data.forEach((c,i)=>{let x=i*step+step/2,up=c.c>=c.o;svg.appendChild(E('line',{x1:x,y1:Y(c.h),x2:x,y2:Y(c.l),stroke:up?'#25ff55':'#ff526b','stroke-width':2}));svg.appendChild(E('rect',{x:x-step*.3,y:Math.min(Y(c.o),Y(c.c)),width:step*.6,height:Math.max(3,Math.abs(Y(c.o)-Y(c.c))),fill:up?'#20ef4b':'#ff526b'}))})}function analyze(){let up=Math.random()>.48,score=90+Math.floor(Math.random()*10);document.getElementById('arrow').textContent=up?'↑':'↓';document.getElementById('direction').textContent=up?'UP':'DOWN';document.getElementById('arrow').style.color=up?'#20ff4d':'#ff315d';document.getElementById('direction').style.color=up?'#20ff4d':'#ff315d';document.getElementById('confidence').textContent=score+'%';document.getElementById('tfOut').textContent=names[tf.value];document.getElementById('chartTf').textContent=names[tf.value];document.getElementById('status').textContent=`${pair.value} • ${names[tf.value]} analysis • expiry ${names[expiry.value]}`;const d=document.createElement('div');d.className='row';d.innerHTML=`<span>${pair.value} • ${names[tf.value]}</span><b class="${up?'up':'down'}">${up?'UP':'DOWN'} ${score}%</b>`;history.prepend(d);while(history.children.length>6)history.lastChild.remove()}[tf,pair,expiry].forEach(x=>x.addEventListener('change',()=>{seed();analyze()}));document.getElementById('analyze').onclick=analyze;seed();analyze();setInterval(()=>{let o=last,c=o+(Math.random()-.48)*5,h=Math.max(o,c)+Math.random()*3,l=Math.min(o,c)-Math.random()*3;data.push({o,h,l,c});last=c;if(data.length>38)data.shift();draw()},1500);

// Live signal-expiry countdown
let signalExpiryAt = null;
let expiryTimer = null;

function timeframeToSeconds(tf) {
  const map = {
    "1 MIN": 60,
    "5 MIN": 300,
    "15 MIN": 900,
    "30 MIN": 1800,
    "1 HOUR": 3600,
    "4 HOURS": 14400,
    "1 DAY": 86400,
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400
  };
  return map[tf] || 300;
}

function getExpirySeconds() {
  const el = document.getElementById("expiryTimeframe") ||
             document.getElementById("expirySelect") ||
             document.querySelector('[name="expiry"]');
  return timeframeToSeconds(el ? el.value : "5 MIN");
}

function formatCountdown(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const d = Math.floor(seconds / 86400);
  seconds %= 86400;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function updateExpiryUI() {
  const countdown = document.getElementById("expiryCountdown");
  const expiryAt = document.getElementById("expiryAt");
  if (!countdown || !expiryAt) return;

  if (!signalExpiryAt) {
    countdown.textContent = "--:--";
    expiryAt.textContent = "Waiting for signal…";
    return;
  }

  const remaining = Math.max(0, (signalExpiryAt - Date.now()) / 1000);
  countdown.textContent = remaining > 0 ? formatCountdown(remaining) : "EXPIRED";
  expiryAt.textContent = remaining > 0
    ? "Expires at " + new Date(signalExpiryAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"})
    : "Signal expired — re-analyze for a new signal";

  if (remaining <= 0 && expiryTimer) {
    clearInterval(expiryTimer);
    expiryTimer = null;
  }
}

function startSignalExpiry() {
  if (expiryTimer) clearInterval(expiryTimer);
  signalExpiryAt = Date.now() + getExpirySeconds() * 1000;
  updateExpiryUI();
  expiryTimer = setInterval(updateExpiryUI, 250);
}

// Start countdown after a new signal is generated.
// If the existing app already calls a signal-generation function, the
// observer below starts the timer whenever the signal text changes.
function attachExpiryObserver() {
  const targets = [
    document.getElementById("signalDirection"),
    document.getElementById("direction"),
    document.getElementById("signal"),
    document.getElementById("confidence")
  ].filter(Boolean);

  if (!targets.length) return;
  const observer = new MutationObserver(() => startSignalExpiry());
  targets.forEach(el => observer.observe(el, {childList:true, subtree:true, characterData:true}));
}

document.addEventListener("DOMContentLoaded", () => {
  attachExpiryObserver();

  // Also hook common Analyze/Generate buttons.
  document.querySelectorAll("button").forEach(btn => {
    const label = (btn.textContent || "").toLowerCase();
    if (label.includes("analy") || label.includes("signal") || label.includes("generate")) {
      btn.addEventListener("click", () => setTimeout(startSignalExpiry, 50));
    }
  });

  // Start once on load so the demo has an active expiry timer.
  setTimeout(startSignalExpiry, 300);
});
