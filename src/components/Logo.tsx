export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 285.8 285.8"
      fill="none"
      role="img"
      aria-label="Porcelain Claire"
    >
      <circle
        cx="142.9"
        cy="142.9"
        r="129.6"
        stroke="currentColor"
        strokeWidth="5.3"
        fill="none"
      />
      <circle
        cx="142.9"
        cy="142.9"
        r="116.4"
        stroke="currentColor"
        strokeWidth="5.3"
        fill="none"
      />
      <text
        x="76"
        y="213"
        fill="currentColor"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="200"
        fontWeight="400"
      >
        C
      </text>
    </svg>
  );
}
