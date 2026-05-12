import { useState } from "react";
import { B } from "../theme";
import { Ic } from "./icons";

export const Help = () => {
  const [oi,setOi]=useState(null);
  const faqs=[
    {q:"What are Bondzies?",a:"A Reward Bondzy lets you bury a treasure — a link to a reward — that someone can only claim by being at a specific place at a specific time."},
    {q:"How do Reward Bondzies work?",a:"You specify WHO, WHERE, WHEN, and WHAT (a reward link). We email the recipient. If they show up and verify GPS, they get the reward!"},
    {q:"Does the recipient need an account?",a:"For Reward Bondzies — no. Recipients click the link in their email and go straight to the Bondzy. No sign-up, no password. For Promise Bondzies, recipients need an account to monitor the creator's check-in status."},
    {q:"What can I use as a reward?",a:"Anything of value! PayPal or Venmo links, digital gift card URLs, promo codes, passwords to a download — get creative. If it's a link, the recipient gets a clickable button. If it's a code or text, they get a copy button."},
    {q:"What happens if they don't show up?",a:"The reward goes unclaimed and the Bondzy is marked as forfeit."},
    {q:"How does GPS verification work?",a:"When the time window opens, the app automatically checks your GPS. You need to be within about 100 meters (~330 feet) of the target location. For Reward Bondzies, the recipient verifies. For Promise Bondzies, the creator verifies."},
    {q:"What are Promise Bondzies?",a:"A Promise Bondzy is your commitment to be somewhere. You specify WHO, WHERE, WHEN, and a PENALTY. If you don't verify GPS at the location on time, the penalty link is automatically sent to the other person. Think of it like a bail bond — it makes your word credible."},
    {q:"Is Bondzy free?",a:"During beta, yes! Receiving Bondzies will always be free."},
  ];
  return <div style={{maxWidth:650,margin:"0 auto",padding:"36px 20px 80px"}}>
    <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,marginBottom:6}}>Help Center</h1>
    <p style={{color:B.gryD,marginBottom:28,fontSize:15}}>Everything you need to know about Bondzy.</p>
    <div style={{background:B.navy,borderRadius:12,padding:24,marginBottom:28,color:B.wh}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:12,color:B.gold}}>Quick Overview</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,fontSize:14,lineHeight:1.6}}>
        <div><div style={{fontWeight:700,marginBottom:6}}>🎁 Reward Bondzy</div><div style={{opacity:0.85}}>Create a reward for someone. If they show up, they get it.</div></div>
        <div><div style={{fontWeight:700,marginBottom:6}}>🤝 Promise Bondzy</div><div style={{opacity:0.85}}>Commit to being somewhere. If you don't show, they get the penalty.</div></div>
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
