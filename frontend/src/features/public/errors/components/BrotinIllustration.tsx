import type { FC } from 'react';
import './BrotinIllustration.css';

export type BrotinVariant = '404' | '403' | 'friendly' | 'thinking' | 'loading' | 'growing';

interface BrotinIllustrationProps {
  variant?: BrotinVariant;
  size?: number;
  className?: string;
}

export const BrotinIllustration: FC<BrotinIllustrationProps> = ({
  variant = 'friendly',
  size = 220,
  className = '',
}) => {
  return (
    <div
      className={`brotin-illustration-container brotin-${variant} ${className}`}
      style={{ width: size, height: size }}
      aria-label="Mascota Brotín"
      role="img"
    >
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="brotin-svg"
      >
        <defs>
          <linearGradient id="brotinGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8CC63F" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0E4B34" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="brotinPotGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F2" />
          </linearGradient>

          <linearGradient id="brotinLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8CC63F" />
            <stop offset="100%" stopColor="#17913F" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Halo */}
        <circle
          cx="120"
          cy="125"
          r="95"
          fill="url(#brotinGlow)"
          className="brotin-halo"
        />

        {/* Ground shadow */}
        <ellipse
          cx="120"
          cy="205"
          rx="52"
          ry="8"
          fill="#0E4B34"
          opacity="0.12"
          className="brotin-shadow"
        />

        {/* Floating Seedling Body Group */}
        <g className="brotin-character-group">
          {/* Pot / Base Body (Minimalist Eco-Planter) */}
          <path
            d="M86 142 L94 195 C95 199 98 202 102 202 L138 202 C142 202 145 199 146 195 L154 142 Z"
            fill="url(#brotinPotGrad)"
            stroke="#0E4B34"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Planter Rim */}
          <rect
            x="80"
            y="134"
            width="80"
            height="10"
            rx="5"
            fill="#FFFFFF"
            stroke="#0E4B34"
            strokeWidth="3.5"
          />

          {/* Plant Stem */}
          <path
            d="M120 134 C120 110 120 95 120 78"
            stroke="#0E4B34"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="brotin-stem"
          />

          {/* Right Sprout Leaf */}
          <path
            d="M120 85 C145 75 162 90 156 108 C148 116 130 108 120 98"
            fill="url(#brotinLeafGrad)"
            stroke="#0E4B34"
            strokeWidth="3"
            strokeLinejoin="round"
            className="brotin-leaf-right"
          />

          {/* Left Sprout Leaf */}
          <path
            d="M120 95 C95 82 80 98 84 114 C92 120 110 112 120 105"
            fill="#8CC63F"
            stroke="#0E4B34"
            strokeWidth="3"
            strokeLinejoin="round"
            className="brotin-leaf-left"
          />

          {/* Top Tender Sprout Bud */}
          <path
            d="M120 78 C115 62 125 50 128 54 C132 58 126 72 120 78 Z"
            fill="#8CC63F"
            stroke="#0E4B34"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="brotin-bud"
          />

          {/* Face on the Planter */}
          {variant === '404' ? (
            /* 404 Mode: Curious/Searching with Magnifying Glass / Monocle */
            <g className="brotin-face brotin-face-404">
              {/* Left Eye (Curious Circle) */}
              <circle cx="106" cy="162" r="3.5" fill="#0E4B34" />
              <circle cx="107.5" cy="160.5" r="1.2" fill="#FFFFFF" />

              {/* Right Eye (Bigger explorer look) */}
              <circle cx="134" cy="162" r="3.5" fill="#0E4B34" />
              <circle cx="135.5" cy="160.5" r="1.2" fill="#FFFFFF" />

              {/* Curious 'O' mouth */}
              <ellipse cx="120" cy="174" rx="3.5" ry="4.5" fill="#0E4B34" />

              {/* Rosy Cheeks */}
              <circle cx="98" cy="168" r="3.5" fill="#8CC63F" opacity="0.6" />
              <circle cx="142" cy="168" r="3.5" fill="#8CC63F" opacity="0.6" />

              {/* Question mark / searching bubble */}
              <g className="brotin-accessory-404">
                <circle cx="162" cy="148" r="12" fill="#FFFFFF" stroke="#0E4B34" strokeWidth="2.5" />
                <line x1="171" y1="157" x2="182" y2="168" stroke="#0E4B34" strokeWidth="3" strokeLinecap="round" />
                <path d="M159 143 C159 140 165 140 165 144 C165 147 162 148 162 150" stroke="#0E4B34" strokeWidth="2" strokeLinecap="round" />
                <circle cx="162" cy="154" r="1" fill="#0E4B34" />
              </g>
            </g>
          ) : variant === '403' ? (
            /* 403 Mode: Restricted Gatekeeper with friendly key & lock */
            <g className="brotin-face brotin-face-403">
              {/* Determined / apologetic soft eyes */}
              <path d="M103 163 Q108 160 113 163" stroke="#0E4B34" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M127 163 Q132 160 137 163" stroke="#0E4B34" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Gentle straight mouth */}
              <path d="M115 174 Q120 172 125 174" stroke="#0E4B34" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Rosy Cheeks */}
              <circle cx="98" cy="168" r="3.5" fill="#8CC63F" opacity="0.6" />
              <circle cx="142" cy="168" r="3.5" fill="#8CC63F" opacity="0.6" />

              {/* Security shield/badge charm */}
              <g className="brotin-accessory-403">
                <rect x="156" y="142" width="22" height="18" rx="4" fill="#FFFFFF" stroke="#0E4B34" strokeWidth="2.5" />
                <path d="M162 142 V137 C162 134 172 134 172 137 V142" stroke="#0E4B34" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="167" cy="150" r="2" fill="#0E4B34" />
                <line x1="167" y1="152" x2="167" y2="156" stroke="#0E4B34" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          ) : variant === 'loading' || variant === 'growing' ? (
            /* Loading / Growing Mode: Cheerful Watering & Sprouting Energy */
            <g className="brotin-face brotin-face-loading">
              {/* Joyful Animated Eyes */}
              <path d="M104 163 Q108 157 112 163" stroke="#0E4B34" strokeWidth="3.2" strokeLinecap="round" fill="none" className="brotin-loading-eye-left" />
              <path d="M128 163 Q132 157 136 163" stroke="#0E4B34" strokeWidth="3.2" strokeLinecap="round" fill="none" className="brotin-loading-eye-right" />

              {/* Gentle Happy Mouth */}
              <ellipse cx="120" cy="173" rx="3.5" ry="3" fill="#0E4B34" />

              {/* Rosy Cheeks */}
              <circle cx="98" cy="167" r="4" fill="#8CC63F" opacity="0.8" />
              <circle cx="142" cy="167" r="4" fill="#8CC63F" opacity="0.8" />

              {/* Sprouting Energy Charm */}
              <g className="brotin-accessory-loading">
                <circle cx="160" cy="144" r="9" fill="#8CC63F" opacity="0.2" />
                <path d="M157 146 C157 141 163 140 163 144 C163 147 157 146 157 146 Z" fill="#8CC63F" />
                <path d="M160 148 V142" stroke="#0E4B34" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          ) : (
            /* Friendly / Neutral Mode: Joyful Smile */
            <g className="brotin-face brotin-face-friendly">
              {/* Happy Arc Eyes */}
              <path d="M104 163 Q108 158 112 163" stroke="#0E4B34" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M128 163 Q132 158 136 163" stroke="#0E4B34" strokeWidth="3" strokeLinecap="round" fill="none" />

              {/* Happy Smile */}
              <path d="M113 171 Q120 178 127 171" stroke="#0E4B34" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Rosy Cheeks */}
              <circle cx="98" cy="166" r="3.5" fill="#8CC63F" opacity="0.7" />
              <circle cx="142" cy="166" r="3.5" fill="#8CC63F" opacity="0.7" />
            </g>
          )}

          {/* Plant Pot Brotar Logo Emblem */}
          <path
            d="M120 184 C117 180 120 178 120 178 C120 178 123 180 120 184 Z"
            fill="#8CC63F"
          />
        </g>

        {/* Ambient Sprout Floating Particles */}
        <g className="brotin-particles">
          <circle cx="65" cy="80" r="3" fill="#8CC63F" className="particle p1" />
          <circle cx="178" cy="65" r="2.5" fill="#8CC63F" className="particle p2" />
          <circle cx="190" cy="115" r="2" fill="#17913F" className="particle p3" />
          <circle cx="50" cy="135" r="2.5" fill="#0E4B34" opacity="0.4" className="particle p4" />
        </g>
      </svg>
    </div>
  );
};
