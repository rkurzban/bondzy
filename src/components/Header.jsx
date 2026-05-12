import { B } from "../theme";
import { Ic } from "./icons";

export const Header = ({page,onNav,email}) => (
  <div style={{background:B.navy,padding:"0 20px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 10px rgba(0,0,0,0.15)"}}>
    <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
      <div onClick={()=>onNav(email?"dashboard":"landing")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <img src="/bondzymarkv2.png" alt="Bondzy" style={{width:28,height:28,objectFit:"contain"}}/>
        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:B.wh}}>Bondzy</span>
      </div>
      {email&&<div style={{display:"flex",alignItems:"center",gap:4}}>
        {[{k:"dashboard",ic:"home",l:"My Bondzies"},{k:"create-reward",ic:"plus",l:"Create"},{k:"help",ic:"help",l:"Help"},{k:"profile",ic:"user",l:""}].map(t=>(
          <button key={t.k} onClick={()=>onNav(t.k)} style={{background:page===t.k||(page==="create"&&t.k==="create-reward")?"rgba(255,255,255,0.15)":"transparent",border:"none",borderRadius:8,padding:t.l?"6px 12px":"6px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:B.wh,fontSize:13,fontWeight:600}}>
            <Ic name={t.ic} size={15} color={page===t.k||(page==="create"&&t.k==="create-reward")?B.gold:"rgba(255,255,255,0.7)"}/>{t.l&&<span style={{opacity:page===t.k||(page==="create"&&t.k==="create-reward")?1:0.8}}>{t.l}</span>}
          </button>
        ))}
      </div>}
    </div>
  </div>
);
