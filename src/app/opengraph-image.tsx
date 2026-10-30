import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundImage:
            "linear-gradient(120deg, #7c3aed 0%, #d946ef 45%, #06b6d4 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "rgba(255,255,255,0.18)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#ffffff",
              }}
            />
          </div>
          <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: -2 }}>
            {SITE.name}
          </div>
        </div>

        <div style={{ marginTop: 44, fontSize: 50, fontWeight: 700 }}>
          {SITE.tagline}
        </div>

        <div
          style={{
            marginTop: 26,
            maxWidth: 940,
            fontSize: 30,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          {SITE.description}
        </div>
      </div>
    ),
    { ...size }
  );
}
