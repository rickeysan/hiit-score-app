import React from 'react';

export default function ScoreDisplay({ score, isActive }) {
  const displayScore = Math.floor(score);
  
  // スコアに基づく評価レベル
  const getScoreLevel = (score) => {
    if (score < 50) return { level: '初級', color: '#4CAF50', emoji: '🌱' };
    if (score < 100) return { level: '中級', color: '#FF9800', emoji: '🔥' };
    if (score < 200) return { level: '上級', color: '#F44336', emoji: '💪' };
    return { level: 'マスター', color: '#9C27B0', emoji: '👑' };
  };

  const scoreLevel = getScoreLevel(displayScore);

  return (
    <div className="score-display">
      <div className="score-main">
        <div className="score-number" style={{ color: scoreLevel.color }}>
          {displayScore}
        </div>
        <div className="score-label">スコア</div>
      </div>
      
      <div className="score-level" style={{ color: scoreLevel.color }}>
        <span className="level-emoji">{scoreLevel.emoji}</span>
        <span className="level-text">{scoreLevel.level}</span>
      </div>
      
      <div className="score-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min((displayScore / 200) * 100, 100)}%`,
              backgroundColor: scoreLevel.color
            }}
          />
        </div>
        <div className="progress-text">
          次レベルまで: {Math.max(0, 200 - displayScore)}ポイント
        </div>
      </div>
      
      {isActive && (
        <div className="session-indicator">
          <div className="pulse-dot" />
          <span>セッション中</span>
        </div>
      )}
    </div>
  );
}
