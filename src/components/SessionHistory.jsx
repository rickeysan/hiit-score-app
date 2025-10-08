import React from 'react';

export default function SessionHistory({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div className="session-history">
        <h3>セッション履歴</h3>
        <div className="empty-history">
          <p>まだセッションがありません</p>
          <p>最初のセッションを開始しましょう！</p>
        </div>
      </div>
    );
  }

  const getBestScore = () => {
    return Math.max(...sessions.map(s => s.score));
  };

  const getAverageScore = () => {
    const total = sessions.reduce((sum, s) => sum + s.score, 0);
    return Math.round(total / sessions.length);
  };

  const getRecentTrend = () => {
    if (sessions.length < 2) return null;
    const recent = sessions[0].score;
    const previous = sessions[1].score;
    return recent > previous ? 'up' : recent < previous ? 'down' : 'same';
  };

  const bestScore = getBestScore();
  const averageScore = getAverageScore();
  const trend = getRecentTrend();

  return (
    <div className="session-history">
      <h3>セッション履歴</h3>
      
      <div className="history-stats">
        <div className="stat-item">
          <div className="stat-label">最高スコア</div>
          <div className="stat-value best">{bestScore}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">平均スコア</div>
          <div className="stat-value average">{averageScore}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">セッション数</div>
          <div className="stat-value count">{sessions.length}</div>
        </div>
      </div>

      <div className="recent-sessions">
        <h4>最近のセッション</h4>
        <div className="sessions-list">
          {sessions.slice(0, 5).map((session, index) => (
            <div key={session.id} className="session-item">
              <div className="session-rank">
                {index === 0 && sessions.length > 1 ? (
                  <span className="rank-badge new">NEW</span>
                ) : (
                  <span className="rank-number">#{index + 1}</span>
                )}
              </div>
              <div className="session-details">
                <div className="session-score">{session.score}</div>
                <div className="session-time">{session.timestamp}</div>
                <div className="session-duration">{session.duration}</div>
              </div>
              <div className="session-trend">
                {index === 0 && trend && (
                  <span className={`trend-icon ${trend}`}>
                    {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {sessions.length > 5 && (
        <div className="more-sessions">
          <p>+{sessions.length - 5} 件のセッションがあります</p>
        </div>
      )}
    </div>
  );
}
