/** Line-art SUV silhouette used in the hero. */
export function CarArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 300" className={className} fill="none" aria-hidden>
      <defs>
        <radialGradient id="ground" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFC800" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFC800" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="beam" cx="0" cy="0.5" r="1">
          <stop offset="0" stopColor="#FFC800" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFC800" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="320" cy="248" rx="300" ry="26" fill="url(#ground)" />
      {/* headlight beam */}
      <path d="M52 176 L-40 150 L-40 215 Z" fill="url(#beam)" opacity="0.35" />
      {/* body */}
      <path
        d="M52 228 C44 206 46 190 66 180 L168 156 C196 134 226 106 266 96 C338 86 470 84 522 88 C560 92 588 120 606 138 C622 144 632 154 634 170 L636 214 C636 222 632 228 624 228 L572 228 A52 52 0 0 0 468 228 L214 228 A52 52 0 0 0 110 228 Z"
        stroke="url(#body)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* belt line */}
      <path d="M170 160 L600 150" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* windows */}
      <path d="M190 154 L270 106 C330 98 390 96 432 97 L438 152 Z" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M452 152 L447 97 C486 97 520 100 540 108 L584 146 Z" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.8" strokeLinejoin="round" />
      {/* door lines */}
      <path d="M440 154 L446 222" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.4" />
      <path d="M300 158 L296 226" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.4" />
      {/* handles */}
      <path d="M330 170 h22 M470 168 h22" stroke="#fff" strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" />
      {/* mirror */}
      <path d="M232 132 l-18 6 l4 10 l20 -4 z" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinejoin="round" />
      {/* roof rails */}
      <path d="M300 86 L500 82" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
      {/* headlight + tail light */}
      <path d="M60 178 L96 170 L92 184 L64 190 Z" fill="#FFC800" />
      <path d="M622 146 L634 152 L634 176 L624 174 Z" fill="#FFC800" fillOpacity="0.7" />
      {/* wheels */}
      {[162, 520].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="228" r="42" stroke="#fff" strokeOpacity="0.9" strokeWidth="2.2" />
          <circle cx={cx} cy="228" r="26" stroke="#FFC800" strokeWidth="2" />
          <circle cx={cx} cy="228" r="6" fill="#FFC800" />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1={cx + 8 * Math.cos((a * Math.PI) / 180)}
              y1={228 + 8 * Math.sin((a * Math.PI) / 180)}
              x2={cx + 24 * Math.cos((a * Math.PI) / 180)}
              y2={228 + 24 * Math.sin((a * Math.PI) / 180)}
              stroke="#FFC800"
              strokeOpacity="0.8"
              strokeWidth="2"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
