import React from 'react';

export default function SessionHistory({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div>
        <h3 className="text-center mb-6 text-2xl font-bold text-gray-800">セッション履歴</h3>
        <div className="text-center py-8">
          <p className="text-gray-600">まだセッションがありません</p>
          <p className="text-gray-600">最初のセッションを開始しましょう！</p>
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
    <div>
      <h3 className="text-center mb-6 text-2xl font-bold text-gray-800">セッション履歴</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl border-2 border-yellow-200 shadow-md">
          <div className="text-sm text-gray-600 mb-2 font-semibold">最高スコア</div>
          <div className="text-2xl font-bold text-orange-500">{bestScore}</div>
        </div>
        <div className="text-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-2xl border-2 border-orange-200 shadow-md">
          <div className="text-sm text-gray-600 mb-2 font-semibold">平均スコア</div>
          <div className="text-2xl font-bold text-orange-500">{averageScore}</div>
        </div>
        <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl border-2 border-yellow-200 shadow-md">
          <div className="text-sm text-gray-600 mb-2 font-semibold">セッション数</div>
          <div className="text-2xl font-bold text-orange-500">{sessions.length}</div>
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-center text-lg font-semibold text-gray-800">最近のセッション</h4>
        <div className="flex flex-col gap-3">
          {sessions.slice(0, 5).map((session, index) => (
            <div key={session.id} className="flex items-center bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-2xl border-2 border-orange-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-300">
              <div className="w-16 text-center">
                {index === 0 && sessions.length > 1 ? (
                  <span className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white py-1 px-3 rounded-full text-xs font-bold shadow-md">NEW</span>
                ) : (
                  <span className="font-bold text-gray-500">#{index + 1}</span>
                )}
              </div>
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="text-2xl font-bold text-orange-500 min-w-[60px]">{session.score}</div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-sm text-gray-700">{session.timestamp}</div>
                  {session.exerciseTitle && (
                    <div className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-0.5 rounded-full inline-block w-fit">
                      {session.exerciseTitle}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 min-w-[50px]">{session.duration}</div>
              </div>
              <div className="w-10 text-center">
                {index === 0 && trend && (
                  <span className="text-sm font-semibold text-gray-600">
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {sessions.length > 5 && (
        <div className="text-center mt-4 text-gray-600 italic">
          <p>+{sessions.length - 5} 件のセッションがあります</p>
        </div>
      )}
    </div>
  );
}



