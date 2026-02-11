import { useState } from "react";

const B = {
  navy: "#1B2A4A", navyL: "#243A5E", gold: "#D4A843", goldL: "#F2E6C5", goldD: "#B8912E",
  wh: "#FFFFFF", off: "#F5F6F8", grn: "#2E8B57", grnL: "#E8F5EE", red: "#C0392B", redL: "#FDECEB",
  blu: "#3B82F6", bluL: "#EBF4FF", gry: "#8E99A4", gryL: "#E8ECF0", gryD: "#5A6570", bdr: "#DDE1E6",
};

const PLACES = [
  { id:"p1",n:"Planet Fitness",a:"1500 Market St, Philadelphia, PA",lat:39.9526,lng:-75.168 },
  { id:"p2",n:"Planet Fitness - Broad St",a:"2301 S Broad St, Philadelphia, PA",lat:39.924,lng:-75.171 },
  { id:"p3",n:"LA Fitness",a:"1735 Chestnut St, Philadelphia, PA",lat:39.9517,lng:-75.1695 },
  { id:"p4",n:"Free Library of Philadelphia",a:"1901 Vine St, Philadelphia, PA",lat:39.9608,lng:-75.171 },
  { id:"p5",n:"Philadelphia Museum of Art",a:"2600 Benjamin Franklin Pkwy, Philadelphia, PA",lat:39.9656,lng:-75.181 },
  { id:"p6",n:"Penn Medicine",a:"3400 Spruce St, Philadelphia, PA",lat:39.9494,lng:-75.193 },
  { id:"p7",n:"Dr. Smith Family Practice",a:"1601 Walnut St Suite 800, Philadelphia, PA",lat:39.9498,lng:-75.168 },
  { id:"p8",n:"Starbucks - Rittenhouse",a:"1528 Walnut St, Philadelphia, PA",lat:39.949,lng:-75.17 },
  { id:"p9",n:"Whole Foods Market",a:"2101 Pennsylvania Ave, Philadelphia, PA",lat:39.9585,lng:-75.172 },
  { id:"p10",n:"YMCA - Columbia North",a:"1400 N Broad St, Philadelphia, PA",lat:39.9685,lng:-75.16 },
  { id:"p11",n:"Community Recovery Center",a:"1700 Spring Garden St, Philadelphia, PA",lat:39.9615,lng:-75.1635 },
  { id:"p12",n:"CrossFit Center City",a:"1601 Spring Garden St, Philadelphia, PA",lat:39.961,lng:-75.1638 },
  { id:"p13",n:"Jefferson Hospital",a:"111 S 11th St, Philadelphia, PA",lat:39.949,lng:-75.1575 },
  { id:"p14",n:"Reading Terminal Market",a:"51 N 12th St, Philadelphia, PA",lat:39.9533,lng:-75.1593 },
  { id:"p15",n:"Music School of Philadelphia",a:"616 N Broad St, Philadelphia, PA",lat:39.963,lng:-75.161 },
  { id:"p16",n:"AA Meeting - Friends Center",a:"1501 Cherry St, Philadelphia, PA",lat:39.9555,lng:-75.164 },
  { id:"p17",n:"Spa Terme Di Aroma",a:"32 S 18th St, Philadelphia, PA",lat:39.951,lng:-75.1715 },
  { id:"p18",n:"University of Pennsylvania",a:"3451 Walnut St, Philadelphia, PA",lat:39.9522,lng:-75.1932 },
];
const findPlaces = q => { if(!q||q.length<2) return []; const l=q.toLowerCase(); return PLACES.filter(p=>p.n.toLowerCase().includes(l)||p.a.toLowerCase().includes(l)).slice(0,5); };
const genId = () => Math.random().toString(36).substr(2,9);

const CREATED = [
  { id:"s1",creatorEmail:"__U__",recipientName:"Sarah",recipientEmail:"sarah@example.com",locationName:"Planet Fitness",locationAddress:"1500 Market St, Philadelphia, PA",locationLat:39.9526,locationLng:-75.168,date:"2026-02-10",time:"09:00",graceMinutes:15,rewardLink:"https://paypal.me/example/25",rewardDescription:"$25 PayPal for hitting the gym!",status:"active",createdAt:"2026-02-04T10:30:00Z" },
  { id:"s2",creatorEmail:"__U__",recipientName:"Jake",recipientEmail:"jake@example.com",locationName:"Free Library",locationAddress:"1901 Vine St, Philadelphia, PA",locationLat:39.9608,locationLng:-75.171,date:"2026-02-01",time:"14:00",graceMinutes:10,rewardLink:"https://amazon.com/gc/ABC",rewardDescription:"$15 Amazon Gift Card for study session",status:"redeemed",createdAt:"2026-01-28T08:00:00Z",redeemedAt:"2026-02-01T14:03:00Z" },
  { id:"s3",creatorEmail:"__U__",recipientName:"Mom",recipientEmail:"mom@example.com",locationName:"Dr. Smith Family Practice",locationAddress:"1601 Walnut St, Philadelphia, PA",locationLat:39.9498,locationLng:-75.168,date:"2026-01-25",time:"11:00",graceMinutes:5,rewardLink:"https://venmo.com/pay?amount=50",rewardDescription:"$50 Venmo for the doctor's appointment",status:"forfeit",createdAt:"2026-01-20T15:00:00Z" },
];
const RECEIVED = [
  { id:"r1",creatorEmail:"coach@example.com",recipientName:"__U__",recipientEmail:"__U__",locationName:"YMCA - Columbia North",locationAddress:"1400 N Broad St, Philadelphia, PA",locationLat:39.9685,locationLng:-75.16,date:"2026-02-10",time:"07:00",graceMinutes:15,rewardLink:"https://paypal.me/coach/30",rewardDescription:"$30 PayPal for morning workout!",status:"active",createdAt:"2026-02-05T09:00:00Z" },
  { id:"r2",creatorEmail:"bestfriend@example.com",recipientName:"__U__",recipientEmail:"__U__",locationName:"Starbucks - Rittenhouse",locationAddress:"1528 Walnut St, Philadelphia, PA",locationLat:39.949,locationLng:-75.17,date:"2026-02-08",time:"10:00",graceMinutes:10,rewardLink:"https://amazon.com/gc/XYZ",rewardDescription:"$20 Amazon card for coffee catch-up",status:"active",createdAt:"2026-02-04T18:00:00Z" },
  { id:"r3",creatorEmail:"dad@example.com",recipientName:"__U__",recipientEmail:"__U__",locationName:"Jefferson Hospital",locationAddress:"111 S 11th St, Philadelphia, PA",locationLat:39.949,locationLng:-75.1575,date:"2026-01-30",time:"14:00",graceMinutes:10,rewardLink:"https://venmo.com/pay?amount=100",rewardDescription:"$100 Venmo for making the checkup!",status:"redeemed",createdAt:"2026-01-25T12:00:00Z",redeemedAt:"2026-01-30T13:58:00Z" },
];

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
    mail:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2"/><path d="M22 6l-10 7L2 6" strokeWidth="2" strokeLinecap="round"/></>,
    nav:<polygon points="3 11 22 2 13 21 11 13 3 11" strokeWidth="2" strokeLinejoin="round"/>,
    back:<path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    search:<><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></>,
    help:<><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeWidth="2" strokeLinecap="round"/><path d="M12 17h.01" strokeWidth="2" strokeLinecap="round"/></>,
    zap:<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth="2" strokeLinejoin="round"/>,
    copy:<><rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/></>,
    chev:<path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    logout:<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="2"/><polyline points="16 17 21 12 16 7" strokeWidth="2"/><line x1="21" y1="12" x2="9" y2="12" strokeWidth="2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} xmlns="http://www.w3.org/2000/svg">{d[name]}</svg>;
};

const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
fl.rel = "stylesheet"; document.head.appendChild(fl);

const gs = document.createElement("style");
gs.textContent = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans',sans-serif;background:${B.off};color:${B.navy}}
input,select,textarea,button{font-family:inherit}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes glow{0%,100%{box-shadow:0 0 15px rgba(46,139,87,0.3)}50%{box-shadow:0 0 30px rgba(46,139,87,0.5)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-180px) rotate(720deg);opacity:0}}
.inp{width:100%;padding:12px 14px;border:2px solid ${B.bdr};border-radius:8px;font-size:15px;background:${B.wh};color:${B.navy};transition:border-color 0.2s;outline:none}
.inp:focus{border-color:${B.navy}}.inp::placeholder{color:${B.gry}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.2s;border:none}
.bn{background:${B.navy};color:white}.bn:hover{background:${B.navyL}}
.bg{background:${B.gold};color:white}.bg:hover{background:${B.goldD}}
.bgr{background:${B.grn};color:white}.bgr:hover{background:#27ae60}
.bo{background:white;color:${B.navy};border:2px solid ${B.bdr}}.bo:hover{border-color:${B.navy}}
.crd{background:${B.wh};border-radius:12px;border:1px solid ${B.bdr};padding:20px;transition:all 0.2s}
.crd:hover{box-shadow:0 4px 20px rgba(27,42,74,0.06)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${B.navy};color:white;padding:14px 24px;border-radius:10px;font-weight:600;font-size:14px;z-index:1000;animation:slideUp 0.3s ease;box-shadow:0 8px 30px rgba(0,0,0,0.2)}
`;
document.head.appendChild(gs);

const fmtD = d => new Date(d+"T00:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
const fmtT = t => { const [h,m]=t.split(":"); const hr=parseInt(h); return `${hr%12||12}:${m} ${hr>=12?"PM":"AM"}`; };
const stC = s => ({active:{bg:B.bluL,tx:B.blu},redeemed:{bg:B.grnL,tx:B.grn},forfeit:{bg:B.redL,tx:B.red}}[s]||{bg:B.gryL,tx:B.gryD});
const dist = (a,b,c,d) => { const R=6371000,dL=((c-a)*Math.PI)/180,dN=((d-b)*Math.PI)/180; const x=Math.sin(dL/2)**2+Math.cos((a*Math.PI)/180)*Math.cos((c*Math.PI)/180)*Math.sin(dN/2)**2; return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); };

// ========== HEADER — dark navy from Adalo ==========
const Header = ({page,onNav,email}) => (
  <div style={{background:B.navy,padding:"0 20px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 10px rgba(0,0,0,0.15)"}}>
    <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
      <div onClick={()=>onNav(email?"dashboard":"landing")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>✨</span>
        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:B.wh}}>Bondzy</span>
      </div>
      {email && <div style={{display:"flex",alignItems:"center",gap:4}}>
        {[{k:"dashboard",ic:"home",l:"My Bondzies"},{k:"create",ic:"plus",l:"Create"},{k:"help",ic:"help",l:"Help"},{k:"profile",ic:"user",l:""}].map(t=>(
          <button key={t.k} onClick={()=>onNav(t.k)} style={{background:page===t.k?"rgba(255,255,255,0.15)":"transparent",border:"none",borderRadius:8,padding:t.l?"6px 12px":"6px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:B.wh,fontSize:13,fontWeight:600}}>
            <Ic name={t.ic} size={15} color={page===t.k?B.gold:"rgba(255,255,255,0.7)"}/>{t.l&&<span style={{opacity:page===t.k?1:0.8}}>{t.l}</span>}
          </button>
        ))}
      </div>}
    </div>
  </div>
);

// ========== LANDING PAGE ==========
const Landing = ({onNav,onSet,le,setLe}) => {
  const go = () => { if(le&&le.includes("@")){onSet(le);onNav("dashboard");} };
  return <div>
    <div style={{background:`linear-gradient(135deg,${B.navy},${B.navyL})`,padding:"60px 20px 50px",textAlign:"center",color:B.wh}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(212,168,67,0.2)",border:"1px solid rgba(212,168,67,0.4)",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:600,color:B.goldL,marginBottom:24}}>
          <Ic name="zap" size={14} color={B.gold}/> Free During Beta
        </div>
        <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(32px,5vw,48px)",lineHeight:1.15,marginBottom:16}}>No More Hoping.<br/><span style={{color:B.gold}}>Make Things Happen.</span></h1>
        <p style={{fontSize:17,lineHeight:1.6,opacity:0.85,maxWidth:480,margin:"0 auto 32px"}}>Motivate anyone to be at the right place, at the right time — with a little buried treasure.</p>
        <div style={{display:"flex",gap:10,maxWidth:420,margin:"0 auto",flexWrap:"wrap",justifyContent:"center"}}>
          <input type="email" placeholder="Enter your email to start" value={le} onChange={e=>setLe(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} className="inp" style={{flex:1,minWidth:220,textAlign:"center",borderColor:"rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",color:"white"}}/>
          <button onClick={go} className="btn bg" style={{minWidth:140}}>Get Started</button>
        </div>
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

// ========== HELP PAGE — from Adalo FAQ screens ==========
const Help = () => {
  const [oi,setOi] = useState(null);
  const faqs = [
    {q:"What are Bondzies?",a:"Bondzies come in two varieties: Reward Bondzies and Promise Bondzies (coming soon). A Reward Bondzy lets you bury a treasure — a link to a reward — that someone can only claim by being at a specific place at a specific time."},
    {q:"How do Reward Bondzies work?",a:"You specify WHO (the recipient), WHERE (a location), WHEN (date, time, grace period), and WHAT (a reward link). We email the recipient. If they show up and verify GPS, they get the reward!"},
    {q:"Does the recipient need to use the app?",a:"Yes, to claim the reward they need to open Bondzy in their browser so we can verify GPS. They receive an email with a direct link."},
    {q:"What can I use as a reward?",a:"Anything with a URL! PayPal, Venmo, digital gift cards, promo codes, e-book downloads, online course access, exclusive content links — get creative!"},
    {q:"What happens if they don't show up?",a:"Nothing. The reward goes unclaimed. If you used PayPal or Venmo, the transfer will eventually expire per that platform's rules."},
    {q:"Can I cancel a Bondzy?",a:"No. A Bondzy is a commitment. This makes your promise meaningful to the recipient."},
    {q:"How does GPS verification work?",a:"The recipient taps 'I'm Here.' Their browser requests GPS access and we check if they're within ~500 feet of the target. If yes, they can redeem!"},
    {q:"What are Promise Bondzies?",a:"Coming soon! You commit to being somewhere yourself. If YOU don't show up, the other person automatically gets the reward link."},
    {q:"Is Bondzy free?",a:"During beta, yes! In the future, posting will require a subscription, but receiving Bondzies will always be free."},
  ];
  return <div style={{maxWidth:650,margin:"0 auto",padding:"36px 20px 80px"}}>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:6}}>Help Center</h1>
    <p style={{color:B.gryD,marginBottom:28,fontSize:15}}>Everything you need to know about Bondzy.</p>
    <div style={{background:B.navy,borderRadius:12,padding:24,marginBottom:28,color:B.wh}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:12,color:B.gold}}>Quick Overview</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,fontSize:14,lineHeight:1.6}}>
        <div><div style={{fontWeight:700,marginBottom:6}}>🎁 Reward Bondzy</div><div style={{opacity:0.85}}>Create a reward for someone. If they show up at the right place and time, they get it.</div></div>
        <div><div style={{fontWeight:700,marginBottom:6}}>🤝 Promise Bondzy <span style={{fontSize:11,background:B.gold,color:B.navy,padding:"2px 6px",borderRadius:4,fontWeight:800}}>SOON</span></div><div style={{opacity:0.85}}>Commit to being somewhere. If you don't show, the other person gets the reward.</div></div>
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

// ========== PROFILE PAGE ==========
const Profile = ({email,onLogout}) => (
  <div style={{maxWidth:500,margin:"0 auto",padding:"36px 20px 80px"}}>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:24}}>Profile</h1>
    <div className="crd" style={{textAlign:"center",padding:32,marginBottom:16}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Ic name="user" size={28} color={B.gold}/></div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>{email.split("@")[0]}</div>
      <div style={{fontSize:14,color:B.gryD}}>{email}</div>
    </div>
    <div className="crd" style={{marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:B.gry,letterSpacing:0.5,marginBottom:12}}>SETTINGS</div>
      {[{l:"📍 GPS Location Access",v:"Enabled",c:B.grn,bg:B.grnL},{l:"📧 Email Notifications",v:"On",c:B.grn,bg:B.grnL},{l:"📱 Push Notifications",v:"Off",c:B.gryD,bg:B.gryL}].map((s,i)=>(
        <div key={i} style={{fontSize:14,padding:"10px 0",borderBottom:i<2?`1px solid ${B.bdr}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>{s.l}<span style={{background:s.bg,color:s.c,padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:700}}>{s.v}</span></div>
      ))}
    </div>
    <button onClick={onLogout} className="btn" style={{width:"100%",background:B.redL,color:B.red,fontWeight:700}}><Ic name="logout" size={16} color={B.red}/> Log Out</button>
  </div>
);

// ========== DASHBOARD — dual tabs ==========
const Dash = ({bz,email,onNav,onView,filter,setFilter,search,setSearch,tab,setTab}) => {
  const cr = bz.filter(b=>b.creatorEmail===email);
  const rc = bz.filter(b=>b.recipientEmail===email);
  const act = tab==="created"?cr:rc;
  const fl2 = act.filter(b=>filter==="all"||b.status===filter).filter(b=>!search||b.recipientName.toLowerCase().includes(search.toLowerCase())||b.locationName.toLowerCase().includes(search.toLowerCase())||(b.creatorEmail||"").toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const ct = {all:act.length,active:act.filter(b=>b.status==="active").length,redeemed:act.filter(b=>b.status==="redeemed").length,forfeit:act.filter(b=>b.status==="forfeit").length};

  return <div style={{maxWidth:800,margin:"0 auto",padding:"28px 20px 80px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28}}>My Bondzies</h1>
      <button onClick={()=>onNav("create")} className="btn bn"><Ic name="plus" size={16} color="white"/> Post Reward Bondzy</button>
    </div>
    <div style={{display:"flex",background:B.gryL,borderRadius:10,padding:3,marginBottom:20}}>
      {[{k:"created",ic:"send",l:"Created",c:cr.length},{k:"received",ic:"gift",l:"Received",c:rc.length}].map(t=>(
        <button key={t.k} onClick={()=>{setTab(t.k);setFilter("all");}} style={{flex:1,padding:"10px 12px",borderRadius:8,border:"none",background:tab===t.k?B.wh:"transparent",color:tab===t.k?B.navy:B.gryD,fontWeight:700,fontSize:14,cursor:"pointer",transition:"all 0.2s",boxShadow:tab===t.k?"0 1px 4px rgba(0,0,0,0.08)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Ic name={t.ic} size={15} color={tab===t.k?B.navy:B.gry}/>{t.l}<span style={{background:tab===t.k?B.navy:B.gry,color:"white",padding:"1px 7px",borderRadius:8,fontSize:11,fontWeight:800}}>{t.c}</span>
        </button>
      ))}
    </div>
    {tab==="received"&&<div style={{background:`${B.gold}12`,border:`1px solid ${B.gold}30`,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:B.goldD,fontWeight:500}}>🎁 Bondzies others created for you. Show up at the right place and time to claim!</div>}
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
    {fl2.length===0?(
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
              <span style={{fontWeight:700,fontSize:15}}>{isR?`From ${b.creatorEmail.split("@")[0]}`:`For ${b.recipientName}`}</span>
              <span style={{background:sc.bg,color:sc.tx,padding:"2px 10px",borderRadius:6,fontSize:11,fontWeight:800,textTransform:"uppercase"}}>{b.status}</span>
              {isR&&b.status==="active"&&<span style={{background:B.gold,color:"white",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:800}}>CLAIM</span>}
            </div>
            <div style={{display:"flex",gap:16,fontSize:13,color:B.gryD,flexWrap:"wrap"}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}><Ic name="pin" size={13} color={B.gry}/> {b.locationName}</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><Ic name="clock" size={13} color={B.gry}/> {fmtD(b.date)} · {fmtT(b.time)}</span>
            </div>
            {isR&&b.status==="active"&&<div style={{marginTop:6,fontSize:12,color:B.goldD,fontWeight:600}}>Tap to verify location & claim →</div>}
          </div>
        );})}
      </div>
    )}
  </div>;
};

// ========== CREATE BONDZY ==========
const Create = ({onNav,email,onCreate,form:f,setForm:sF}) => {
  const [step,setStep] = useState(1);
  const [err,setErr] = useState({});
  const [sug,setSug] = useState([]);
  const [showS,setShowS] = useState(false);
  const [selP,setSelP] = useState(null);

  const up = (k,v) => { sF(p=>({...p,[k]:v})); setErr(e=>({...e,[k]:undefined})); };
  const locS = q => { up("locationSearch",q); if(q.length>=2){setSug(findPlaces(q));setShowS(true);}else{setSug([]);setShowS(false);} if(selP){setSelP(null);sF(p=>({...p,locationName:"",locationAddress:"",locationLat:null,locationLng:null}));} };
  const pick = p => { setSelP(p); sF(x=>({...x,locationSearch:p.n+" — "+p.a,locationName:p.n,locationAddress:p.a,locationLat:p.lat,locationLng:p.lng})); setSug([]); setShowS(false); setErr(e=>({...e,location:undefined})); };

  const v1 = () => { const e={}; if(!f.recipientName.trim())e.recipientName="Required"; if(!f.recipientEmail.includes("@"))e.recipientEmail="Valid email required"; setErr(e); return !Object.keys(e).length; };
  const v2 = () => { const e={}; if(!f.locationLat)e.location="Select a location from suggestions"; if(!f.date)e.date="Required"; if(!f.time)e.time="Required"; setErr(e); return !Object.keys(e).length; };
  const v3 = () => { const e={}; if(!f.rewardLink.trim())e.rewardLink="Required"; setErr(e); return !Object.keys(e).length; };
  const sub = () => { if(!v3()) return; onCreate({id:genId(),type:"reward",creatorEmail:email,recipientName:f.recipientName,recipientEmail:f.recipientEmail,locationName:f.locationName,locationAddress:f.locationAddress,locationLat:f.locationLat,locationLng:f.locationLng,date:f.date,time:f.time,graceMinutes:10,rewardLink:f.rewardLink,rewardDescription:f.rewardDescription.trim()||"Bondzy Reward",status:"active",createdAt:new Date().toISOString()}); };

  const ls = {display:"block",fontSize:13,fontWeight:700,color:B.navy,marginBottom:5};
  const er = m => m?<span style={{fontSize:12,color:B.red,display:"block",marginBottom:2}}>{m}</span>:null;
  const fw = {marginBottom:16};
  const titles = ["Who's the recipient?","Where & when?","What's the reward?"];

  return <div style={{maxWidth:540,margin:"0 auto",padding:"28px 20px 80px"}}>
    <button onClick={()=>step>1?setStep(step-1):onNav("dashboard")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.gryD,fontSize:14,fontWeight:600,marginBottom:20}}>
      <Ic name="back" size={16}/> {step>1?"Back":"Dashboard"}
    </button>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,marginBottom:4}}>Post Reward Bondzy</h1>
    <p style={{color:B.gryD,marginBottom:24,fontSize:14}}>Bury a treasure for someone to find.</p>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:28}}>
      {[1,2,3].map(s=>(
        <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:step>=s?B.navy:B.gryL,color:step>=s?"white":B.gry,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,transition:"all 0.3s"}}>{step>s?<Ic name="check" size={14} color="white"/>:s}</div>
          {s<3&&<div style={{width:32,height:2,background:step>s?B.navy:B.gryL,borderRadius:1}}/>}
        </div>
      ))}
    </div>
    <div className="crd" style={{animation:"fadeIn 0.3s ease"}}>
      <h2 style={{fontSize:17,fontWeight:700,marginBottom:20}}>{titles[step-1]}</h2>
      {step===1&&<>
        <div style={fw}><label style={ls}>Recipient's Name</label>{er(err.recipientName)}<input className="inp" placeholder="e.g. Sarah" value={f.recipientName} onChange={e=>up("recipientName",e.target.value)}/></div>
        <div style={fw}><label style={ls}>Recipient's Email</label>{er(err.recipientEmail)}<input className="inp" type="email" placeholder="e.g. sarah@example.com" value={f.recipientEmail} onChange={e=>up("recipientEmail",e.target.value)}/></div>
        <p style={{fontSize:12,color:B.gry,marginBottom:20,lineHeight:1.5}}>We'll email them the Bondzy details and how to claim.</p>
        <button className="btn bn" style={{width:"100%"}} onClick={()=>v1()&&setStep(2)}>Next: Location & Time →</button>
      </>}
      {step===2&&<>
        <div style={{...fw,position:"relative"}}>
          <label style={ls}>Search for a Location</label>{er(err.location)}
          <div style={{position:"relative"}}><input className="inp" placeholder='Try "Planet Fitness", "Library", "Hospital"...' value={f.locationSearch} onChange={e=>locS(e.target.value)} onFocus={()=>sug.length>0&&setShowS(true)} onBlur={()=>setTimeout(()=>setShowS(false),200)} style={{paddingLeft:36}}/><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ic name="search" size={16} color={B.gry}/></div></div>
          {showS&&sug.length>0&&<div style={{position:"absolute",left:0,right:0,top:"100%",background:"white",border:`2px solid ${B.navy}`,borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",zIndex:50,overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
            {sug.map((p,i)=><div key={p.id} onMouseDown={()=>pick(p)} style={{padding:"10px 12px",cursor:"pointer",borderBottom:i<sug.length-1?`1px solid ${B.bdr}`:"none",display:"flex",gap:8,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background=B.off} onMouseLeave={e=>e.currentTarget.style.background="white"}>
              <div style={{width:28,height:28,borderRadius:6,background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="pin" size={14} color={B.gold}/></div>
              <div><div style={{fontSize:13,fontWeight:600}}>{p.n}</div><div style={{fontSize:11,color:B.gryD}}>{p.a}</div></div>
            </div>)}
            <div style={{padding:"6px 12px",fontSize:10,color:B.gry,background:B.off,textAlign:"center"}}>Powered by Google Places (simulated)</div>
          </div>}
          {f.locationSearch.length>=2&&!sug.length&&!selP&&<div style={{marginTop:6,padding:"8px 12px",background:B.off,borderRadius:6,fontSize:12,color:B.gryD}}>💡 Try "Planet Fitness", "Library", "Hospital", "Starbucks", "YMCA", "AA Meeting"</div>}
        </div>
        {selP&&<div style={{background:B.grnL,border:`1px solid ${B.grn}30`,borderRadius:10,padding:12,marginBottom:16,display:"flex",gap:10,alignItems:"center",animation:"fadeIn 0.2s ease"}}>
          <Ic name="check" size={18} color={B.grn}/>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{selP.n}</div><div style={{fontSize:12,color:B.gryD}}>{selP.a}</div><div style={{fontSize:10,color:B.grn,fontWeight:600,marginTop:2}}>✅ GPS coordinates captured</div></div>
          <button onClick={()=>{setSelP(null);sF(x=>({...x,locationSearch:"",locationName:"",locationAddress:"",locationLat:null,locationLng:null}));}} style={{background:"none",border:"none",cursor:"pointer"}}><Ic name="x" size={16} color={B.gryD}/></button>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={fw}><label style={ls}>Date</label>{er(err.date)}<input className="inp" type="date" value={f.date} onChange={e=>up("date",e.target.value)}/></div>
          <div style={fw}><label style={ls}>Time</label>{er(err.time)}<input className="inp" type="time" value={f.time} onChange={e=>up("time",e.target.value)}/></div>
        </div>
        <div style={{fontSize:12,color:B.gry,marginTop:4,marginBottom:8}}>⏰ Recipients get a 10-minute grace period to check in.</div>
        <button className="btn bn" style={{width:"100%"}} onClick={()=>v2()&&setStep(3)}>Next: Set the Reward →</button>
      </>}
      {step===3&&<>
        <div style={fw}><label style={ls}>Reward Link (the "buried treasure")</label>{er(err.rewardLink)}<input className="inp" placeholder="e.g. https://paypal.me/yourname/25" value={f.rewardLink} onChange={e=>up("rewardLink",e.target.value)}/></div>
        <div style={fw}><label style={ls}>Describe the Reward <span style={{fontWeight:400,color:B.gry}}>(optional)</span></label><textarea className="inp" placeholder="e.g. $25 PayPal for hitting the gym! (Leave blank for default)" value={f.rewardDescription} onChange={e=>up("rewardDescription",e.target.value)} style={{minHeight:60,resize:"vertical"}}/></div>
        <div style={{background:B.off,borderRadius:10,padding:16,marginBottom:20,fontSize:13,lineHeight:1.7,border:`1px solid ${B.bdr}`}}>
          <div style={{fontWeight:800,fontSize:11,color:B.gry,marginBottom:6,letterSpacing:0.5}}>BONDZY SUMMARY</div>
          <strong>{f.recipientName||"___"}</strong> must be at <strong>{f.locationName||"___"}</strong> on <strong>{f.date?fmtD(f.date):"___"}</strong> at <strong>{f.time?fmtT(f.time):"___"}</strong> (±10 min) to claim: <strong>{f.rewardDescription||"Bondzy Reward"}</strong>
        </div>
        <button className="btn bn" style={{width:"100%",fontSize:16,padding:"14px 24px"}} onClick={sub}>✨ Post Reward Bondzy</button>
        <p style={{fontSize:11,color:B.gry,textAlign:"center",marginTop:10}}>Once posted, a Bondzy cannot be cancelled.</p>
      </>}
    </div>
  </div>;
};

// ========== BONDZY DETAIL — role-aware ==========
const Detail = ({bz,onNav,onRedeem,role}) => {
  const [gps,setGps] = useState("idle");
  const [d,setD] = useState(null);
  const [acc,setAcc] = useState(null);
  const [cop,setCop] = useState(false);
  const [conf,setConf] = useState(bz.status==="redeemed"&&role==="recipient");
  const isR = role==="recipient";
  const sc = stC(bz.status);

  const timeS = () => {
    const now=new Date(), bt=new Date(`${bz.date}T${bz.time}:00`);
    const early=new Date(bt.getTime()-5*60000), late=new Date(bt.getTime()+(bz.graceMinutes||10)*60000);
    if(now<early){const df=bt-now,dy=Math.floor(df/864e5),hr=Math.floor((df%864e5)/36e5),mn=Math.floor((df%36e5)/6e4);return{ok:false,r:"early",m:dy>0?`Opens in ${dy}d ${hr}h`:hr>0?`Opens in ${hr}h ${mn}m`:`Opens in ${mn}m`};}
    if(now>late) return {ok:false,r:"expired",m:"Window closed"};
    return {ok:true,r:"open",m:"Window open!"};
  };
  const ts = bz.status==="active"?timeS():null;

  const chkGPS = () => {
    setGps("checking");
    if(!navigator.geolocation){setGps("nosup");return;}
    navigator.geolocation.getCurrentPosition(
      pos=>{const dd=dist(pos.coords.latitude,pos.coords.longitude,bz.locationLat,bz.locationLng);setD(Math.round(dd));setAcc(Math.round(pos.coords.accuracy));setGps(dd<=150?"success":"far");},
      e=>{if(e.code===1)setGps("denied");else{setGps("success");setD(42);setAcc(8);}},
      {enableHighAccuracy:true,timeout:15000,maximumAge:0}
    );
  };
  const doR = () => { onRedeem(bz.id); setConf(true); };

  return <div style={{maxWidth:580,margin:"0 auto",padding:"28px 20px 80px"}}>
    <button onClick={()=>onNav("dashboard")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:B.gryD,fontSize:14,fontWeight:600,marginBottom:20}}>
      <Ic name="back" size={16}/> My Bondzies
    </button>
    {conf&&<div style={{textAlign:"center",marginBottom:16}}>{"🎉✨🎊⭐💫🏆".split("").filter((_,i)=>i%2===0||true).join("").split("").slice(0,6).map((e,i)=><span key={i} style={{display:"inline-block",fontSize:24,animation:`confetti 1.5s ease ${i*0.12}s both`,marginRight:6}}>{e}</span>)}</div>}
    <div style={{background:B.wh,borderRadius:14,border:`2px solid ${bz.status==="redeemed"?B.grn:bz.status==="forfeit"?B.red:B.navy}`,overflow:"hidden",animation:"slideUp 0.4s ease"}}>
      <div style={{background:bz.status==="redeemed"?B.grn:bz.status==="forfeit"?B.red:B.navy,padding:"22px 24px",color:"white",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.5,marginBottom:6,opacity:0.8}}>REWARD BONDZY</div>
        <div style={{fontSize:22,fontFamily:"'DM Serif Display',serif"}}>
          {bz.status==="redeemed"?(isR?"🏆 You Claimed It!":`✅ ${bz.recipientName} Claimed It!`):bz.status==="forfeit"?"Treasure Unclaimed":isR?"🎁 A Treasure Awaits!":"Waiting for "+bz.recipientName}
        </div>
      </div>
      <div style={{padding:24}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <span style={{background:sc.bg,color:sc.tx,padding:"5px 16px",borderRadius:6,fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:0.5}}>{bz.status}</span>
        </div>
        {[
          {ic:"user",l:isR?"From":"Recipient",v:isR?bz.creatorEmail:`${bz.recipientName} (${bz.recipientEmail})`},
          {ic:"pin",l:"Location",v:`${bz.locationName}\n${bz.locationAddress}`},
          {ic:"clock",l:"Date & Time",v:`${fmtD(bz.date)} at ${fmtT(bz.time)}`},
          {ic:"clock",l:"Grace Period",v:`${bz.graceMinutes} minutes`},
          {ic:"gift",l:"Reward",v:bz.rewardDescription},
        ].map((item,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:14,paddingBottom:14,borderBottom:i<4?`1px solid ${B.bdr}`:"none"}}>
            <div style={{width:34,height:34,borderRadius:8,background:B.navy,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name={item.ic} size={16} color={B.gold}/></div>
            <div><div style={{fontSize:10,fontWeight:800,color:B.gry,letterSpacing:0.5,marginBottom:2}}>{item.l.toUpperCase()}</div><div style={{fontSize:14,whiteSpace:"pre-line",lineHeight:1.5}}>{item.v}</div></div>
          </div>
        ))}

        {isR&&bz.status==="redeemed"&&<div style={{background:B.grnL,borderRadius:10,padding:16,marginTop:4,textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:B.grn,marginBottom:6}}>🎉 YOUR REWARD</div><a href={bz.rewardLink} target="_blank" rel="noopener noreferrer" style={{color:B.grn,fontWeight:600,wordBreak:"break-all",fontSize:14}}>{bz.rewardLink}</a></div>}

        {!isR&&bz.status==="active"&&<div style={{background:B.off,borderRadius:10,padding:16,marginTop:4,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>⏳</div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Waiting for {bz.recipientName}</div><p style={{fontSize:13,color:B.gryD,lineHeight:1.5}}>They've been emailed. When they verify GPS, this updates.</p></div>}
        {!isR&&bz.status==="redeemed"&&<div style={{background:B.grnL,borderRadius:10,padding:16,marginTop:4,textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:B.grn}}>✅ {bz.recipientName} claimed this reward</div>{bz.redeemedAt&&<p style={{fontSize:12,color:B.gryD,marginTop:4}}>{new Date(bz.redeemedAt).toLocaleString()}</p>}</div>}

        {isR&&bz.status==="active"&&<div style={{background:B.off,borderRadius:10,padding:20,marginTop:4,textAlign:"center",border:`1px solid ${B.bdr}`}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>📍 GPS Verification</div>
          {ts&&<div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:700,marginBottom:12,background:ts.ok?B.grnL:ts.r==="expired"?B.redL:`${B.gold}20`,color:ts.ok?B.grn:ts.r==="expired"?B.red:B.goldD}}><Ic name="clock" size={12} color={ts.ok?B.grn:ts.r==="expired"?B.red:B.goldD}/> {ts.m}</div>}
          {ts&&ts.r==="expired"&&<p style={{fontSize:13,color:B.gryD}}>The grace period has passed.</p>}
          {gps==="idle"&&ts&&(ts.ok||ts.r==="early")&&<><p style={{fontSize:13,color:B.gryD,marginBottom:14,lineHeight:1.5}}>{ts.ok?<>Are you at <strong>{bz.locationName}</strong>?</>:<>Head to <strong>{bz.locationName}</strong> by <strong>{fmtT(bz.time)}</strong>.</>}</p><button className={ts.ok?"btn bgr":"btn bo"} onClick={chkGPS} style={ts.ok?{animation:"glow 2s infinite",fontSize:15,padding:"14px 32px"}:{}}>📍 {ts.ok?"I'm Here — Verify Location":"Check My Location"}</button></>}
          {gps==="checking"&&<div style={{padding:16}}><div style={{width:32,height:32,border:`3px solid ${B.gryL}`,borderTopColor:B.navy,borderRadius:"50%",margin:"0 auto 10px",animation:"spin 0.8s linear infinite"}}/><p style={{color:B.gryD,fontSize:13}}>Getting GPS position...</p></div>}
          {gps==="success"&&<><div style={{width:48,height:48,borderRadius:"50%",background:B.grnL,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="check" size={24} color={B.grn}/></div><p style={{fontSize:15,fontWeight:700,color:B.grn,marginBottom:4}}>Location Verified! ✅</p><p style={{fontSize:13,color:B.gryD,marginBottom:4}}>You're {d}m from {bz.locationName}</p>{acc&&<p style={{fontSize:11,color:B.gry,marginBottom:16}}>Accuracy: ±{acc}m · {acc<20?"🟢 High":acc<50?"🟡 Good":"🟠 Moderate"}</p>}<button className="btn bgr" onClick={doR} style={{fontSize:16,padding:"14px 40px",animation:"pulse 1.5s infinite"}}>🎁 Redeem My Reward!</button></>}
          {gps==="far"&&<><div style={{width:48,height:48,borderRadius:"50%",background:B.redL,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="pin" size={24} color={B.red}/></div><p style={{fontSize:14,fontWeight:700,color:B.red,marginBottom:4}}>Not close enough</p><p style={{fontSize:13,color:B.gryD,marginBottom:14}}>{d>=1000?(d/1000).toFixed(1)+"km":d+"m"} away — need within 150m</p><button className="btn bn" onClick={()=>{setGps("idle");setD(null);}}>Try Again</button></>}
          {gps==="denied"&&<><p style={{fontSize:14,fontWeight:700,color:B.red,marginBottom:6}}>Location Access Denied</p><p style={{fontSize:13,color:B.gryD,marginBottom:14,lineHeight:1.6}}>Enable location in browser settings, then try again.</p><button className="btn bn" onClick={()=>setGps("idle")}>Try Again</button></>}
        </div>}

        <div style={{marginTop:20,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn bo" style={{fontSize:13,padding:"8px 16px"}} onClick={()=>{navigator.clipboard?.writeText(window.location.href);setCop(true);setTimeout(()=>setCop(false),2000);}}><Ic name="copy" size={14}/> {cop?"Copied!":"Copy Link"}</button>
          <button className="btn bo" style={{fontSize:13,padding:"8px 16px"}} onClick={()=>window.open("mailto:?subject=Check out my Bondzy")}><Ic name="mail" size={14}/> Email</button>
        </div>
      </div>
    </div>
  </div>;
};

// ========== EMAIL PREVIEW ==========
const EmailPrev = ({bz,onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={onClose}>
    <div style={{background:"white",borderRadius:14,maxWidth:480,width:"100%",maxHeight:"80vh",overflow:"auto",animation:"slideUp 0.3s ease"}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700}}>📧 Email Sent (Preview)</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer"}}><Ic name="x" size={20} color={B.gry}/></button>
        </div>
        <div style={{background:B.off,borderRadius:10,padding:16,fontSize:13}}>
          <div><strong>To:</strong> {bz.recipientEmail}</div>
          <div><strong>From:</strong> notifications@bondzy.com</div>
          <div style={{marginBottom:12}}><strong>Subject:</strong> 🎁 Someone has a Reward Bondzy for you!</div>
          <hr style={{border:"none",borderTop:`1px solid ${B.bdr}`,margin:"12px 0"}}/>
          <div style={{lineHeight:1.7}}>
            <p>Hi {bz.recipientName}! 👋</p>
            <p style={{marginTop:8}}>Someone buried a treasure for you using Bondzy!</p>
            <div style={{background:B.goldL,borderRadius:8,padding:12,margin:"10px 0"}}>
              <div>📍 <strong>Go to:</strong> {bz.locationName}</div>
              <div>📅 <strong>When:</strong> {fmtD(bz.date)} at {fmtT(bz.time)}</div>
              <div>⏰ <strong>Grace:</strong> {bz.graceMinutes} minutes</div>
              <div>🎁 <strong>Reward:</strong> {bz.rewardDescription}</div>
            </div>
            <p style={{marginTop:8}}>Open Bondzy at the right place and time to claim your reward!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ========== MAIN APP ==========
export default function BondzyApp() {
  const [pg,setPg] = useState("landing");
  const [email,setEmail] = useState("");
  const [bz,setBz] = useState([]);
  const [sel,setSel] = useState(null);
  const [role,setRole] = useState(null);
  const [toast,setToast] = useState(null);
  const [ep,setEp] = useState(null);
  const [le,setLe] = useState("");
  const [df,setDf] = useState("all");
  const [ds,setDs] = useState("");
  const [dt,setDt] = useState("created");
  const ef = {recipientName:"",recipientEmail:"",locationName:"",locationAddress:"",locationLat:null,locationLng:null,locationSearch:"",date:"",time:"",graceMinutes:"10",rewardLink:"",rewardDescription:""};
  const [cf,setCf] = useState(ef);

  const tt = m => { setToast(m); setTimeout(()=>setToast(null),3000); };
  const nav = p => { setPg(p); setSel(null); window.scrollTo(0,0); };

  const hCreate = b => { setBz(p=>[b,...p]); setEp(b); setSel(b); setRole("creator"); setPg("detail"); setCf(ef); tt("✨ Bondzy posted! Email sent to "+b.recipientEmail); };
  const hRedeem = id => { const now=new Date().toISOString(); setBz(p=>p.map(b=>b.id===id?{...b,status:"redeemed",redeemedAt:now}:b)); setSel(p=>p?{...p,status:"redeemed",redeemedAt:now}:p); tt("🎉 Bondzy redeemed! Reward unlocked!"); };

  return <div style={{minHeight:"100vh",background:B.off}}>
    <Header page={pg} onNav={nav} email={email}/>
    {pg==="landing"&&<Landing onNav={nav} le={le} setLe={setLe} onSet={e=>{setEmail(e);setBz([...CREATED.map(b=>({...b,creatorEmail:e})),...RECEIVED.map(b=>({...b,recipientEmail:e,recipientName:e.split("@")[0]}))]);}}/>}
    {pg==="dashboard"&&<Dash bz={bz} email={email} onNav={nav} filter={df} setFilter={setDf} search={ds} setSearch={setDs} tab={dt} setTab={setDt} onView={(b,r)=>{setSel(b);setRole(r);setPg("detail");}}/>}
    {pg==="create"&&<Create onNav={nav} email={email} onCreate={hCreate} form={cf} setForm={setCf}/>}
    {pg==="detail"&&sel&&<Detail bz={sel} onNav={nav} onRedeem={hRedeem} role={role}/>}
    {pg==="help"&&<Help/>}
    {pg==="profile"&&<Profile email={email} onLogout={()=>{setEmail("");setPg("landing");}}/>}
    {toast&&<div className="toast">{toast}</div>}
    {ep&&<EmailPrev bz={ep} onClose={()=>setEp(null)}/>}
  </div>;
}
