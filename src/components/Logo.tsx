export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 285.75 285.75"
      fill="none"
      role="img"
      aria-label="Porcelain Claire"
    >
      <circle
        cx="142.875"
        cy="142.875"
        r="129.646"
        stroke="currentColor"
        strokeWidth="5.292"
        fill="none"
      />
      <circle
        cx="142.875"
        cy="142.875"
        r="116.417"
        stroke="currentColor"
        strokeWidth="5.292"
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
