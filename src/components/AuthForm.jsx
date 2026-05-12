export const AuthForm=({email,setEmail,sent,setSent,loading,err,go,signInWithGoogle})=>{
  if(sent)return(
    <div style={{maxWidth:420,margin:"0 auto",background:"rgba(255,255,255,0.1)",borderRadius:12,padding:24,animation:"fadeIn 0.3s ease",textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:12}}>📧</div>
      <h2 style={{fontSize:20,marginBottom:8,color:"white"}}>Check your email!</h2>
      <p style={{fontSize:15,opacity:0.85,lineHeight:1.6,color:"white"}}>We sent a magic link to <strong>{email}</strong>. Click it to sign in.</p>
      <p style={{fontSize:13,opacity:0.6,marginTop:12,color:"white"}}>Don't see it? Check your spam folder.</p>
      <button onClick={()=>setSent(false)} className="btn bo" style={{marginTop:16,borderColor:"rgba(255,255,255,0.3)",color:"white"}}>Try a different email</button>
    </div>
  );
  return(
    <div style={{maxWidth:420,margin:"0 auto"}}>
      <button onClick={signInWithGoogle} style={{width:"100%",background:"white",color:"#1f1f1f",border:"none",borderRadius:8,padding:"12px 24px",fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:10,transition:"all 0.2s"}} onMouseOver={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.2)"} onMouseOut={e=>e.currentTarget.style.boxShadow="none"}>
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
        Continue with Google
      </button>
      <p style={{fontSize:12,opacity:0.6,marginBottom:14,color:"white",textAlign:"center"}}>Frequent user? →</p>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.2)"}}/>
        <span style={{fontSize:13,opacity:0.5,color:"white"}}>or use email</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.2)"}}/>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
        <input type="email" placeholder="your@email.com" value={email} onChange={e=>{setEmail(e.target.value);}} onKeyDown={e=>e.key==="Enter"&&go()} className="inp" style={{flex:1,minWidth:210,textAlign:"center",borderColor:"rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.1)",color:"white"}}/>
        <button onClick={go} className="btn bg" style={{minWidth:130}} disabled={loading}>{loading?"Sending...":"Get Started →"}</button>
      </div>
      {err&&<p style={{color:"#ff8080",fontSize:13,marginTop:8,textAlign:"center"}}>{err}</p>}
    </div>
  );
};
