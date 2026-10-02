const express=require("express"),path=require("path");
const app=express(),PORT=process.env.PORT||10000,KEY=process.env.TWELVE_DATA_API_KEY;
const pairs=new Set(["EUR/JPY","GBP/JPY","EUR/USD","GBP/USD","AUD/JPY","USD/JPY","USD/CHF","USDCAD"]);
const ints=new Set(["1min","5min","15min"]); let cache=new Map();
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/health",(q,s)=>s.json({ok:true,providerConfigured:!!KEY}));
app.get("/api/candles",async(q,s)=>{
 const symbol=String(q.query.symbol||"EUR/JPY").toUpperCase(),interval=String(q.query.interval||"1min").toLowerCase();
 if(!pairs.has(symbol)||!ints.has(interval))return s.status(400).json({error:"Unsupported pair or interval"});
 if(!KEY)return s.status(500).json({error:"TWELVE_DATA_API_KEY is not configured."});
 const ck=symbol+":"+interval,c=cache.get(ck); if(c&&Date.now()-c.t<10000)return s.json(c.d);
 const u=new URL("https://api.twelvedata.com/time_series"); u.searchParams.set("symbol",symbol);u.searchParams.set("interval",interval);u.searchParams.set("outputsize","100");u.searchParams.set("format","JSON");u.searchParams.set("apikey",KEY);
 try{const r=await fetch(u),d=await r.json();if(!r.ok||d.status==="error"||!Array.isArray(d.values))return s.status(502).json({error:d.message||"Market data error"});
 const values=d.values.map(x=>({datetime:x.datetime,open:+x.open,high:+x.high,low:+x.low,close:+x.close})).reverse(),out={symbol,interval,values,fetchedAt:new Date().toISOString()};cache.set(ck,{t:Date.now(),d:out});s.json(out)
 }catch(e){s.status(502).json({error:"Could not reach market-data provider."})}
});
app.get("*",(q,s)=>s.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log("Quotex AI running on "+PORT));