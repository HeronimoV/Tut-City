"use client";

import { useEffect, useState } from "react";

export default function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number; size: number; rotation: number }[]>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ["#7c3aed", "#3b82f6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ec4899"];
    const p = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -20 - 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
    }));
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
