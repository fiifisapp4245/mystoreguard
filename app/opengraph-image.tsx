import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "MyStoreGuard — Know what's in your store, what sold, and who sold it"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Generated server-side (no screenshot needed) so social/link-preview cards
 * work immediately — see ID-04 in the July 2026 QA audit. Applies as the
 * default share image for any page that doesn't define its own.
 */
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
          background: "linear-gradient(135deg, #1a1a1a 0%, #2b1608 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#e35d1f",
              fontSize: 32,
            }}
          >
            🛡️
          </div>
          <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>MyStoreGuard</span>
        </div>
        <div style={{ display: "flex", marginTop: 48, maxWidth: 980 }}>
          <span style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.15, letterSpacing: -1 }}>
            Know what&apos;s in your store, what sold, and who sold it.
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 32 }}>
          <span style={{ fontSize: 28, color: "#c9c9c9" }}>
            Stock, sales, staff, and money — from delivery to receipt.
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
