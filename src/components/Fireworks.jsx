import React, { useEffect, useState } from 'react';
import './Fireworks.css';

export default function Fireworks({ show, onComplete }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // 花火のパーティクルを生成
      const newParticles = [];
      const colors = ['#ff0000', '#ff6b00', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'];
      
      // 3つの花火を異なる位置に
      const fireworkPositions = [
        { x: 30, y: 40 },
        { x: 50, y: 30 },
        { x: 70, y: 40 }
      ];

      fireworkPositions.forEach((pos, fireworkIndex) => {
        // 各花火ごとに30個のパーティクル
        for (let i = 0; i < 30; i++) {
          const angle = (Math.PI * 2 * i) / 30;
          const velocity = 2 + Math.random() * 2;
          
          newParticles.push({
            id: `${fireworkIndex}-${i}`,
            x: pos.x,
            y: pos.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 4,
            delay: fireworkIndex * 200 // 花火ごとに遅延
          });
        }
      });

      setParticles(newParticles);

      // 3秒後にクリーンアップ
      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fireworks-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            '--vx': particle.vx,
            '--vy': particle.vy,
          }}
        />
      ))}
      <div className="celebration-text">
        🎉 素晴らしい！ 🎉
      </div>
    </div>
  );
}
