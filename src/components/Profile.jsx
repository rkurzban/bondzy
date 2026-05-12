import { B } from "../theme";
import { Ic } from "./icons";

export const Profile = ({email,profile,onLogout}) => (
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
