export const Ic = ({name,size=20,color="currentColor"}) => {
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
    shield:<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    trash:<><polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="2"/><path d="M10 11v6M14 11v6" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeWidth="2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} xmlns="http://www.w3.org/2000/svg">{d[name]}</svg>;
};

export const BondzyMark = ({size=26}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Location pin head */}
    <path d="M54,38 Q41,33 41,19 A13,13 0 0,1 67,19 Q67,33 54,38Z" fill="#D4A843"/>
    {/* Clock face */}
    <circle cx="54" cy="19" r="8" fill="white"/>
    {/* Clock hands */}
    <line x1="54" y1="19" x2="49" y2="13" stroke="#D4A843" strokeWidth="2" strokeLinecap="round"/>
    <line x1="54" y1="19" x2="59" y2="22" stroke="#D4A843" strokeWidth="2" strokeLinecap="round"/>
    {/* Torso */}
    <line x1="53" y1="38" x2="49" y2="65" stroke="#D4A843" strokeWidth="12" strokeLinecap="round"/>
    {/* Rear arm (back-left) */}
    <line x1="51" y1="51" x2="24" y2="61" stroke="#D4A843" strokeWidth="10" strokeLinecap="round"/>
    {/* Front arm (forward-right) */}
    <line x1="53" y1="48" x2="77" y2="37" stroke="#D4A843" strokeWidth="10" strokeLinecap="round"/>
    {/* Front leg upper */}
    <line x1="45" y1="65" x2="34" y2="79" stroke="#D4A843" strokeWidth="10" strokeLinecap="round"/>
    {/* Front leg lower / foot */}
    <line x1="34" y1="79" x2="21" y2="87" stroke="#D4A843" strokeWidth="10" strokeLinecap="round"/>
    {/* Rear leg */}
    <line x1="52" y1="65" x2="68" y2="88" stroke="#D4A843" strokeWidth="10" strokeLinecap="round"/>
  </svg>
);
