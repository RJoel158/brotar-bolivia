import { useEffect, useRef, useState, type FC } from 'react';

interface AuthQuote {
  text: string;
  author: string;
}

const DEFAULT_QUOTES: AuthQuote[] = [
  {
    text: 'Cada iniciativa sembrada con transparencia regenera la confianza colectiva.',
    author: 'Comunidad Brotar · Bolivia',
  },
  {
    text: 'El impacto ambiental florece cuando las ideas encuentran el respaldo que merecen.',
    author: 'Red de Proyectos Verdes',
  },
  {
    text: 'Conectando comunidades conscientes con proyectos de conservación verificables.',
    author: 'Ecosistema Regenerativo',
  },
  {
    text: 'Sembrando hoy la biodiversidad y el desarrollo sostenible de nuestras regiones.',
    author: 'Creadores & Guardianes',
  },
];

interface AuthArtSideProps {
  quotes?: AuthQuote[];
  quote?: string;
  quoteAuthor?: string;
  onNavigateHome?: () => void;
  badgeText?: string;
}

export const AuthArtSide: FC<AuthArtSideProps> = ({
  quotes = DEFAULT_QUOTES,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Rotating quotes with calm crossfade
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentQuoteIdx((prev) => (prev + 1) % quotes.length);
        setIsFading(false);
      }, 650); // wait for fade-out before changing text
    }, 6500);

    return () => clearInterval(interval);
  }, [quotes.length]);

  // Canvas botanical life cycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 850);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse phototropism (gentle attraction to mouse light)
    let mouseX = width / 2;
    let mouseY = height / 3;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Floating Spores / Pollen motes
    interface Spore {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      speedY: number;
      baseX: number;
      oscSpeed: number;
      oscDist: number;
    }

    const spores: Spore[] = Array.from({ length: 38 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      radius: Math.random() * 2.2 + 0.8,
      alpha: Math.random() * 0.5 + 0.2,
      speedY: Math.random() * 0.45 + 0.15,
      oscSpeed: Math.random() * 0.02 + 0.008,
      oscDist: Math.random() * 28 + 12,
    }));

    // Richer Botanical Tree Definition ("Que brote más")
    interface LeafDef {
      t: number; // position along branch
      side: 1 | -1;
      scale: number;
      angleOffset: number;
    }

    interface BranchDef {
      t: number; // position on main trunk [0..1]
      angle: number;
      lengthRatio: number;
      leaves: LeafDef[];
      subBranches?: {
        t: number;
        angle: number;
        lengthRatio: number;
        leaves: LeafDef[];
      }[];
    }

    // Lush plant structure with multiple leafy nodes
    const plantStructure: BranchDef[] = [
      {
        t: 0.18,
        angle: -0.52,
        lengthRatio: 0.26,
        leaves: [
          { t: 0.4, side: 1, scale: 0.75, angleOffset: 0.3 },
          { t: 0.7, side: -1, scale: 0.85, angleOffset: -0.3 },
          { t: 1.0, side: 1, scale: 0.95, angleOffset: 0.1 },
        ],
        subBranches: [
          {
            t: 0.6,
            angle: 0.4,
            lengthRatio: 0.16,
            leaves: [
              { t: 0.5, side: 1, scale: 0.65, angleOffset: 0.2 },
              { t: 1.0, side: -1, scale: 0.7, angleOffset: 0 },
            ],
          },
        ],
      },
      {
        t: 0.28,
        angle: 0.58,
        lengthRatio: 0.28,
        leaves: [
          { t: 0.35, side: -1, scale: 0.8, angleOffset: -0.3 },
          { t: 0.65, side: 1, scale: 0.9, angleOffset: 0.35 },
          { t: 1.0, side: -1, scale: 1.0, angleOffset: -0.1 },
        ],
        subBranches: [
          {
            t: 0.55,
            angle: -0.42,
            lengthRatio: 0.18,
            leaves: [
              { t: 0.6, side: -1, scale: 0.65, angleOffset: -0.25 },
              { t: 1.0, side: 1, scale: 0.75, angleOffset: 0.1 },
            ],
          },
        ],
      },
      {
        t: 0.42,
        angle: -0.38,
        lengthRatio: 0.32,
        leaves: [
          { t: 0.3, side: 1, scale: 0.8, angleOffset: 0.3 },
          { t: 0.6, side: -1, scale: 0.9, angleOffset: -0.28 },
          { t: 0.85, side: 1, scale: 0.85, angleOffset: 0.25 },
          { t: 1.0, side: -1, scale: 0.95, angleOffset: 0 },
        ],
        subBranches: [
          {
            t: 0.7,
            angle: 0.35,
            lengthRatio: 0.19,
            leaves: [
              { t: 0.6, side: 1, scale: 0.65, angleOffset: 0.2 },
              { t: 1.0, side: -1, scale: 0.7, angleOffset: 0 },
            ],
          },
        ],
      },
      {
        t: 0.56,
        angle: 0.44,
        lengthRatio: 0.34,
        leaves: [
          { t: 0.35, side: -1, scale: 0.85, angleOffset: -0.3 },
          { t: 0.7, side: 1, scale: 0.95, angleOffset: 0.32 },
          { t: 1.0, side: -1, scale: 1.0, angleOffset: 0.05 },
        ],
      },
      {
        t: 0.72,
        angle: -0.3,
        lengthRatio: 0.28,
        leaves: [
          { t: 0.45, side: 1, scale: 0.8, angleOffset: 0.25 },
          { t: 0.8, side: -1, scale: 0.85, angleOffset: -0.25 },
          { t: 1.0, side: 1, scale: 0.9, angleOffset: 0 },
        ],
      },
      {
        t: 0.84,
        angle: 0.32,
        lengthRatio: 0.24,
        leaves: [
          { t: 0.5, side: -1, scale: 0.75, angleOffset: -0.2 },
          { t: 1.0, side: 1, scale: 0.85, angleOffset: 0.1 },
        ],
      },
    ];

    let time = 0;

    // Helper: draw an organic leaf with natural gradient & breathing pulse
    const drawLeaf = (
      x: number,
      y: number,
      angle: number,
      scale: number,
      sway: number,
      pulse: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + sway);
      const finalScale = scale * (1 + pulse * 0.08);
      ctx.scale(finalScale, finalScale);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(14, -9, 26, -7, 32, 0);
      ctx.bezierCurveTo(26, 7, 14, 9, 0, 0);

      // Translucent lush botanical gradient
      const leafGrad = ctx.createLinearGradient(0, 0, 32, 0);
      leafGrad.addColorStop(0, 'rgba(32, 85, 61, 0.75)');
      leafGrad.addColorStop(0.55, 'rgba(64, 153, 110, 0.82)');
      leafGrad.addColorStop(1, 'rgba(167, 228, 194, 0.92)');

      ctx.fillStyle = leafGrad;
      ctx.fill();

      // Leaf central vein
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(26, 0);
      ctx.strokeStyle = 'rgba(216, 243, 220, 0.45)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      time += 0.016;
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Deep botanical backdrop
      ctx.fillStyle = '#08160f';
      ctx.fillRect(0, 0, width, height);

      // Earth & Root Glow
      const rootGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.96,
        15,
        width * 0.5,
        height * 0.86,
        width * 0.7,
      );
      rootGlow.addColorStop(0, 'rgba(45, 106, 79, 0.4)');
      rootGlow.addColorStop(0.55, 'rgba(23, 66, 47, 0.2)');
      rootGlow.addColorStop(1, 'rgba(8, 22, 15, 0)');
      ctx.fillStyle = rootGlow;
      ctx.fillRect(0, 0, width, height);

      // Interactive Sunlight Glow around mouse
      const sunGlow = ctx.createRadialGradient(
        mouseX,
        mouseY,
        15,
        mouseX,
        mouseY,
        width * 0.65,
      );
      sunGlow.addColorStop(0, 'rgba(116, 198, 157, 0.15)');
      sunGlow.addColorStop(0.6, 'rgba(45, 106, 79, 0.05)');
      sunGlow.addColorStop(1, 'rgba(8, 22, 15, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height);

      // Organic wind and phototropism
      const windSway = Math.sin(time * 0.9) * 0.045 + Math.cos(time * 0.4) * 0.025;
      const phototropism = ((mouseX - width * 0.5) / (width * 0.5)) * 0.07;
      const breathingPulse = Math.sin(time * 1.5);

      // ==========================================
      // DRAW LIVING SPROUT ("BROTAR")
      // ==========================================
      const startX = width * 0.5;
      const startY = height * 0.88;
      const trunkHeight = height * 0.56;

      ctx.save();

      // Main trunk spline
      const cp1X = startX + windSway * 90 + phototropism * 60;
      const cp1Y = startY - trunkHeight * 0.52;
      const endX = startX + windSway * 160 + phototropism * 110;
      const endY = startY - trunkHeight;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);
      ctx.strokeStyle = '#2d6a4f';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Trunk Inner core
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);
      ctx.strokeStyle = '#52b788';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Top budding apex leaves
      const tipSway = Math.sin(time * 1.3) * 0.09 + phototropism;
      drawLeaf(endX, endY, -Math.PI / 2 - 0.28, 1.05, tipSway, breathingPulse);
      drawLeaf(endX, endY, -Math.PI / 2 + 0.28, 1.0, -tipSway, breathingPulse);
      drawLeaf(endX, endY - 10, -Math.PI / 2, 0.85, tipSway * 0.6, -breathingPulse);

      // Secondary apex buds
      drawLeaf(endX - 5, endY - 4, -Math.PI / 2 - 0.5, 0.65, tipSway * 0.8, breathingPulse);
      drawLeaf(endX + 5, endY - 4, -Math.PI / 2 + 0.5, 0.65, -tipSway * 0.8, breathingPulse);

      // Render lush branches along stem
      plantStructure.forEach((branch, idx) => {
        const t = branch.t;
        const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cp1X + t * t * endX;
        const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cp1Y + t * t * endY;

        const branchLen = trunkHeight * branch.lengthRatio;
        const bAngle = -Math.PI / 2 + branch.angle + windSway * (idx + 1) * 0.55;

        const bEndX = bx + Math.cos(bAngle) * branchLen;
        const bEndY = by + Math.sin(bAngle) * branchLen;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(
          bx + Math.cos(bAngle) * (branchLen * 0.5) + windSway * 22,
          by + Math.sin(bAngle) * (branchLen * 0.5),
          bEndX,
          bEndY,
        );
        ctx.strokeStyle = 'rgba(45, 106, 79, 0.88)';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Render Leaves on this branch
        branch.leaves.forEach((lf, lIdx) => {
          const lx = bx + (bEndX - bx) * lf.t;
          const ly = by + (bEndY - by) * lf.t;
          const lAngle = bAngle + (lf.side === 1 ? 0.45 : -0.45) + lf.angleOffset;
          const lSway = Math.sin(time + idx + lIdx) * 0.1 + windSway * 0.4;
          drawLeaf(lx, ly, lAngle, lf.scale, lSway, Math.sin(time * 1.4 + lIdx));
        });

        // Sub-branches
        branch.subBranches?.forEach((sub, sIdx) => {
          const sx = bx + (bEndX - bx) * sub.t;
          const sy = by + (bEndY - by) * sub.t;
          const subLen = branchLen * sub.lengthRatio * 1.6;
          const subAngle = bAngle + sub.angle + windSway * 0.35;
          const subEndX = sx + Math.cos(subAngle) * subLen;
          const subEndY = sy + Math.sin(subAngle) * subLen;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(subEndX, subEndY);
          ctx.strokeStyle = 'rgba(82, 183, 136, 0.65)';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          sub.leaves.forEach((slf, slIdx) => {
            const slx = sx + (subEndX - sx) * slf.t;
            const sly = sy + (subEndY - sy) * slf.t;
            const slAngle = subAngle + (slf.side === 1 ? 0.4 : -0.4) + slf.angleOffset;
            drawLeaf(slx, sly, slAngle, slf.scale, Math.sin(time + sIdx + slIdx) * 0.1, breathingPulse);
          });
        });
      });

      ctx.restore();

      // ==========================================
      // LIVING SPORES & POLLEN MOTES
      // ==========================================
      for (let i = 0; i < spores.length; i++) {
        const s = spores[i];
        s.y -= s.speedY;
        s.x = s.baseX + Math.sin(time * s.oscSpeed * 35 + i) * s.oscDist;

        // Subtle attraction to mouse light
        const dx = mouseX - s.x;
        const dy = mouseY - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 10) {
          s.x += (dx / dist) * 0.45;
          s.y += (dy / dist) * 0.45;
        }

        if (s.y < -15) {
          s.y = height + 15;
          s.baseX = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183, 228, 199, ${s.alpha})`;
        ctx.shadowColor = 'rgba(116, 198, 157, 0.7)';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const currentQuote = quotes[currentQuoteIdx] || DEFAULT_QUOTES[0];

  return (
    <div className="brotar-auth-art-side">
      <canvas ref={canvasRef} className="brotar-auth-art-canvas" />

      {/* Rotating Dynamic Quote at Bottom with Smooth Crossfade */}
      <div className="brotar-auth-art-content">
        <div className={`brotar-auth-art-bottom ${isFading ? 'is-fading' : 'is-visible'}`}>
          <blockquote className="brotar-auth-art-quote">
            "{currentQuote.text}"
          </blockquote>
          <cite className="brotar-auth-art-author">— {currentQuote.author}</cite>
        </div>
      </div>
    </div>
  );
};
