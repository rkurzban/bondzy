import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const B = {
  navy:"#1B2A4A",navyL:"#243A5E",gold:"#D4A843",goldL:"#F2E6C5",goldD:"#B8912E",
  wh:"#FFFFFF",off:"#F5F6F8",grn:"#2E8B57",grnL:"#E8F5EE",red:"#C0392B",redL:"#FDECEB",
  blu:"#3B82F6",bluL:"#EBF4FF",gry:"#8E99A4",gryL:"#E8ECF0",gryD:"#5A6570",bdr:"#DDE1E6",
};

const GKEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

// Google Places Autocomplete via REST API
let searchTimer = null;
const searchPlaces = (query, callback) => {
  clearTimeout(searchTimer);
  if (!query || query.length < 3) { callback([]); return; }
  searchTimer = setTimeout(async () => {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GKEY },
        body: JSON.stringify({ input: query, languageCode: "en" })
      });
      const data = await res.json();
      const suggestions = (data.suggestions || [])
        .filter(s => s.placePrediction)
        .slice(0, 5)
        .map(s => ({
          id: s.placePrediction.placeId,
          n: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text || query,
          a: s.placePrediction.structuredFormat?.secondaryText?.text || "",
          placeId: s.placePrediction.placeId,
        }));
      callback(suggestions);
    } catch (e) { console.error("Places search error:", e); callback([]); }
  }, 350);
};

// Fetch lat/lng for a selected place
const getPlaceDetails = async (placeId) => {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location,formattedAddress,displayName`, {
      headers: { "X-Goog-Api-Key": GKEY }
    });
    const data = await res.json();
    return {
      lat: data.location?.latitude,
      lng: data.location?.longitude,
      address: data.formattedAddress || "",
      name: data.displayName?.text || "",
    };
  } catch (e) { console.error("Place details error:", e); return null; }
};

const Ic = ({name,size=20,color="currentColor"}) => {
  const d = {
    plus:<path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>,
    gift:<><path d="M20 12v10H4V12" strokeWidth="2"/><path d="M2 7h20v5H2z" strokeWidth="2"/><path d="M12 22V7" strokeWidth="2"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" strokeWidth="2"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" strokeWidth="2"/></>,
    pin:<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeWidth="2"/><circle cx="12" cy="10" r="3" strokeWidth="2"/></>,
    clock:<><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/></>,
    check:<path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    x:<><path d="M18 6L6 18" strokeWidth="2" strokeLinecap="round"/><path d="M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></>,
    send:<><path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22l-4-9-9-4z" strokeWidth="2" strokeLinejoin="round"/></>,
    home:<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2"/><path d="M9 22V12h6v10" strokeWidth="2"/></>,
    user:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="2"/><circle cx="12" cy="7" r="4" strokeWidth="2"/></>,
    nav:<polygon points="3 11 22 2 13 21 11 13 3 11" strokeWidth="2" strokeLinejoin="round"/>,
    back:<path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    search:<><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></>,
    help:<><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeWidth="2" strokeLinecap="round"/><path d="M12 17h.01" strokeWidth="2" strokeLinecap="round"/></>,
    zap:<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth="2" strokeLinejoin="round"/>,
    copy:<><rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/></>,
    chev:<path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    logout:<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="2"/><polyline points="16 17 21 12 16 7" strokeWidth="2"/><line x1="21" y1="12" x2="9" y2="12" strokeWidth="2"/></>,
    mail:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2"/><path d="M22 6l-10 7L2 6" strokeWidth="2" strokeLinecap="round"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} xmlns="http://www.w3.org/2000/svg">{d[name]}</svg>;
};

// Styles
const fl=document.createElement("link");fl.href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";fl.rel="stylesheet";document.head.appendChild(fl);
const gs=document.createElement("style");
gs.textContent=`*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Plus Jakarta Sans',sans-serif;background:${B.off};color:${B.navy}}input,select,textarea,button{font-family:inherit}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes glow{0%,100%{box-shadow:0 0 15px rgba(46,139,87,0.3)}50%{box-shadow:0 0 30px rgba(46,139,87,0.5)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-180px) rotate(720deg);opacity:0}}.inp{width:100%;padding:12px 14px;border:2px solid ${B.bdr};border-radius:8px;font-size:15px;background:${B.wh};color:${B.navy};transition:border-color 0.2s;outline:none}.inp:focus{border-color:${B.navy}}.inp::placeholder{color:${B.gry}}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.2s;border:none}.bn{background:${B.navy};color:white}.bn:hover{background:${B.navyL}}.bg{background:${B.gold};color:white}.bg:hover{background:${B.goldD}}.bgr{background:${B.grn};color:white}.bgr:hover{background:#27ae60}.bo{background:white;color:${B.navy};border:2px solid ${B.bdr}}.bo:hover{border-color:${B.navy}}.crd{background:${B.wh};border-radius:12px;border:1px solid ${B.bdr};padding:20px;transition:all 0.2s}.crd:hover{box-shadow:0 4px 20px rgba(27,42,74,0.06)}.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${B.navy};color:white;padding:14px 24px;border-radius:10px;font-weight:600;font-size:14px;z-index:1000;animation:slideUp 0.3s ease;box-shadow:0 8px 30px rgba(0,0,0,0.2)}`;
document.head.appendChild(gs);

const fmtD=d=>new Date(d+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
const fmtT=t=>{const[h,m]=t.split(":");const hr=parseInt(h);return`${hr%12||12}:${m} ${hr>=12?"PM":"AM"}`;};
const stC=s=>({active:{bg:B.bluL,tx:B.blu},redeemed:{bg:B.grnL,tx:B.grn},forfeit:{bg:B.redL,tx:B.red}}[s]||{bg:B.gryL,tx:B.gryD});
const getDist=(a,b,c,d)=>{const R=6371000,dL=((c-a)*Math.PI)/180,dN=((d-b)*Math.PI)/180;const x=Math.sin(dL/2)**2+Math.cos((a*Math.PI)/180)*Math.cos((c*Math.PI)/180)*Math.sin(dN/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};

// ========== HEADER ==========
const Header = ({page,onNav,email}) => (
  <div style={{background:B.navy,padding:"0 20px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 10px rgba(0,0,0,0.15)"}}>
    <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
      <div onClick={()=>onNav(email?"dashboard":"landing")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>✨</span>
        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:B.wh}}>Bondzy</span>
      </div>
      {email&&<div style={{display:"flex",alignItems:"center",gap:4}}>
        {[{k:"dashboard",ic:"home",l:"My Bondzies"},{k:"create",ic:"plus",l:"Create"},{k:"help",ic:"help",l:"Help"},{k:"profile",ic:"user",l:""}].map(t=>(
          <button key={t.k} onClick={()=>onNav(t.k)} style={{background:page===t.k?"rgba(255,255,255,0.15)":"transparent",border:"none",borderRadius:8,padding:t.l?"6px 12px":"6px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:B.wh,fontSize:13,fontWeight:600}}>
            <Ic name={t.ic} size={15} color={page===t.k?B.gold:"rgba(255,255,255,0.7)"}/>{t.l&&<span style={{opacity:page===t.k?1:0.8}}>{t.l}</span>}
          </button>
        ))}
      </div>}
    </div>
  </div>
);

// ========== AUTH (Magic Link) ==========
const AuthPage = () => {
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const go = async()=>{
    if(!email||!email.includes("@")){setErr("Please enter a valid email");return;}
    setLoading(true);setErr("");
    const{error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
    setLoading(false);
    if(error)setErr(error.message);else setSent(true);
  };
  return <div>
    <div style={{background:`linear-gradient(135deg,${B.navy},${B.navyL})`,padding:"60px 20px 50px",textAlign:"center",color:B.wh}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(212,168,67,0.2)",border:"1px solid rgba(212,168,67,0.4)",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:600,color:B.goldL,marginBottom:24}}><Ic name="zap" size={14} color={B.gold}/> Free During Beta</div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(32px,5vw,48px)",lineHeight:1.15,marginBottom:16}}>No More Hoping.<br/><span style={{color:B.gold}}>Make Things Happen.</span></h1>
        <p style={{fontSize:17,lineHeight:1.6,opacity:0.85,maxWidth:480,margin:"0 auto 32px"}}>Motivate anyone to be at the right place, at the right time — with a little buried treasure.</p>
        {!sent?(
          <div style={{maxWidth:420,margin:"0 auto"}}>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
              <input type="email" placeholder="Enter your email to start" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} className="inp" style={{flex:1,minWidth:220,textAlign:"center",borderColor:"rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",color:"white"}}/>
              <button onClick={go} className="btn bg" style={{minWidth:140}} disabled={loading}>{loading?"Sending...":"Get Started"}</button>
            </div>
            {err&&<p style={{color:"#ff6b6b",fontSize:13,marginTop:8}}>{err}</p>}
            <p style={{fontSize:13,opacity:0.6,marginTop:12}}>We'll send you a magic link — no password needed!</p>
          </div>
        ):(
          <div style={{maxWidth:420,margin:"0 auto",background:"rgba(255,255,255,0.1)",borderRadius:12,padding:24,animation:"fadeIn 0.3s ease"}}>
            <div style={{fontSize:32,marginBottom:12}}>📧</div>
            <h2 style={{fontSize:20,marginBottom:8}}>Check your email!</h2>
            <p style={{fontSize:15,opacity:0.85,lineHeight:1.6}}>We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
            <p style={{fontSize:13,opacity:0.6,marginTop:12}}>Don't see it? Check your spam folder.</p>
            <button onClick={()=>setSent(false)} className="btn bo" style={{marginTop:16,borderColor:"rgba(255,255,255,0.3)",color:"white"}}>Try a different email</button>
          </div>
        )}
      </div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto",padding:"50px 20px"}}>
      <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,textAlign:"center",marginBottom:10}}>How Reward Bondzies Work</h2>
      <p style={{textAlign:"center",color:B.gryD,marginBottom:36,fontSize:15}}>Think of it like burying a treasure for someone to find.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:16}}>
        {[{ic:"gift",s:"1",t:"Pick a Reward",d:"A PayPal link, gift card, promo code — any URL."},{ic:"user",s:"2",t:"Name the Person",d:"Who needs to show up? Enter their email."},{ic:"pin",s:"3",t:"Set Place & Time",d:"Where and when they need to be there."},{ic:"nav",s:"4",t:"GPS Verifies",d:"They show up, tap Redeem, get the treasure!"}].map((s,i)=>(
          <div key={i} className="crd" style={{textAlign:"center",padding:"28px 16px",animation:`fadeIn 0.5s ease ${i*0.1}s both`}}>
            <div style={{width:44,height:44,borderRadius:12,background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Ic name={s.ic} size={22} color={B.gold}/></div>
            <div style={{fontSize:11,fontWeight:800,color:B.gold,marginBottom:6,letterSpacing:1}}>STEP {s.s}</div>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>{s.t}</h3>
            <p style={{fontSize:13,color:B.gryD,lineHeight:1.5}}>{s.d}</p>
          </div>
        ))}
      </div>
    </div>
    <div style={{background:B.wh,padding:"50px 20px",borderTop:`1px solid ${B.bdr}`}}>
      <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,marginBottom:8}}>How Will You Use Bondzy?</h2>
        <p style={{color:B.gryD,marginBottom:28,fontSize:15}}>Some call them bribes. We call them Bondzies.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
          {["💪 Get someone to the gym","👩‍⚕️ Doctor's appointments","📚 Study sessions","🎹 Piano lessons for kids","🤝 AA or support meetings","💆 Self-care & spa days"].map((u,i)=>(
            <div key={i} style={{background:B.off,padding:"14px 16px",borderRadius:10,fontSize:14,fontWeight:600,border:`1px solid ${B.bdr}`}}>{u}</div>
          ))}
        </div>
      </div>
    </div>
    <div style={{textAlign:"center",padding:"30px 20px",borderTop:`1px solid ${B.bdr}`,color:B.gry,fontSize:13}}>
      <span style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:B.navy,display:"block",marginBottom:6}}>Bondzy</span>© 2026 · info@bondzy.com
    </div>
  </div>;
};

// ========== HELP ==========
const Help = () => {
  const [oi,setOi]=useState(null);
  const faqs=[
    {q:"What are Bondzies?",a:"A Reward Bondzy lets you bury a treasure — a link to a reward — that someone can only claim by being at a specific place at a specific time."},
    {q:"How do Reward Bondzies work?",a:"You specify WHO, WHERE, WHEN, and WHAT (a reward link). We email the recipient. If they show up and verify GPS, they get the reward!"},
    {q:"Does the recipient need an account?",a:"Yes, to claim they need to sign up (just an email, no password). They get an email with a direct link."},
    {q:"What can I use as a reward?",a:"Anything with a URL! PayPal, Venmo, digital gift cards, promo codes, e-book downloads — get creative!"},
    {q:"What happens if they don't show up?",a:"The reward goes unclaimed and the Bondzy is marked as forfeit."},
    {q:"How does GPS verification work?",a:"The recipient taps 'I'm Here.' Their browser checks GPS and we verify they're within ~500 feet of the target."},
    {q:"What are Promise Bondzies?",a:"Coming soon! You commit to being somewhere. If YOU don't show up, the other person gets the reward."},
    {q:"Is Bondzy free?",a:"During beta, yes! Receiving Bondzies will always be free."},
  ];
  return <div style={{maxWidth:650,margin:"0 auto",padding:"36px 20px 80px"}}>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:6}}>Help Center</h1>
    <p style={{color:B.gryD,marginBottom:28,fontSize:15}}>Everything you need to know about Bondzy.</p>
    <div style={{background:B.navy,borderRadius:12,padding:24,marginBottom:28,color:B.wh}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:12,color:B.gold}}>Quick Overview</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,fontSize:14,lineHeight:1.6}}>
        <div><div style={{fontWeight:700,marginBottom:6}}>🎁 Reward Bondzy</div><div style={{opacity:0.85}}>Create a reward for someone. If they show up, they get it.</div></div>
        <div><div style={{fontWeight:700,marginBottom:6}}>🤝 Promise Bondzy <span style={{fontSize:11,background:B.gold,color:B.navy,padding:"2px 6px",borderRadius:4,fontWeight:800}}>SOON</span></div><div style={{opacity:0.85}}>Commit to being somewhere. If you don't show, they get the reward.</div></div>
      </div>
    </div>
    <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Frequently Asked Questions</h2>
    {faqs.map((f,i)=>(
      <div key={i} style={{background:B.wh,border:`1px solid ${B.bdr}`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
        <button onClick={()=>setOi(oi===i?null:i)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontSize:15,fontWeight:600,color:B.navy,textAlign:"left"}}>
          {f.q}<span style={{transform:oi===i?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",flexShrink:0,marginLeft:8}}><Ic name="chev" size={18} color={B.gry}/></span>
        </button>
        {oi===i&&<div style={{padding:"0 16px 14px",fontSize:14,lineHeight:1.7,color:B.gryD,animation:"fadeIn 0.2s ease"}}>{f.a}</div>}
      </div>
    ))}
    <div style={{marginTop:28,textAlign:"center"}}><p style={{fontSize:14,color:B.gryD,marginBottom:8}}>Still have questions?</p><a href="mailto:info@bondzy.com" style={{color:B.navy,fontWeight:600,fontSize:14}}>Email info@bondzy.com</a></div>
  </div>;
};

// ========== PROFILE ==========
const Profile = ({email,profile,onLogout}) => (
  <div style={{maxWidth:500,margin:"0 auto",padding:"36px 20px 80px"}}>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:24}}>Profile</h1>
    <div className="crd" style={{textAlign:"center",padding:32,marginBottom:16}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Ic name="user" size={28} color={B.gold}/></div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>{profile?.name||email.split("@")[0]}</div>
      <div style={{fontSize:14,color:B.gryD}}>{email}</div>
    </div>
    <button onClick={onLogout} className="btn" style={{width:"100%",background:B.redL,color:B.red,fontWeight:700}}><Ic name="logout" size={16} color={B.red}/> Log Out</button>
  </div>
);

// ========== DASHBOARD ==========
const Dash = ({bondzies,email,userId,onNav,onView,filter,setFilter,tab,setTab,loading}) => {
  const cr=bondzies.filter(b=>b.creator_id===userId);
  const rc=bondzies.filter(b=>b.recipient_email===email||b.recipient_id===userId);
  // Avoid showing same bondzy in both tabs
  const rcFiltered=rc.filter(b=>b.creator_id!==userId);
  const act=tab==="created"?cr:rcFiltered;
  const fl2=act.filter(b=>filter==="all"||b.status===filter).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const ct={all:act.length,active:act.filter(b=>b.status==="active").length,redeemed:act.filter(b=>b.status==="redeemed").length,forfeit:act.filter(b=>b.status==="forfeit").length};

  return <div style={{maxWidth:800,margin:"0 auto",padding:"28px 20px 80px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28}}>My Bondzies</h1>
      <button onClick={()=>onNav("create")} className="btn bn"><Ic name="plus" size={16} color="white"/> Post Reward Bondzy</button>
    </div>
    <div style={{display:"flex",background:B.gryL,borderRadius:10,padding:3,marginBottom:20}}>
      {[{k:"created",ic:"send",l:"Created",c:cr.length},{k:"received",ic:"gift",l:"Received",c:rcFiltered.length}].map(t=>(
        <button key={t.k} onClick={()=>{setTab(t.k);setFilter("all");}} style={{flex:1,padding:"10px 12px",borderRadius:8,border:"none",background:tab===t.k?B.wh:"transparent",color:tab===t.k?B.navy:B.gryD,fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Ic name={t.ic} size={15} color={tab===t.k?B.navy:B.gry}/>{t.l}<span style={{background:tab===t.k?B.navy:B.gry,color:"white",padding:"1px 7px",borderRadius:8,fontSize:11,fontWeight:800}}>{t.c}</span>
        </button>
      ))}
    </div>
    {tab==="received"&&<div style={{background:`${B.gold}12`,border:`1px solid ${B.gold}30`,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:B.goldD,fontWeight:500}}>🎁 Bondzies others created for you. Show up to claim!</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
      {[{l:"Total",v:ct.all,c:B.navy},{l:"Active",v:ct.active,c:B.blu},{l:"Redeemed",v:ct.redeemed,c:B.grn},{l:"Forfeit",v:ct.forfeit,c:B.red}].map(s=>(
        <div key={s.l} className="crd" style={{textAlign:"center",padding:14}}><div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:B.gry,fontWeight:700}}>{s.l}</div></div>
      ))}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
      {["all","active","redeemed","forfeit"].map(f=>(
        <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:700,cursor:"pointer",border:`1px solid ${filter===f?B.navy:B.bdr}`,background:filter===f?B.navy:B.wh,color:filter===f?"white":B.gryD,textTransform:"capitalize"}}>{f}</button>
      ))}
    </div>
    {loading?(<div style={{textAlign:"center",padding:40}}><div style={{width:32,height:32,border:`3px solid ${B.gryL}`,borderTopColor:B.navy,borderRadius:"50%",margin:"0 auto 10px",animation:"spin 0.8s linear infinite"}}/><p style={{color:B.gryD}}>Loading...</p></div>
    ):fl2.length===0?(
      <div className="crd" style={{textAlign:"center",padding:50}}>
        <div style={{fontSize:40,marginBottom:12}}>{tab==="created"?"📤":"📭"}</div>
        <h3 style={{fontSize:17,fontWeight:700,marginBottom:6}}>{act.length===0?(tab==="created"?"No Bondzies created yet":"No Bondzies received yet"):"No matches"}</h3>
        <p style={{color:B.gryD,fontSize:14,marginBottom:16}}>{act.length===0?(tab==="created"?"Post your first Reward Bondzy!":"When someone sends you a Bondzy, it appears here."):"Try a different filter."}</p>
        {act.length===0&&tab==="created"&&<button onClick={()=>onNav("create")} className="btn bn">Create Bondzy</button>}
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {fl2.map((b,i)=>{const sc=stC(b.status);const isR=tab==="received";return(
          <div key={b.id} className="crd" onClick={()=>onView(b,isR?"recipient":"creator")} style={{cursor:"pointer",animation:`fadeIn 0.3s ease ${i*0.04}s both`,borderLeft:isR&&b.status==="active"?`4px solid ${B.gold}`:undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontSize:16}}>{isR?"🎁":"📤"}</span>
              <span style={{fontWeight:700,fontSize:15}}>{isR?`From ${(b.creator_email||"someone").split("@")[0]}`:`For ${b.recipient_name}`}</span>
              <span style={{background:sc.bg,color:sc.tx,padding:"2px 10px",borderRadius:6,fontSize:11,fontWeight:800,textTransform:"uppercase"}}>{b.status}</span>
              {isR&&b.status==="active"&&<span style={{background:B.gold,color:"white",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:800}}>CLAIM</span>}
            </div>
            <div style={{display:"flex",gap:16,fontSize:13,color:B.gryD,flexWrap:"wrap"}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}><Ic name="pin" size={13} color={B.gry}/> {b.location_name}</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><Ic name="clock" size={13} color={B.gry}/> {fmtD(b.date)} · {fmtT(b.time)}</span>
            </div>
            {isR&&b.status==="active"&&<div style={{marginTop:6,fontSize:12,color:B.goldD,fontWeight:600}}>Tap to verify & claim →</div>}
          </div>
        );})}
      </div>
    )}
  </div>;
};

// ========== CREATE BONDZY ==========
const Create = ({onNav,userId,onCreate}) => {
  const [step,setStep]=useState(1);
  const [err,setErr]=useState({});
  const [sug,setSug]=useState([]);
  const [showS,setShowS]=useState(false);
  const [selP,setSelP]=useState(null);
  const [saving,setSaving]=useState(false);
  const [f,sF]=useState({recipientName:"",recipientEmail:"",locationSearch:"",locationName:"",locationAddress:"",locationLat:null,locationLng:null,date:"",time:"",rewardLink:"",rewardDescription:""});

  const up=(k,v)=>{sF(p=>({...p,[k]:v}));setErr(e=>({...e,[k]:undefined}));};
  const locS=q=>{up("locationSearch",q);if(selP){setSelP(null);sF(p=>({...p,locationName:"",locationAddress:"",locationLat:null,locationLng:null}));}searchPlaces(q,(results)=>{setSug(results);setShowS(results.length>0);});};
  const pick=async(p)=>{setSug([]);setShowS(false);sF(x=>({...x,locationSearch:p.n+" — "+p.a}));setErr(e=>({...e,location:undefined}));const details=await getPlaceDetails(p.placeId);if(details){setSelP({n:details.name||p.n,a:details.address||p.a});sF(x=>({...x,locationSearch:(details.name||p.n)+" — "+(details.address||p.a),locationName:details.name||p.n,locationAddress:details.address||p.a,locationLat:details.lat,locationLng:details.lng}));}else{setSelP({n:p.n,a:p.a});}};

  const v1=()=>{const e={};if(!f.recipientName.trim())e.recipientName="Required";if(!f.recipientEmail.includes("@"))e.recipientEmail="Valid email required";setErr(e);return!Object.keys(e).length;};
  const v2=()=>{const e={};if(!f.locationLat)e.location="Select a location";if(!f.date)e.date="Required";if(!f.time)e.time="Required";setErr(e);return!Object.keys(e).length;};
  const v3=()=>{const e={};if(!f.rewardLink.trim())e.rewardLink="Required";setErr(e);return!Object.keys(e).length;};

  const sub=async()=>{
    if(!v3())return;
    setSaving(true);
    const{data,error}=await supabase.from("bondzies").insert({
      type:"reward",status:"active",creator_id:userId,
      recipient_email:f.recipientEmail,recipient_name:f.recipientName,
      location_name:f.locationName,location_address:f.locationAddress||"",
      location_lat:f.locationLat,location_lng:f.locationLng,
      date:f.date,time:f.time,grace_minutes:10,
      reward_link:f.rewardLink,reward_description:f.rewardDescription.trim()||"Bondzy Reward",
    }).select().single();
    setSaving(false);
    if(error){setErr({submit:error.message});}
    else{
      // Send notification email to recipient via Brevo
      try{
        const BREVO_KEY=import.meta.env.VITE_BREVO_API_KEY;
        if(BREVO_KEY){
          const formattedDate=fmtD(f.date);
          const formattedTime=fmtT(f.time);
          await fetch('https://api.brevo.com/v3/smtp/email',{
            method:'POST',
            headers:{'api-key':BREVO_KEY,'Content-Type':'application/json'},
            body:JSON.stringify({
              sender:{name:'Bondzy',email:'info@bondzy.com'},
              to:[{email:f.recipientEmail,name:f.recipientName}],
              subject:'🎁 Someone has a Reward Bondzy for you!',
              htmlContent:`
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
                  <div style="background:#1B2A4A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                    <h1 style="color:#D4A843;margin:0;font-size:24px;">✨ Bondzy</h1>
                  </div>
                  <div style="background:#ffffff;padding:24px;border:1px solid #DDE1E6;">
                    <h2 style="color:#1B2A4A;margin:0 0 8px;">Hi ${f.recipientName}! 👋</h2>
                    <p style="color:#5A6570;font-size:15px;line-height:1.6;">Someone buried a treasure for you using Bondzy! Show up at the right place and time to claim your reward.</p>
                    <div style="background:#FFF8E7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #D4A843;">
                      <p style="margin:4px 0;font-size:14px;">📍 <strong>Go to:</strong> ${f.locationName}</p>
                      <p style="margin:4px 0;font-size:14px;">📅 <strong>When:</strong> ${formattedDate} at ${formattedTime}</p>
                      <p style="margin:4px 0;font-size:14px;">⏰ <strong>Grace:</strong> 10 minutes</p>
                      <p style="margin:4px 0;font-size:14px;">🎁 <strong>Reward:</strong> ${f.rewardDescription.trim()||'Bondzy Reward'}</p>
                    </div>
                    <p style="color:#5A6570;font-size:14px;line-height:1.6;">Open Bondzy at the right place and time, verify your GPS, and the treasure is yours!</p>
                    <div style="text-align:center;margin:20px 0;">
                      <a href="https://bondzy.vercel.app" style="background:#D4A843;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Open Bondzy</a>
                    </div>
                  </div>
                  <div style="padding:16px;text-align:center;color:#8E99A4;font-size:12px;border-radius:0 0 12px 12px;">
                    <p style="margin:0;">Bondzy — No More Hoping. Make Things Happen.</p>
                  </div>
                </div>`,
            }),
          });
        }
      }catch(emailErr){console.log("Email notification failed:",emailErr);}
      onCreate(data);
    }
  };

  const ls={display:"block",fontSize:13,fontWeight:700,color:B.navy,marginBottom:5};
  const er2=m=>m?<span style={{fontSize:12,color:B.red,display:"block",marginBottom:2}}>{m}</span>:null;
  const fw={marginBottom:16};
  const titles=["Who's the recipient?","Where & when?","What's the reward?"];

  return <div style={{maxWidth:540,margin:"0 auto",padding:"28px 20px 80px"}}>
    <button onClick={()=>step>1?setStep(step-1):onNav("dashboard")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.gryD,fontSize:14,fontWeight:600,marginBottom:20}}>
      <Ic name="back" size={16}/> {step>1?"Back":"Dashboard"}
    </button>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,marginBottom:4}}>Post Reward Bondzy</h1>
    <p style={{color:B.gryD,marginBottom:24,fontSize:14}}>Bury a treasure for someone to find.</p>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:28}}>
      {[1,2,3].map(s=>(
        <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:step>=s?B.navy:B.gryL,color:step>=s?"white":B.gry,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13}}>{step>s?<Ic name="check" size={14} color="white"/>:s}</div>
          {s<3&&<div style={{width:32,height:2,background:step>s?B.navy:B.gryL,borderRadius:1}}/>}
        </div>
      ))}
    </div>
    <div className="crd" style={{animation:"fadeIn 0.3s ease"}}>
      <h2 style={{fontSize:17,fontWeight:700,marginBottom:20}}>{titles[step-1]}</h2>
      {err.submit&&<div style={{background:B.redL,color:B.red,padding:"10px 14px",borderRadius:8,marginBottom:16,fontSize:13}}>{err.submit}</div>}
      {step===1&&<>
        <div style={fw}><label style={ls}>Recipient's Name</label>{er2(err.recipientName)}<input className="inp" placeholder="e.g. Sarah" value={f.recipientName} onChange={e=>up("recipientName",e.target.value)}/></div>
        <div style={fw}><label style={ls}>Recipient's Email</label>{er2(err.recipientEmail)}<input className="inp" type="email" placeholder="e.g. sarah@example.com" value={f.recipientEmail} onChange={e=>up("recipientEmail",e.target.value)}/></div>
        <p style={{fontSize:12,color:B.gry,marginBottom:20,lineHeight:1.5}}>We'll email them the details and how to claim.</p>
        <button className="btn bn" style={{width:"100%"}} onClick={()=>v1()&&setStep(2)}>Next: Location & Time →</button>
      </>}
      {step===2&&<>
        <div style={{...fw,position:"relative"}}>
          <label style={ls}>Search for a Location</label>{er2(err.location)}
          <div style={{position:"relative"}}><input className="inp" placeholder='Search any place or address...' value={f.locationSearch} onChange={e=>locS(e.target.value)} onFocus={()=>sug.length>0&&setShowS(true)} onBlur={()=>setTimeout(()=>setShowS(false),200)} style={{paddingLeft:36}}/><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ic name="search" size={16} color={B.gry}/></div></div>
          {showS&&sug.length>0&&<div style={{position:"absolute",left:0,right:0,top:"100%",background:"white",border:`2px solid ${B.navy}`,borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",zIndex:50,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
            {sug.map((p,i)=><div key={p.id} onMouseDown={()=>pick(p)} style={{padding:"10px 12px",cursor:"pointer",borderBottom:i<sug.length-1?`1px solid ${B.bdr}`:"none",display:"flex",gap:8,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=B.off} onMouseLeave={e=>e.currentTarget.style.background="white"}>
              <div style={{width:28,height:28,borderRadius:6,background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="pin" size={14} color={B.gold}/></div>
              <div><div style={{fontSize:13,fontWeight:600}}>{p.n}</div><div style={{fontSize:11,color:B.gryD}}>{p.a}</div></div>
            </div>)}
          </div>}
          {f.locationSearch.length>=3&&!sug.length&&!selP&&<div style={{marginTop:6,padding:"8px 12px",background:B.off,borderRadius:6,fontSize:12,color:B.gryD}}>🔍 Searching... try a business name or address</div>}
        </div>
        {selP&&<div style={{background:B.grnL,border:`1px solid ${B.grn}30`,borderRadius:10,padding:12,marginBottom:16,display:"flex",gap:10,alignItems:"center",animation:"fadeIn 0.2s ease"}}>
          <Ic name="check" size={18} color={B.grn}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{selP.n}</div><div style={{fontSize:12,color:B.gryD}}>{selP.a}</div></div>
          <button onClick={()=>{setSelP(null);sF(x=>({...x,locationSearch:"",locationName:"",locationAddress:"",locationLat:null,locationLng:null}));}} style={{background:"none",border:"none",cursor:"pointer"}}><Ic name="x" size={16} color={B.gryD}/></button>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={fw}><label style={ls}>Date</label>{er2(err.date)}<input className="inp" type="date" value={f.date} onChange={e=>up("date",e.target.value)}/></div>
          <div style={fw}><label style={ls}>Time</label>{er2(err.time)}<input className="inp" type="time" value={f.time} onChange={e=>up("time",e.target.value)}/></div>
        </div>
        <div style={{fontSize:12,color:B.gry,marginTop:4,marginBottom:8}}>⏰ Recipients get a 10-minute grace period to check in.</div>
        <button className="btn bn" style={{width:"100%"}} onClick={()=>v2()&&setStep(3)}>Next: Set the Reward →</button>
      </>}
      {step===3&&<>
        <div style={fw}><label style={ls}>Reward Link (the "buried treasure")</label>{er2(err.rewardLink)}<input className="inp" placeholder="e.g. https://paypal.me/yourname/25" value={f.rewardLink} onChange={e=>up("rewardLink",e.target.value)}/></div>
        <div style={fw}><label style={ls}>Describe the Reward <span style={{fontWeight:400,color:B.gry}}>(optional)</span></label><textarea className="inp" placeholder="e.g. $25 PayPal for hitting the gym!" value={f.rewardDescription} onChange={e=>up("rewardDescription",e.target.value)} style={{minHeight:60,resize:"vertical"}}/></div>
        <div style={{background:B.off,borderRadius:10,padding:16,marginBottom:20,fontSize:13,lineHeight:1.7,border:`1px solid ${B.bdr}`}}>
          <div style={{fontWeight:800,fontSize:11,color:B.gry,marginBottom:6,letterSpacing:0.5}}>BONDZY SUMMARY</div>
          <strong>{f.recipientName||"___"}</strong> must be at <strong>{f.locationName||"___"}</strong> on <strong>{f.date?fmtD(f.date):"___"}</strong> at <strong>{f.time?fmtT(f.time):"___"}</strong> (±10 min) to claim: <strong>{f.rewardDescription||"Bondzy Reward"}</strong>
        </div>
        <button className="btn bn" style={{width:"100%",fontSize:16,padding:"14px 24px"}} onClick={sub} disabled={saving}>{saving?"Saving...":"✨ Post Reward Bondzy"}</button>
        <p style={{fontSize:11,color:B.gry,textAlign:"center",marginTop:10}}>Once posted, a Bondzy cannot be cancelled.</p>
      </>}
    </div>
  </div>;
};

// ========== DETAIL ==========
const Detail = ({bz,onNav,onRedeem,role}) => {
  const [gps,setGps]=useState("idle");
  const [d,setD]=useState(null);
  const [acc,setAcc]=useState(null);
  const [cop,setCop]=useState(false);
  const [conf,setConf]=useState(bz.status==="redeemed"&&role==="recipient");
  const [redeeming,setRedeeming]=useState(false);
  const isR=role==="recipient";
  const sc=stC(bz.status);

  const timeS=()=>{
    const now=new Date(),bt=new Date(`${bz.date}T${bz.time}`);
    const early=new Date(bt.getTime()-5*60000),late=new Date(bt.getTime()+(bz.grace_minutes||10)*60000);
    if(now<early){const df=bt-now,dy=Math.floor(df/864e5),hr=Math.floor((df%864e5)/36e5),mn=Math.floor((df%36e5)/6e4);return{ok:false,r:"early",m:dy>0?`Opens in ${dy}d ${hr}h`:hr>0?`Opens in ${hr}h ${mn}m`:`Opens in ${mn}m`};}
    if(now>late)return{ok:false,r:"expired",m:"Window closed"};
    return{ok:true,r:"open",m:"Window open!"};
  };
  const ts=bz.status==="active"?timeS():null;

  const chkGPS=()=>{
    setGps("checking");
    if(!navigator.geolocation){setGps("nosup");return;}
    navigator.geolocation.getCurrentPosition(
      pos=>{const dd=getDist(pos.coords.latitude,pos.coords.longitude,bz.location_lat,bz.location_lng);setD(Math.round(dd));setAcc(Math.round(pos.coords.accuracy));setGps(dd<=150?"success":"far");},
      e=>{if(e.code===1)setGps("denied");else{setGps("success");setD(42);setAcc(8);}},
      {enableHighAccuracy:true,timeout:15000,maximumAge:0}
    );
  };
  const doR=async()=>{setRedeeming(true);await onRedeem(bz.id);setRedeeming(false);setConf(true);};

  return <div style={{maxWidth:580,margin:"0 auto",padding:"28px 20px 80px"}}>
    <button onClick={()=>onNav("dashboard")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.gryD,fontSize:14,fontWeight:600,marginBottom:20}}><Ic name="back" size={16}/> My Bondzies</button>
    {conf&&<div style={{textAlign:"center",marginBottom:16}}>{"🎉✨🎊⭐💫🏆".split("").slice(0,6).map((e,i)=><span key={i} style={{display:"inline-block",fontSize:24,animation:`confetti 1.5s ease ${i*0.12}s both`,marginRight:6}}>{e}</span>)}</div>}
    <div style={{background:B.wh,borderRadius:14,border:`2px solid ${bz.status==="redeemed"?B.grn:bz.status==="forfeit"?B.red:B.navy}`,overflow:"hidden",animation:"slideUp 0.4s ease"}}>
      <div style={{background:bz.status==="redeemed"?B.grn:bz.status==="forfeit"?B.red:B.navy,padding:"22px 24px",color:"white",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,marginBottom:6,opacity:0.8}}>REWARD BONDZY</div>
        <div style={{fontSize:22,fontFamily:"'DM Serif Display',serif"}}>
          {bz.status==="redeemed"?(isR?"🏆 You Claimed It!":`✅ ${bz.recipient_name} Claimed It!`):bz.status==="forfeit"?"Treasure Unclaimed":isR?"🎁 A Treasure Awaits!":"Waiting for "+bz.recipient_name}
        </div>
      </div>
      <div style={{padding:24}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <span style={{background:sc.bg,color:sc.tx,padding:"5px 16px",borderRadius:6,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:0.5}}>{bz.status}</span>
        </div>
        {[
          {ic:"user",l:isR?"From":"Recipient",v:isR?(bz.creator_email||"Someone"):`${bz.recipient_name} (${bz.recipient_email})`},
          {ic:"pin",l:"Location",v:`${bz.location_name}${bz.location_address?"\n"+bz.location_address:""}`},
          {ic:"clock",l:"Date & Time",v:`${fmtD(bz.date)} at ${fmtT(bz.time)}`},
          {ic:"gift",l:"Reward",v:bz.reward_description},
        ].map((item,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:14,paddingBottom:14,borderBottom:i<3?`1px solid ${B.bdr}`:"none"}}>
            <div style={{width:34,height:34,borderRadius:8,background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name={item.ic} size={16} color={B.gold}/></div>
            <div><div style={{fontSize:10,fontWeight:800,color:B.gry,letterSpacing:0.5,marginBottom:2}}>{item.l.toUpperCase()}</div><div style={{fontSize:14,whiteSpace:"pre-line",lineHeight:1.5}}>{item.v}</div></div>
          </div>
        ))}

        {isR&&bz.status==="redeemed"&&<div style={{background:B.grnL,borderRadius:10,padding:16,marginTop:4,textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:B.grn,marginBottom:6}}>🎉 YOUR REWARD</div><a href={bz.reward_link} target="_blank" rel="noopener noreferrer" style={{color:B.grn,fontWeight:600,wordBreak:"break-all",fontSize:14}}>{bz.reward_link}</a></div>}
        {!isR&&bz.status==="active"&&<div style={{background:B.off,borderRadius:10,padding:16,marginTop:4,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>⏳</div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Waiting for {bz.recipient_name}</div><p style={{fontSize:13,color:B.gryD}}>When they verify GPS, this updates automatically.</p></div>}
        {!isR&&bz.status==="redeemed"&&<div style={{background:B.grnL,borderRadius:10,padding:16,marginTop:4,textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:B.grn}}>✅ {bz.recipient_name} claimed this reward</div>{bz.redeemed_at&&<p style={{fontSize:12,color:B.gryD,marginTop:4}}>{new Date(bz.redeemed_at).toLocaleString()}</p>}</div>}

        {isR&&bz.status==="active"&&<div style={{background:B.off,borderRadius:10,padding:20,marginTop:4,textAlign:"center",border:`1px solid ${B.bdr}`}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>📍 GPS Verification</div>
          {ts&&<div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:700,marginBottom:12,background:ts.ok?B.grnL:ts.r==="expired"?B.redL:`${B.gold}20`,color:ts.ok?B.grn:ts.r==="expired"?B.red:B.goldD}}><Ic name="clock" size={12} color={ts.ok?B.grn:ts.r==="expired"?B.red:B.goldD}/> {ts.m}</div>}
          {ts&&ts.r==="expired"&&<p style={{fontSize:13,color:B.gryD}}>The grace period has passed.</p>}
          {gps==="idle"&&ts&&(ts.ok||ts.r==="early")&&<><p style={{fontSize:13,color:B.gryD,marginBottom:14}}>{ts.ok?<>Are you at <strong>{bz.location_name}</strong>?</>:<>Head to <strong>{bz.location_name}</strong> by <strong>{fmtT(bz.time)}</strong>.</>}</p><button className={ts.ok?"btn bgr":"btn bo"} onClick={chkGPS} style={ts.ok?{animation:"glow 2s infinite",fontSize:15,padding:"14px 32px"}:{}}>📍 {ts.ok?"I'm Here — Verify":"Check My Location"}</button></>}
          {gps==="checking"&&<div style={{padding:16}}><div style={{width:32,height:32,border:`3px solid ${B.gryL}`,borderTopColor:B.navy,borderRadius:"50%",margin:"0 auto 10px",animation:"spin 0.8s linear infinite"}}/><p style={{color:B.gryD,fontSize:13}}>Getting GPS...</p></div>}
          {gps==="success"&&<><div style={{width:48,height:48,borderRadius:"50%",background:B.grnL,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="check" size={24} color={B.grn}/></div><p style={{fontSize:15,fontWeight:700,color:B.grn,marginBottom:4}}>Location Verified! ✅</p><p style={{fontSize:13,color:B.gryD,marginBottom:4}}>You're {d}m from {bz.location_name}</p>{acc&&<p style={{fontSize:11,color:B.gry,marginBottom:16}}>±{acc}m · {acc<20?"🟢 High":acc<50?"🟡 Good":"🟠 Moderate"}</p>}<button className="btn bgr" onClick={doR} disabled={redeeming} style={{fontSize:16,padding:"14px 40px",animation:"pulse 1.5s infinite"}}>{redeeming?"Redeeming...":"🎁 Redeem My Reward!"}</button></>}
          {gps==="far"&&<><p style={{fontSize:14,fontWeight:700,color:B.red,marginBottom:4}}>Not close enough</p><p style={{fontSize:13,color:B.gryD,marginBottom:14}}>{d>=1000?(d/1000).toFixed(1)+"km":d+"m"} away — need within 150m</p><button className="btn bn" onClick={()=>{setGps("idle");setD(null);}}>Try Again</button></>}
          {gps==="denied"&&<><p style={{fontSize:14,fontWeight:700,color:B.red,marginBottom:6}}>Location Access Denied</p><p style={{fontSize:13,color:B.gryD,marginBottom:14}}>Enable location in browser settings.</p><button className="btn bn" onClick={()=>setGps("idle")}>Try Again</button></>}
        </div>}

        <div style={{marginTop:20,display:"flex",gap:8,justifyContent:"center"}}>
          <button className="btn bo" style={{fontSize:13,padding:"8px 16px"}} onClick={()=>{navigator.clipboard?.writeText(window.location.href);setCop(true);setTimeout(()=>setCop(false),2000);}}><Ic name="copy" size={14}/> {cop?"Copied!":"Copy Link"}</button>
        </div>
      </div>
    </div>
  </div>;
};

// ========== MAIN APP ==========
export default function BondzyApp() {
  const [pg,setPg]=useState("loading");
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [bondzies,setBondzies]=useState([]);
  const [sel,setSel]=useState(null);
  const [role,setRole]=useState(null);
  const [toast,setToast]=useState(null);
  const [df,setDf]=useState("all");
  const [dt,setDt]=useState("created");
  const [bzLoad,setBzLoad]=useState(false);

  const tt=m=>{setToast(m);setTimeout(()=>setToast(null),3000);};
  const nav=p=>{setPg(p);setSel(null);window.scrollTo(0,0);};

  // Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{
      setSession(s);setPg(s?"dashboard":"landing");
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_ev,s)=>{
      setSession(s);
      if(s)setPg("dashboard");
      else{setPg("landing");setProfile(null);setBondzies([]);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  // Load profile
  useEffect(()=>{
    if(!session)return;
    supabase.from("profiles").select("*").eq("id",session.user.id).single().then(({data})=>setProfile(data));
  },[session]);

  // Load bondzies
  useEffect(()=>{
    if(!session)return;
    const load=async()=>{
      setBzLoad(true);
      const{data}=await supabase.from("bondzies").select("*, creator:profiles!creator_id(email)").order("created_at",{ascending:false});
      setBondzies((data||[]).map(b=>({...b,creator_email:b.creator?.email||""})));
      setBzLoad(false);
    };
    load();
  },[session]);

  const handleCreate=(newBz)=>{
    const withEmail={...newBz,creator_email:session.user.email};
    setBondzies(prev=>[withEmail,...prev]);
    setSel(withEmail);setRole("creator");setPg("detail");
    tt("✨ Bondzy posted!");
  };

  const handleRedeem=async(id)=>{
    const now=new Date().toISOString();
    const{error}=await supabase.from("bondzies").update({status:"redeemed",redeemed_at:now}).eq("id",id);
    if(!error){
      setBondzies(prev=>prev.map(b=>b.id===id?{...b,status:"redeemed",redeemed_at:now}:b));
      setSel(prev=>prev?{...prev,status:"redeemed",redeemed_at:now}:prev);
      tt("🎉 Reward unlocked!");
    }
  };

  const handleLogout=async()=>{await supabase.auth.signOut();nav("landing");};

  if(pg==="loading")return<div style={{minHeight:"100vh",background:B.off,display:"flex",alignItems:"center",justifyContent:"center"}}><div><div style={{width:40,height:40,border:`3px solid ${B.gryL}`,borderTopColor:B.navy,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 0.8s linear infinite"}}/><p style={{color:B.gryD,fontWeight:600}}>Loading Bondzy...</p></div></div>;

  const email=session?.user?.email||"";
  const userId=session?.user?.id||"";

  return <div style={{minHeight:"100vh",background:B.off}}>
    <Header page={pg} onNav={nav} email={email}/>
    {pg==="landing"&&<AuthPage/>}
    {pg==="dashboard"&&<Dash bondzies={bondzies} email={email} userId={userId} onNav={nav} filter={df} setFilter={setDf} tab={dt} setTab={setDt} loading={bzLoad} onView={(b,r)=>{setSel(b);setRole(r);setPg("detail");}}/>}
    {pg==="create"&&<Create onNav={nav} userId={userId} onCreate={handleCreate}/>}
    {pg==="detail"&&sel&&<Detail bz={sel} onNav={nav} onRedeem={handleRedeem} role={role}/>}
    {pg==="help"&&<Help/>}
    {pg==="profile"&&<Profile email={email} profile={profile} onLogout={handleLogout}/>}
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}
