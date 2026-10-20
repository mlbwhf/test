import { ImageResponse } from "next/og";

export const alt = "EnrollClass: fill every seat, get paid when you teach";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The default share image for every page without its own (links in Slack, LinkedIn, X…).
export default function OgImage() {
  const ink = "#14213d";
  const paper = "#f7f6f2";
  const green = "#3fcb7e";
  const seats = Array.from({ length: 20 }, (_, i) => i);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: ink, color: paper, padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 58, gap: 6 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: paper }} />
            <div style={{ width: 26, height: 26, borderRadius: 6, background: paper }} />
            <div style={{ width: 26, height: 26, borderRadius: 6, background: paper }} />
            <div style={{ width: 26, height: 26, borderRadius: 13, background: green }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1.5 }}>enrollclass</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3 }}>Fill every seat.</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, color: green }}>Get paid when you teach.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 26, opacity: 0.8 }}>Registration, payments and check-in for training providers</div>
          <div style={{ display: "flex", flexWrap: "wrap", width: 330, gap: 8 }}>
            {seats.map((i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: i < 14 ? 6 : 13, background: i < 14 ? paper : i === 14 ? green : "rgba(247,246,242,0.18)" }} />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
