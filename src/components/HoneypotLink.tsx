/**
 * Invisible to readers, discoverable by naive crawlers that follow every link.
 * A hit is recorded by /bot-trap.
 */
export function HoneypotLink() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      <a href="/bot-trap" tabIndex={-1}>
        网站归档
      </a>
    </div>
  );
}
