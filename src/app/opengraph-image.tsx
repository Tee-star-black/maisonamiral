import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Maison Amiral | Independent clothing and accessories from Johannesburg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#fff", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "68px 76px", color: "#202420" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ fontSize: 22, letterSpacing: "0.15em" }}>MAISON AMIRAL</span>
        <svg width="98" height="98" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="25" stroke="#202420" fill="none" strokeWidth="3" />
          <circle cx="32" cy="32" r="8" stroke="#202420" fill="none" strokeWidth="3" />
          {Array.from({ length: 8 }, (_, i) => <line key={i} x1="32" y1="9" x2="32" y2="24" transform={`rotate(${i * 45} 32 32)`} stroke="#202420" strokeWidth="3" />)}
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 14, letterSpacing: "0.25em" }}>INDEPENDENT DESIGN / JOHANNESBURG</span>
        <span style={{ fontSize: 88, fontFamily: "Georgia, serif", letterSpacing: "-0.045em", lineHeight: 0.95 }}>Made to be worn.</span>
        <span style={{ fontSize: 22, color: "#6a6a6a" }}>Original clothing and accessories from South Africa.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #dadada", paddingTop: 24, fontSize: 16, letterSpacing: "0.06em" }}>
        <span>THE COLLECTION / 2026</span><span>MAISONAMIRAL.CO.ZA</span>
      </div>
    </div>,
    size
  );
}
