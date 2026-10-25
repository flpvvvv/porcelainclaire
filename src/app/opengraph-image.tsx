import { ImageResponse } from "next/og";

export const alt = "Porcelain Claire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #1a1816 0%, #2d2824 45%, #121110 100%)",
        padding: 72,
      }}
    >
      <p
        style={{
          fontSize: 28,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(245, 239, 232, 0.55)",
          margin: 0,
        }}
      >
        Blog
      </p>
      <p
        style={{
          fontSize: 72,
          fontWeight: 600,
          lineHeight: 1.05,
          color: "#f5efe8",
          marginTop: 24,
          marginBottom: 0,
          maxWidth: 900,
        }}
      >
        Porcelain Claire
      </p>
      <p
        style={{
          fontSize: 32,
          lineHeight: 1.4,
          color: "rgba(245, 239, 232, 0.78)",
          marginTop: 28,
          maxWidth: 920,
        }}
      >
        写给愿意慢慢读的人
      </p>
    </div>,
    { ...size },
  );
}
