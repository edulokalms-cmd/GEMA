import React from 'react';

interface HamzanwadiLogoProps {
  className?: string;
  size?: number | string;
}

export const HamzanwadiLogo: React.FC<HamzanwadiLogoProps> = ({
  className = 'w-10 h-10',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Universitas Hamzanwadi"
    >
      <defs>
        {/* Curved text paths */}
        <path
          id="text-path-top"
          d="M 100,240 A 175,175 0 0,1 400,240"
          fill="none"
        />
        <path
          id="text-path-bottom"
          d="M 90,265 A 185,185 0 0,0 410,265"
          fill="none"
        />
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C039" />
          <stop offset="50%" stopColor="#EAA736" />
          <stop offset="100%" stopColor="#D49420" />
        </linearGradient>
      </defs>

      {/* Outer shield scalloped border */}
      <path
        d="M 250,22 
           C 275,45 315,55 348,50 
           C 375,75 410,95 432,125 
           C 440,165 465,195 480,230 
           C 465,270 475,310 460,350 
           C 435,385 430,420 395,445 
           C 355,460 325,475 285,482 
           C 265,478 250,475 250,475 
           C 250,475 235,478 215,482 
           C 175,475 145,460 105,445 
           C 70,420 65,385 40,350 
           C 25,310 35,270 20,230 
           C 35,195 60,165 68,125 
           C 90,95 125,75 152,50 
           C 185,55 225,45 250,22 Z"
        fill="#012E26"
        stroke="#012E26"
        strokeWidth="6"
      />

      {/* Gold inner border */}
      <path
        d="M 250,38 
           C 272,60 308,68 338,64 
           C 362,86 394,105 414,132 
           C 421,168 444,195 458,226 
           C 444,262 453,298 440,334 
           C 418,366 413,397 382,420 
           C 346,433 319,446 283,452 
           C 265,449 250,446 250,446 
           C 250,446 235,449 217,452 
           C 181,446 154,433 118,420 
           C 87,397 82,366 60,334 
           C 47,298 56,262 42,226 
           C 56,195 79,168 86,132 
           C 106,105 138,86 162,64 
           C 192,68 228,60 250,38 Z"
        fill="none"
        stroke="url(#gold-grad)"
        strokeWidth="16"
        strokeLinejoin="round"
      />

      {/* Deep green field */}
      <path
        d="M 250,54 
           C 269,73 302,80 328,76 
           C 249,95 378,112 396,136 
           C 402,168 423,192 435,220 
           C 423,252 431,284 420,316 
           C 400,344 396,372 368,392 
           C 336,404 313,415 281,420 
           C 265,418 250,415 250,415 
           C 250,415 235,418 219,420 
           C 187,415 164,404 132,392 
           C 104,372 100,344 80,316 
           C 69,284 77,252 65,220 
           C 77,192 98,168 104,136 
           C 122,112 151,95 172,76 
           C 198,80 231,73 250,54 Z"
        fill="#012E26"
      />

      {/* Arc banner text: UNIVERSITAS */}
      <text
        fill="#FFFFFF"
        fontSize="35"
        fontWeight="900"
        letterSpacing="6"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <textPath href="#text-path-top" startOffset="50%">
          UNIVERSITAS
        </textPath>
      </text>

      {/* Arc banner text: HAMZANWADI */}
      <text
        fill="#FFFFFF"
        fontSize="34"
        fontWeight="900"
        letterSpacing="7"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        <textPath href="#text-path-bottom" startOffset="50%">
          HAMZANWADI
        </textPath>
      </text>

      {/* Left & Right Stars */}
      <polygon
        points="92,255 96,267 108,267 98,274 102,286 92,279 82,286 86,274 76,267 88,267"
        fill="#FFFFFF"
      />
      <polygon
        points="408,255 412,267 424,267 414,274 418,286 408,279 398,286 402,274 392,267 404,267"
        fill="#FFFFFF"
      />

      {/* Central Dome / Arch Motif */}
      <path
        d="M 215,310 
           V 210 
           C 215,170 250,150 250,150 
           C 250,150 285,170 285,210 
           V 310 Z"
        fill="none"
        stroke="url(#gold-grad)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Radiating Sun / Star & Crescent in Dome */}
      <circle cx="250" cy="205" r="28" fill="url(#gold-grad)" />
      {/* Sun rays */}
      <g stroke="#F5C039" strokeWidth="3">
        <line x1="250" y1="165" x2="250" y2="175" />
        <line x1="250" y1="235" x2="250" y2="245" />
        <line x1="210" y1="205" x2="220" y2="205" />
        <line x1="280" y1="205" x2="290" y2="205" />
        <line x1="222" y1="177" x2="229" y2="184" />
        <line x1="271" y1="226" x2="278" y2="233" />
        <line x1="222" y1="233" x2="229" y2="226" />
        <line x1="271" y1="184" x2="278" y2="177" />
      </g>
      {/* Crescent and star in green */}
      <circle cx="250" cy="205" r="14" fill="#012E26" />
      <circle cx="254" cy="203" r="12" fill="url(#gold-grad)" />
      <polygon
        points="247,203 249,207 253,207 250,209 251,213 247,211 243,213 244,209 241,207 245,207"
        fill="#012E26"
      />

      {/* Left Golden Fronds / Wings */}
      <path
        d="M 210,320 
           C 180,310 150,280 145,240 
           C 155,270 180,290 205,295 
           C 175,280 160,250 160,210 
           C 172,245 195,265 215,275 Z"
        fill="url(#gold-grad)"
      />

      {/* Right Golden Fronds / Wings */}
      <path
        d="M 290,320 
           C 320,310 350,280 355,240 
           C 345,270 320,290 295,295 
           C 325,280 340,250 340,210 
           C 328,245 305,265 285,275 Z"
        fill="url(#gold-grad)"
      />

      {/* Open Book (White with dark green edges) */}
      <path
        d="M 250,305 
           C 230,295 200,290 185,295 
           L 185,325 
           C 200,320 230,325 250,335 
           C 270,325 300,320 315,325 
           L 315,295 
           C 300,290 270,295 250,305 Z"
        fill="#FFFFFF"
        stroke="#012E26"
        strokeWidth="3"
      />
      {/* Book pages detail */}
      <path
        d="M 250,335 V 305"
        stroke="#012E26"
        strokeWidth="3"
      />
      <path
        d="M 195,305 C 215,302 235,305 245,312"
        stroke="#E2E8F0"
        strokeWidth="2"
      />
      <path
        d="M 305,305 C 285,302 265,305 255,312"
        stroke="#E2E8F0"
        strokeWidth="2"
      />

      {/* Red Pen / Kalam standing vertically */}
      <path
        d="M 246,240 
           L 246,305 
           L 250,318 
           L 254,305 
           L 254,240 Z"
        fill="#E53935"
        stroke="#B71C1C"
        strokeWidth="2"
      />
      {/* Pen nib gold accent */}
      <polygon
        points="248,312 250,318 252,312"
        fill="#F5C039"
      />
    </svg>
  );
};
