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
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(async () => {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GKEY,
          "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text"
        },
        body: JSON.stringify({ input: query, languageCode: "en" })
      });
      const data = await res.json();
      const suggestions = data?.suggestions || [];
      callback(suggestions);
    } catch (e) {
      console.error("Places autocomplete error", e);
      callback([]);
    }
  }, 250);
};

// Fetch place details
const fetchPlaceDetails = async (placeId) => {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": GKEY, "X-Goog-FieldMask": "location,formattedAddress,displayName" }
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Place details error", e);
    return null;
  }
};

const pill = (txt, bg, fg) => (
  <span style={{
    display:"inline-block",
    padding:"4px 10px",
    borderRadius:999,
    background:bg,
    color:fg,
    fontSize:12,
    fontWeight:600,
    letterSpacing:0.2
  }}>{txt}</span>
);

const Btn = ({ children, onClick, kind="primary", disabled=false, style={} }) => {
  const base = {
    border:"1px solid transparent",
    padding:"10px 14px",
    borderRadius:10,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight:700,
    fontSize:14,
    display:"inline-flex",
    alignItems:"center",
    gap:8,
    opacity: disabled ? 0.55 : 1,
    userSelect:"none",
    transition:"transform 0.03s ease"
  };
  const kinds = {
    primary: { background:B.navy, color:B.wh, borderColor:B.navy },
    ghost: { background:"transparent", color:B.navy, borderColor:B.bdr },
    danger: { background:B.red, color:B.wh, borderColor:B.red },
    soft: { background:B.goldL, color:B.goldD, borderColor:B.goldL }
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...(kinds[kind]||kinds.primary), ...style }}
      onMouseDown={(e)=>{ if(!disabled) e.currentTarget.style.transform="scale(0.98)"; }}
      onMouseUp={(e)=>{ e.currentTarget.style.transform="scale(1)"; }}
      onMouseLeave={(e)=>{ e.currentTarget.style.transform="scale(1)"; }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style={} }) => (
  <div style={{
    background:B.wh,
    border:"1px solid " + B.bdr,
    borderRadius:14,
    padding:18,
    boxShadow:"0 6px 18px rgba(16,24,40,0.06)",
    ...style
  }}>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder="", type="text", style={}, disabled=false }) => (
  <input
    value={value}
    onChange={(e)=>onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
    disabled={disabled}
    style={{
      width:"100%",
      padding:"11px 12px",
      borderRadius:10,
      border:"1px solid " + B.bdr,
      outline:"none",
      fontSize:14,
      background: disabled ? "#F2F4F7" : B.wh,
      ...style
    }}
  />
);

const TextArea = ({ value, onChange, placeholder="", rows=4, style={} }) => (
  <textarea
    value={value}
    onChange={(e)=>onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width:"100%",
      padding:"11px 12px",
      borderRadius:10,
      border:"1px solid " + B.bdr,
      outline:"none",
      fontSize:14,
      resize:"vertical",
      ...style
    }}
  />
);

const Divider = ({ style={} }) => (
  <div style={{ height:1, background:B.bdr, margin:"14px 0", ...style }} />
);

const StepDot = ({ active=false, done=false }) => (
  <div style={{
    width:28,height:28,borderRadius:999,
    display:"grid",placeItems:"center",
    background: done ? B.navy : active ? B.navy : "#E5E7EB",
    color: done || active ? B.wh : "#6B7280",
    fontWeight:900,
    fontSize:14
  }}>
    {done ? "✓" : active ? "•" : ""}
  </div>
);

const TopNav = ({ user, onSignOut, onGoHome, onGoCreate }) => (
  <div style={{
    position:"sticky",
    top:0,
    zIndex:10,
    background:B.navy,
    color:B.wh,
    padding:"10px 18px",
    display:"flex",
    alignItems:"center",
    justifyContent:"space-between",
    gap:12
  }}>
    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ fontWeight:900, letterSpacing:0.3, fontSize:18, cursor:"pointer" }} onClick={onGoHome}>
        ✨ Bondzy
      </div>
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      {user && (
        <>
          <Btn kind="soft" onClick={onGoHome} style={{ padding:"8px 12px", borderRadius:999 }}>
            🏠 My Bondzies
          </Btn>
          <Btn kind="ghost" onClick={onGoCreate} style={{ padding:"8px 12px", borderRadius:999, borderColor:"rgba(255,255,255,0.35)", color:"#fff" }}>
            + Create
          </Btn>
          <div style={{ width:1, height:22, background:"rgba(255,255,255,0.25)" }} />
          <Btn kind="ghost" onClick={onSignOut} style={{ padding:"8px 12px", borderRadius:999, borderColor:"rgba(255,255,255,0.35)", color:"#fff" }}>
            ⎋
          </Btn>
        </>
      )}
    </div>
  </div>
);

const Kpis = ({ items }) => {
  const total = items.length;
  const active = items.filter(x=>x.status==="active").length;
  const redeemed = items.filter(x=>x.status==="redeemed").length;
  const forfeited = items.filter(x=>x.status==="forfeit").length;

  const k = (label, value, color=B.navy) => (
    <div style={{
      flex:1,
      border:"1px solid "+B.bdr,
      borderRadius:12,
      padding:12,
      background:B.wh
    }}>
      <div style={{ fontSize:12, color:B.gry, fontWeight:700 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display:"flex", gap:12, marginTop:14 }}>
      {k("Total", total, B.navy)}
      {k("Active", active, B.blu)}
      {k("Redeemed", redeemed, B.grn)}
      {k("Forfeit", forfeited, B.red)}
    </div>
  );
};

const EmptyState = ({ onCreate }) => (
  <div style={{
    border:"1px dashed "+B.bdr,
    borderRadius:14,
    padding:28,
    textAlign:"center",
    background:"#FAFBFC"
  }}>
    <div style={{ fontSize:42 }}>📥</div>
    <div style={{ fontWeight:900, fontSize:18, marginTop:6 }}>No Bondzies created yet</div>
    <div style={{ color:B.gry, marginTop:4 }}>Post your first Reward Bondzy!</div>
    <div style={{ marginTop:16 }}>
      <Btn onClick={onCreate}>Create Bondzy</Btn>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  if (status==="active") return pill("Active", B.bluL, B.blu);
  if (status==="redeemed") return pill("Redeemed", B.grnL, B.grn);
  if (status==="forfeit") return pill("Forfeit", B.redL, B.red);
  return pill(status || "Unknown", "#EEF2F7", B.gryD);
};

const ItemRow = ({ item, onRedeem, onForfeit, isCreated }) => {
  const dt = item?.when_at ? new Date(item.when_at) : null;
  const when = dt ? dt.toLocaleString() : "—";
  const reward = item.reward || "—";
  const where = item.location_name || "—";
  const who = isCreated ? (item.claimed_by ? "Claimed" : "Unclaimed") : (item.creator_email || "—");

  return (
    <div style={{
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      gap:12,
      border:"1px solid "+B.bdr,
      borderRadius:12,
      padding:"12px 14px",
      background:B.wh
    }}>
      <div style={{ display:"flex", flexDirection:"column", gap:2, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ fontWeight:900, fontSize:15, color:B.navy, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:420 }}>
            {reward}
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div style={{ color:B.gryD, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:640 }}>
          📍 {where} &nbsp; • &nbsp; 🕒 {when} &nbsp; • &nbsp; {isCreated ? "👤 " + who : "🎁 from " + who}
        </div>
      </div>

      {isCreated && item.status==="active" && (
        <div style={{ display:"flex", gap:8 }}>
          <Btn kind="ghost" onClick={()=>onRedeem(item)} style={{ padding:"8px 10px", borderRadius:10 }}>
            ✅ Redeem
          </Btn>
          <Btn kind="ghost" onClick={()=>onForfeit(item)} style={{ padding:"8px 10px", borderRadius:10 }}>
            🧨 Forfeit
          </Btn>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);

  // Pages: auth | home | create
  const [page, setPage] = useState("auth");

  // Auth
  const [authMode, setAuthMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // Home tabs
  const [tab, setTab] = useState("created"); // created | received
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Create flow (3 steps)
  const [step, setStep] = useState(1);

  // Step 1: Location & time
  const [locQuery, setLocQuery] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [locOptions, setLocOptions] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locSelected, setLocSelected] = useState(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Step 2: Reward
  const [reward, setReward] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");

  // Step 3: Rules
  const [claimRule, setClaimRule] = useState("first"); // first | multi
  const [slots, setSlots] = useState(1);

  // Review
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Init auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user || null;
      setUser(u);
      setPage(u ? "home" : "auth");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      setPage(u ? "home" : "auth");
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Autocomplete effect
  useEffect(() => {
    const q = (locQuery || "").trim();
    if (!q || q.length < 3) {
      setLocOptions([]);
      setLocLoading(false);
      return;
    }
    setLocLoading(true);
    searchPlaces(q, (suggestions) => {
      setLocOptions(suggestions || []);
      setLocLoading(false);
    });
  }, [locQuery]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const authSubmit = async () => {
    setAuthMsg("");
    if (!email || !pw) {
      setAuthMsg("Please enter email + password.");
      return;
    }
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        setAuthMsg("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        setAuthMsg("");
      }
    } catch (e) {
      setAuthMsg(e.message || "Auth error");
    }
  };

  const loadItems = async (whichTab = tab) => {
    if (!user) return;
    setLoadingItems(true);
    try {
      let q;
      if (whichTab === "created") {
        q = supabase
          .from("bondzies")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false });
      } else {
        q = supabase
          .from("bondzies")
          .select("*")
          .eq("claimed_by", user.id)
          .order("created_at", { ascending: false });
      }
      const { data, error } = await q;
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (page === "home" && user) loadItems(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user, tab]);

  const startCreate = () => {
    setStep(1);
    setLocQuery("");
    setLocSelected(null);
    setLocOptions([]);
    setLocOpen(false);
    setDate("");
    setTime("");
    setReward("");
    setRewardDesc("");
    setClaimRule("first");
    setSlots(1);
    setReviewOpen(false);
    setPage("create");
  };

  const goHome = () => {
    setPage("home");
  };

  const pickSuggestion = async (s) => {
    const pred = s?.placePrediction;
    if (!pred) return;
    const placeId = pred.placeId;
    const text =
      pred?.structuredFormat?.mainText?.text
        ? `${pred.structuredFormat.mainText.text}${pred.structuredFormat.secondaryText?.text ? ", " + pred.structuredFormat.secondaryText.text : ""}`
        : (pred?.text?.text || pred?.text || "");
    setLocQuery(text);
    setLocOpen(false);

    const det = await fetchPlaceDetails(placeId);
    const loc = det?.location;
    const formattedAddress = det?.formattedAddress || text;

    if (loc?.latitude != null && loc?.longitude != null) {
      setLocSelected({
        placeId,
        name: det?.displayName?.text || text,
        formattedAddress,
        lat: loc.latitude,
        lng: loc.longitude
      });
    } else {
      setLocSelected({
        placeId,
        name: det?.displayName?.text || text,
        formattedAddress,
        lat: null,
        lng: null
      });
    }
  };

  const toISOWhen = () => {
    if (!date) return null;
    const t = time || "12:00";
    const d = new Date(`${date}T${t}:00`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const canStep1 = () => {
    if (!locSelected) return false;
    if (!date) return false;
    if (!time) return false;
    return true;
  };

  const canStep2 = () => {
    if (!reward.trim()) return false;
    return true;
  };

  const canStep3 = () => {
    if (claimRule === "multi" && (!slots || slots < 1)) return false;
    return true;
  };

  const submitBondzy = async () => {
    if (!user) return;
    const when_at = toISOWhen();
    if (!when_at) return;

    setSubmitting(true);
    try {
      const payload = {
        creator_id: user.id,
        creator_email: user.email,
        reward: reward.trim(),
        reward_desc: rewardDesc.trim(),
        location_query: locQuery.trim(),
        location_name: locSelected?.name || null,
        location_address: locSelected?.formattedAddress || null,
        location_place_id: locSelected?.placeId || null,
        location_lat: locSelected?.lat,
        location_lng: locSelected?.lng,
        when_at,
        status: "active",
        claim_rule: claimRule,
        claim_slots: claimRule === "multi" ? Number(slots || 1) : 1
      };

      const { error } = await supabase.from("bondzies").insert(payload);
      if (error) throw error;

      setReviewOpen(false);
      setPage("home");
      setTab("created");
      await loadItems("created");
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not create Bondzy.");
    } finally {
      setSubmitting(false);
    }
  };

  const redeemItem = async (item) => {
    try {
      const { error } = await supabase
        .from("bondzies")
        .update({ status: "redeemed" })
        .eq("id", item.id)
        .eq("creator_id", user.id);
      if (error) throw error;
      await loadItems("created");
    } catch (e) {
      console.error(e);
      alert("Could not redeem.");
    }
  };

  const forfeitItem = async (item) => {
    try {
      const { error } = await supabase
        .from("bondzies")
        .update({ status: "forfeit" })
        .eq("id", item.id)
        .eq("creator_id", user.id);
      if (error) throw error;
      await loadItems("created");
    } catch (e) {
      console.error(e);
      alert("Could not forfeit.");
    }
  };

  const Wrap = ({ children }) => (
    <div style={{ minHeight:"100vh", background:B.off }}>
      <TopNav
        user={user}
        onSignOut={signOut}
        onGoHome={()=>{ setPage(user ? "home" : "auth"); }}
        onGoCreate={startCreate}
      />
      <div style={{ maxWidth:1060, margin:"0 auto", padding:"26px 18px 54px" }}>
        {children}
      </div>
    </div>
  );

  if (!user) {
    return (
      <Wrap>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <h1 style={{ margin:0, fontSize:34, fontWeight:1000, color:B.navy }}>Welcome to Bondzy</h1>
          <div style={{ color:B.gryD, marginTop:8 }}>
            Create reward-based “bondzies” for friends. (Early prototype.)
          </div>

          <div style={{ display:"flex", gap:10, marginTop:18 }}>
            <Btn kind={authMode==="signin" ? "primary" : "ghost"} onClick={()=>setAuthMode("signin")}>Sign in</Btn>
            <Btn kind={authMode==="signup" ? "primary" : "ghost"} onClick={()=>setAuthMode("signup")}>Sign up</Btn>
          </div>

          <Card style={{ marginTop:16 }}>
            <div style={{ display:"grid", gap:10 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:B.gryD, marginBottom:6 }}>Email</div>
                <Input value={email} onChange={setEmail} placeholder="you@example.com" />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:B.gryD, marginBottom:6 }}>Password</div>
                <Input value={pw} onChange={setPw} placeholder="••••••••" type="password" />
              </div>

              {authMsg && (
                <div style={{
                  background:"#FFF4E5",
                  border:"1px solid #F7D7A6",
                  color:"#7A4B00",
                  padding:"10px 12px",
                  borderRadius:10,
                  fontWeight:700,
                  fontSize:13
                }}>
                  {authMsg}
                </div>
              )}

              <Btn onClick={authSubmit}>{authMode==="signup" ? "Create account" : "Sign in"}</Btn>
            </div>
          </Card>
        </div>
      </Wrap>
    );
  }

  if (page === "home") {
    const created = tab==="created";
    const filtered = items.filter(x => {
      if (created) return true;
      return true;
    });

    const counts = {
      created: items.length,
      received: items.length
    };

    return (
      <Wrap>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <h1 style={{ margin:0, fontSize:32, fontWeight:1000, color:B.navy }}>My Bondzies</h1>
          <Btn onClick={startCreate}>+ Post Reward Bondzy</Btn>
        </div>

        <div style={{
          marginTop:12,
          background:B.wh,
          border:"1px solid "+B.bdr,
          borderRadius:14,
          padding:10,
          display:"flex",
          gap:8,
          alignItems:"center",
          maxWidth:520
        }}>
          <Btn
            kind={tab==="created" ? "primary" : "ghost"}
            onClick={()=>setTab("created")}
            style={{ borderRadius:12, padding:"8px 12px" }}
          >
            ✈️ Created <span style={{ opacity:0.85 }}>{pill(String(counts.created), "rgba(255,255,255,0.18)", "#fff")}</span>
          </Btn>
          <Btn
            kind={tab==="received" ? "primary" : "ghost"}
            onClick={()=>setTab("received")}
            style={{ borderRadius:12, padding:"8px 12px" }}
          >
            🗓️ Received <span style={{ opacity:0.85 }}>{pill(String(counts.received), "rgba(255,255,255,0.18)", "#fff")}</span>
          </Btn>
        </div>

        <Kpis items={items} />

        <div style={{ marginTop:18 }}>
          <Card>
            {loadingItems ? (
              <div style={{ color:B.gryD, fontWeight:800 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <EmptyState onCreate={startCreate} />
            ) : (
              <div style={{ display:"grid", gap:10 }}>
                {filtered.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    isCreated={tab==="created"}
                    onRedeem={redeemItem}
                    onForfeit={forfeitItem}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </Wrap>
    );
  }

  // Create flow
  return (
    <Wrap>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div>
          <div style={{ color:B.gryD, fontWeight:900, cursor:"pointer" }} onClick={goHome}>← Back</div>
          <h1 style={{ margin:"6px 0 0", fontSize:32, fontWeight:1000, color:B.navy }}>Post Reward Bondzy</h1>
          <div style={{ color:B.gryD, marginTop:6 }}>Bury a treasure for someone to find.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <StepDot done={step>1} active={step===1} />
          <div style={{ width:42, height:2, background: step>1 ? B.navy : "#D1D5DB" }} />
          <StepDot done={step>2} active={step===2} />
          <div style={{ width:42, height:2, background: step>2 ? B.navy : "#D1D5DB" }} />
          <StepDot active={step===3} />
        </div>
      </div>

      <div style={{ marginTop:18, maxWidth:720 }}>
        {step === 1 && (
          <Card>
            <div style={{ fontWeight:1000, color:B.navy, fontSize:18 }}>Where & when?</div>
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, fontWeight:900, color:B.gryD, marginBottom:6 }}>Search for a Location</div>

              <div style={{ position:"relative" }}>
                <Input
                  value={locQuery}
                  onChange={(v)=>{ setLocQuery(v); setLocOpen(true); }}
                  placeholder="Try a business name or address"
                  style={{ paddingLeft:38 }}
                />
                <div style={{
                  position:"absolute",
                  left:12,
                  top:"50%",
                  transform:"translateY(-50%)",
                  color:B.gryD
                }}>🔍</div>

                {locOpen && (locLoading || locOptions.length>0) && (
                  <div style={{
                    position:"absolute",
                    top:46,
                    left:0,
                    right:0,
                    background:B.wh,
                    border:"1px solid "+B.bdr,
                    borderRadius:12,
                    boxShadow:"0 18px 40px rgba(16,24,40,0.10)",
                    zIndex:20,
                    overflow:"hidden"
                  }}>
                    {locLoading && (
                      <div style={{ padding:12, color:B.gryD, fontWeight:800 }}>🔎 Searching… try a business name or address</div>
                    )}
                    {!locLoading && locOptions.length===0 && (
                      <div style={{ padding:12, color:B.gryD, fontWeight:800 }}>No results.</div>
                    )}
                    {!locLoading && locOptions.map((s, idx) => {
                      const pred = s.placePrediction;
                      const main = pred?.structuredFormat?.mainText?.text || pred?.text?.text || "Place";
                      const sec = pred?.structuredFormat?.secondaryText?.text || "";
                      return (
                        <div
                          key={idx}
                          onClick={()=>pickSuggestion(s)}
                          style={{
                            padding:"10px 12px",
                            cursor:"pointer",
                            borderTop: idx===0 ? "none" : "1px solid "+B.bdr
                          }}
                        >
                          <div style={{ fontWeight:900, color:B.navy }}>{main}</div>
                          {sec && <div style={{ color:B.gryD, fontSize:13 }}>{sec}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:14, marginTop:14 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:900, color:B.gryD, marginBottom:6 }}>Date</div>
                  <Input type="date" value={date} onChange={setDate} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:900, color:B.gryD, marginBottom:6 }}>Time</div>
                  <Input type="time" value={time} onChange={setTime} />
                </div>
              </div>

              <div style={{ color:B.gryD, fontSize:13, marginTop:10 }}>
                ⏰ Recipients get a 10-minute grace period to check in.
              </div>

              <div style={{ marginTop:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ color:B.gryD, fontWeight:900 }}>
                  {locSelected ? `📍 Selected: ${locSelected.formattedAddress || locSelected.name}` : "Pick a location, date, and time."}
                </div>
                <Btn disabled={!canStep1()} onClick={()=>setStep(2)}>
                  Next: Set the Reward →
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div style={{ fontWeight:1000, color:B.navy, fontSize:18 }}>What’s the reward?</div>
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, fontWeight:900, color:B.gryD, marginBottom:6 }}>Reward title</div>
              <Input value={reward} onChange={setReward} placeholder="e.g., $20 Starbucks card" />

              <div style={{ marginTop:12, fontSize:12, fontWeight:900, color:B.gryD, marginBottom:6 }}>Reward details (optional)</div>
              <TextArea value={rewardDesc} onChange={setRewardDesc} placeholder="Any extra context or instructions." rows={4} />

              <div style={{ marginTop:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <Btn kind="ghost" onClick={()=>setStep(1)}>← Back</Btn>
                <Btn disabled={!canStep2()} onClick={()=>setStep(3)}>Next: Claim Rules →</Btn>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <div style={{ fontWeight:1000, color:B.navy, fontSize:18 }}>Who can claim it?</div>
            <div style={{ marginTop:12 }}>
              <div style={{ display:"grid", gap:10 }}>
                <label style={{ display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer" }}>
                  <input
                    type="radio"
                    name="rule"
                    checked={claimRule==="first"}
                    onChange={()=>setClaimRule("first")}
                    style={{ marginTop:2 }}
                  />
                  <div>
                    <div style={{ fontWeight:900, color:B.navy }}>First person to check in</div>
                    <div style={{ color:B.gryD, fontSize:13 }}>One winner.</div>
                  </div>
                </label>

                <label style={{ display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer" }}>
                  <input
                    type="radio"
                    name="rule"
                    checked={claimRule==="multi"}
                    onChange={()=>setClaimRule("multi")}
                    style={{ marginTop:2 }}
                  />
                  <div>
                    <div style={{ fontWeight:900, color:B.navy }}>Multiple winners</div>
                    <div style={{ color:B.gryD, fontSize:13 }}>Allow several people to claim it.</div>
                    {claimRule==="multi" && (
                      <div style={{ marginTop:10, maxWidth:220 }}>
                        <div style={{ fontSize:12, fontWeight:900, color:B.gryD, marginBottom:6 }}>Slots</div>
                        <Input
                          type="number"
                          value={String(slots)}
                          onChange={(v)=>setSlots(Number(v))}
                          placeholder="1"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <Divider />

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <Btn kind="ghost" onClick={()=>setStep(2)}>← Back</Btn>
                <Btn disabled={!canStep3()} onClick={()=>setReviewOpen(true)}>Review & Post →</Btn>
              </div>
            </div>
          </Card>
        )}

        {reviewOpen && (
          <div style={{
            position:"fixed",
            inset:0,
            background:"rgba(0,0,0,0.42)",
            display:"grid",
            placeItems:"center",
            zIndex:50,
            padding:18
          }}>
            <div style={{ width:"min(760px, 100%)" }}>
              <Card>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontWeight:1000, color:B.navy, fontSize:18 }}>Review</div>
                  <Btn kind="ghost" onClick={()=>setReviewOpen(false)} style={{ padding:"8px 10px" }}>✕</Btn>
                </div>

                <Divider />

                <div style={{ display:"grid", gap:10 }}>
                  <div><span style={{ fontWeight:900, color:B.navy }}>Reward:</span> {reward || "—"}</div>
                  {rewardDesc && <div style={{ color:B.gryD }}>{rewardDesc}</div>}
                  <div><span style={{ fontWeight:900, color:B.navy }}>Where:</span> {locSelected?.formattedAddress || "—"}</div>
                  <div><span style={{ fontWeight:900, color:B.navy }}>When:</span> {date} {time}</div>
                  <div><span style={{ fontWeight:900, color:B.navy }}>Rule:</span> {claimRule==="first" ? "First check-in" : `Multiple winners (${slots})`}</div>
                </div>

                <Divider />

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <Btn kind="ghost" onClick={()=>setReviewOpen(false)}>← Edit</Btn>
                  <Btn disabled={submitting} onClick={submitBondzy}>
                    {submitting ? "Posting…" : "Post Bondzy"}
                  </Btn>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Wrap>
  );
}
