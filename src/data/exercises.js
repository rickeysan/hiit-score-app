// 体操データの配列（多言語対応）
const exercisesData = {
  ja: [
    {
      id: 1,
      title: '1. 腕回し',
      videoUrl: '/lessons/1-udeage.mp4',
      description: '肩こり・首こりの緩和に効果的',
      targetScore: 100,
      effects: [
        '肩こり・首こりの緩和',
        '上半身の血行促進',
        '姿勢改善とリフレッシュ効果'
      ],
      steps: [
        'カメラの前に立ち、肩幅に足を開きます',
        '両腕を左右に大きく広げます',
        'リズミカルに腕を上下に動かします',
        '肩甲骨を意識しながら、大きく動かしましょう'
      ],
      points: [
        '呼吸を止めずに、自然な呼吸を心がけましょう',
        '無理のない範囲で動かし、痛みを感じたら中止してください',
        'カメラに全身が映るように立ち位置を調整しましょう'
      ],
      timing: [
        'デスクワークの合間（1時間に1回程度）',
        '会議の前後のリフレッシュに',
        '集中力が落ちてきたと感じたとき'
      ]
    },
    {
      id: 2,
      title: '2. ゴキブリ体操',
      videoUrl: '/lessons/2-gokiburi.mp4',
      description: '肩甲骨を意識しながら、大きく動かしましょう',
      targetScore: 120,
      effects: [
        '肩甲骨の血行促進',
        '筋肉の緊張緩和',
        'リラックス効果'
      ],
      steps: [
        '腕を上げます',
        '右腕を上げて、左腕をさげます',
        '交互に繰り返します',
        '深呼吸しながら肩甲骨をほぐします'
      ],
      points: [
        'ゆっくりとした動作を心がけましょう',
        '深い呼吸を意識してください',
        '痛みを感じる場合は無理をしないでください'
      ],
      timing: [
        '起床後や就寝前',
        '長時間のデスクワーク後',
        '運動前のウォームアップに'
      ]
    },
    {
      id: 3,
      title: 'Coming soon',
      description: '新しいコンテンツを準備中です',
      targetScore: 100,
      comingSoon: true
    }
  ],
  en: [
    {
      id: 1,
      title: '1. Arm Circles',
      videoUrl: '/lessons/1-udeage.mp4',
      description: 'Effective for relieving shoulder and neck stiffness',
      targetScore: 100,
      effects: [
        'Relieves shoulder and neck stiffness',
        'Promotes upper body blood circulation',
        'Improves posture and provides refreshment'
      ],
      steps: [
        'Stand in front of the camera with feet shoulder-width apart',
        'Spread both arms wide to the sides',
        'Move your arms up and down rhythmically',
        'Move large while being aware of your shoulder blades'
      ],
      points: [
        'Maintain natural breathing and don\'t hold your breath',
        'Move within a comfortable range and stop if you feel pain',
        'Adjust your position so your whole body is visible to the camera'
      ],
      timing: [
        'During desk work breaks (about once per hour)',
        'Before and after meetings for refreshment',
        'When you feel your concentration is dropping'
      ]
    },
    {
      id: 2,
      title: '2. Cockroach Exercise',
      videoUrl: '/lessons/2-gokiburi.mp4',
      description: 'Move large while being aware of your shoulder blades',
      targetScore: 120,
      effects: [
        'Promotes blood circulation in shoulder blades',
        'Relieves muscle tension',
        'Relaxation effect'
      ],
      steps: [
        'Raise your arms',
        'Raise your right arm and lower your left arm',
        'Repeat alternately',
        'Loosen your shoulder blades while taking deep breaths'
      ],
      points: [
        'Focus on slow movements',
        'Be conscious of deep breathing',
        'Don\'t push yourself if you feel pain'
      ],
      timing: [
        'After waking up or before bedtime',
        'After long desk work sessions',
        'As a warm-up before exercise'
      ]
    },
    {
      id: 3,
      title: 'Coming soon',
      description: 'New content coming soon',
      targetScore: 100,
      comingSoon: true
    }
  ]
}

// 言語に応じた体操データを返す関数
export const getExercises = (language = 'ja') => {
  return exercisesData[language] || exercisesData.ja
}

// 後方互換性のためにデフォルトエクスポート
export const exercises = exercisesData.ja

