import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Enterprise Wine — CodeWeavers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a0f1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#5eead4",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
            }}
          >
            CodeWeavers
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#f9fafb",
              textAlign: "center",
              lineHeight: 1.1,
              maxWidth: 800,
            }}
          >
            Enterprise Wine
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#9ca3af",
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Run Windows workloads on Linux — no rewrites required.
          </div>
          <div
            style={{
              display: "flex",
              gap: 32,
              marginTop: 16,
            }}
          >
            {["Cut Licensing Costs", "Zero Vendor Lock-in", "Any Infrastructure"].map(
              (text) => (
                <div
                  key={text}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#5eead4",
                    border: "1px solid rgba(94,234,212,0.3)",
                    borderRadius: 8,
                    padding: "8px 20px",
                  }}
                >
                  {text}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
