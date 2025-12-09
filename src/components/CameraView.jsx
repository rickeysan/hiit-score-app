import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { useLanguage } from '../i18n/LanguageContext';

export default function CameraView({ onScoreUpdate, isActive, onCameraError }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const isMountedRef = useRef(true);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const isActiveRef = useRef(isActive);

  // onScoreUpdateとisActiveを最新の状態に保つ
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onScoreUpdate]);

  useEffect(() => {
    isActiveRef.current = isActive;
    console.log('🔄 isActiveが変更されました:', isActive);
  }, [isActive]);

  // モーダルのESCキー対応とスクロールロック
  useEffect(() => {
    if (showModal) {
      // スクロールをロック
      document.body.style.overflow = 'hidden';
      
      // ESCキーでモーダルを閉じる
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowModal(false);
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showModal]);

  // エラー状態を親コンポーネントに通知
  useEffect(() => {
    if (onCameraError) {
      onCameraError(!!error);
    }
  }, [error, onCameraError]);

  useEffect(() => {
    isMountedRef.current = true; // マウント時にtrueに設定
    let detector;
    let animationFrameId;
    let prevPoses = null;
    let stream = null;

    const setupCamera = async () => {
      try {
        console.log('🎥 カメラのセットアップを開始...');
        
        // カメラが利用可能かチェック
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('❌ カメラAPIが利用できません');
          if (isMountedRef.current) {
            setError(t('cameraNotSupported'));
          }
          return null;
        }

        const video = videoRef.current;
        if (!video) {
          console.error('❌ video要素が見つかりません');
          return null;
        }
        if (!isMountedRef.current) {
          console.log('⚠️ コンポーネントがアンマウントされています');
          return null;
        }

        console.log('📹 カメラストリームを要求中...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' // フロントカメラを使用
          } 
        });
        console.log('✅ カメラストリーム取得成功');

        if (!isMountedRef.current) {
          console.log('⚠️ ストリーム取得後、コンポーネントがアンマウントされました');
          stream.getTracks().forEach(track => track.stop());
          return null;
        }

        video.srcObject = stream;
        console.log('📺 ビデオソースを設定しました');
        
        // video要素が存在し、マウントされている場合のみ再生
        if (video && isMountedRef.current) {
          console.log('▶️ ビデオ再生を開始...');
          await video.play();
          console.log('✅ ビデオ再生成功');
          
          if (isMountedRef.current) {
            setIsInitialized(true);
            setError(null);
            console.log('✅ カメラ初期化完了');
          }
        }

        return stream;
      } catch (err) {
        console.error('カメラの取得に失敗しました:', err);
        
        if (!isMountedRef.current) return null;
        
        // エラーの種類に応じたメッセージ
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(t('cameraPermissionDenied'));
        } else if (err.name === 'NotFoundError') {
          setError(t('cameraNotFound'));
        } else if (err.name === 'NotReadableError') {
          setError(t('cameraInUse'));
        } else if (err.name === 'AbortError') {
          // AbortErrorは開発時のホットリロードで頻繁に発生するため無視
          console.warn('⚠️ カメラ初期化が中断されました（開発モードでは正常）');
        } else {
          // play()エラーは無視（コンポーネントのアンマウント時によく発生）
          if (!err.message.includes('play()') && !err.message.includes('interrupted')) {
            setError(`${t('cameraError')}: ${err.message}. ${t('reloadPage')}`);
          } else {
            console.warn('⚠️ ビデオ再生が中断されました（開発モードでは正常）');
          }
        }
        return null;
      }
    };

    const calculateMovementScore = (currentPoses, previousPoses) => {
      if (!previousPoses || previousPoses.length === 0) return 0;
      
      let totalMovement = 0;
      
      // MoveNetの17個の関節点から主要な部位を選択
      // 0:鼻, 1:左目, 2:右目, 3:左耳, 4:右耳,
      // 5:左肩, 6:右肩, 7:左肘, 8:右肘, 9:左手首, 10:右手首,
      // 11:左腰, 12:右腰, 13:左膝, 14:右膝, 15:左足首, 16:右足首
      const keyJoints = [
        9, 10,   // 手首（重要）
        7, 8,    // 肘
        5, 6,    // 肩
        13, 14,  // 膝
        15, 16   // 足首（重要）
      ];
      
      currentPoses.forEach((pose, poseIndex) => {
        if (previousPoses[poseIndex]) {
          const currentKeypoints = pose.keypoints;
          const prevKeypoints = previousPoses[poseIndex].keypoints;
          
          keyJoints.forEach(jointIndex => {
            const currentJoint = currentKeypoints[jointIndex];
            const prevJoint = prevKeypoints[jointIndex];
            
            // 関節点が存在し、信頼度が十分高い場合のみ計算
            if (currentJoint && prevJoint && 
                currentJoint.score > 0.3 && prevJoint.score > 0.3) {
              const dx = currentJoint.x - prevJoint.x;
              const dy = currentJoint.y - prevJoint.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // 移動量に重み付け（手首と足首を重視）
              let weight = 1;
              if (jointIndex === 9 || jointIndex === 10) weight = 1.5;  // 手首
              if (jointIndex === 15 || jointIndex === 16) weight = 1.3; // 足首
              
              totalMovement += distance * weight;
            }
          });
        }
      });
      
      return totalMovement;
    };

    const drawSkeleton = (poses) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      
      if (!canvas || !ctx || !video) return;
      
      // キャンバスサイズを動画に合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      poses.forEach(pose => {
        const keypoints = pose.keypoints;
        
        // 関節点を描画
        keypoints.forEach(keypoint => {
          if (keypoint.score > 0.3) { // 信頼度が30%以上の場合のみ描画
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
        
        // 骨格線を描画
        // MoveNetの17個の関節点:
        // 0:鼻, 1:左目, 2:右目, 3:左耳, 4:右耳,
        // 5:左肩, 6:右肩, 7:左肘, 8:右肘, 9:左手首, 10:右手首,
        // 11:左腰, 12:右腰, 13:左膝, 14:右膝, 15:左足首, 16:右足首
        const connections = [
          [0, 1], [0, 2], [1, 3], [2, 4], // 顔
          [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], // 上半身
          [5, 11], [6, 12], [11, 12], // 肩と腰
          [11, 13], [12, 14], [13, 15], [14, 16] // 脚
        ];
        
        connections.forEach(([startIdx, endIdx]) => {
          const startPoint = keypoints[startIdx];
          const endPoint = keypoints[endIdx];
          
          // 関節点が存在し、信頼度が十分高い場合のみ描画
          if (startPoint && endPoint && 
              startPoint.score > 0.3 && endPoint.score > 0.3) {
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
          }
        });
      });
    };

    let frameCount = 0;
    const detectPose = async () => {
      if (!detector || !videoRef.current) {
        animationFrameId = requestAnimationFrame(detectPose);
        return;
      }

      try {
        const poses = await detector.estimatePoses(videoRef.current);
        
        // 30フレームに1回ログ出力（約1秒に1回）
        frameCount++;
        if (frameCount % 30 === 0) {
          console.log('📊 ポーズ検出:', {
            検出された人数: poses.length,
            isActive: isActiveRef.current,
            prevPoses: prevPoses ? 'あり' : 'なし'
          });
          
          if (poses.length > 0) {
            console.log('関節点数:', poses[0].keypoints.length);
          }
        }
        
        // 骨格を描画
        drawSkeleton(poses);
        
        // スコア計算（isActiveがtrueの時のみ）
        if (prevPoses && poses.length > 0 && isActiveRef.current) {
          const movementScore = calculateMovementScore(poses, prevPoses);
          
          if (frameCount % 30 === 0 && movementScore > 0) {
            console.log('💯 スコア加算:', movementScore.toFixed(2));
          }
          
          onScoreUpdateRef.current(prev => prev + movementScore * 0.005); // スケーリング（増加速度を調整）
        }
        
        prevPoses = poses;
      } catch (err) {
        console.error('ポーズ検出エラー:', err);
      }
      
      animationFrameId = requestAnimationFrame(detectPose);
    };

    const initializeTensorFlow = async () => {
      try {
        console.log('🤖 TensorFlow.jsを初期化中...');
        if (!isMountedRef.current) return;
        
        await tf.ready();
        console.log('✅ TensorFlow.js準備完了');
        if (!isMountedRef.current) return;
        
        console.log('🏃 MoveNetモデルを読み込み中...');
        // WebGLバックエンドを明示的に設定
        await tf.setBackend('webgl');
        await tf.ready();
        
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        };
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet, 
          detectorConfig
        );
        console.log('✅ TensorFlow.jsとMoveNetが初期化されました');
      } catch (err) {
        console.error('❌ TensorFlow.jsの初期化に失敗しました:', err);
        if (isMountedRef.current) {
          setError(`AIモデルの読み込みに失敗しました。${t('reloadPage')}`);
        }
      }
    };

    // 初期化
    const init = async () => {
      console.log('🚀 アプリケーション初期化開始');
      stream = await setupCamera();
      console.log('カメラセットアップ完了、stream:', stream ? 'あり' : 'なし');
      
      if (isMountedRef.current && stream) {
        await initializeTensorFlow();
        if (isMountedRef.current) {
          console.log('🎬 ポーズ検出を開始します');
          detectPose();
        }
      } else {
        console.log('⚠️ 初期化を中断します（マウント状態またはストリームの問題）');
      }
    };

    init();

    return () => {
      console.log('🧹 クリーンアップ開始');
      isMountedRef.current = false;
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        console.log('✅ アニメーションフレームをキャンセルしました');
      }
      
      // ビデオストリームを停止
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ ストリームを停止しました');
      }
      
      // videoRef経由でもストリームを停止（念のため）
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log('✅ ビデオソースをクリアしました');
      }
    };
  }, []); // 空の依存配列で初回マウント時のみ実行

  return (
    <>
      <div className="camera-container">
        <div className="video-wrapper">
          {error ? (
            // カメラエラー時の表示
            <div className="camera-off-overlay">
              <div className="camera-off-content">
                {/* カメラOFFアイコン */}
                <div className="camera-off-icon-static">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="50" fill="#e5e7eb" />
                    <rect x="25" y="45" width="50" height="35" rx="5" fill="#9ca3af" />
                    <path d="M75 52L95 42V78L75 68V52Z" fill="#9ca3af" />
                    {/* バツ印 */}
                    <line x1="20" y1="20" x2="100" y2="100" stroke="#6b7280" strokeWidth="8" strokeLinecap="round" />
                    <line x1="100" y1="20" x2="20" y2="100" stroke="#6b7280" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                </div>
                
                <h3 className="camera-off-title">{t('cameraOff')}</h3>
                <p className="camera-off-message">{t('cameraAccessRequired')}</p>
                
                <div className="privacy-notice">
                  <p className="privacy-title">{t('privacyProtectionTitle')}</p>
                  <p className="privacy-text">
                    {t('privacyProtectionText')}
                  </p>
                </div>
                
                <button 
                  className="camera-help-btn"
                  onClick={() => setShowModal(true)}
                >
                  {t('howToEnableCamera')}
                </button>
              </div>
            </div>
          ) : (
            // カメラ正常時の表示
            <>
              <video 
                ref={videoRef} 
                className="camera-video"
                autoPlay 
                playsInline 
                muted
              />
              <canvas 
                ref={canvasRef} 
                className="pose-canvas"
              />
            </>
          )}
        </div>
        
        <div className="camera-status focus-mode-target">
          {!isInitialized ? (
            <p>{t('initializingCamera')}</p>
          ) : !isActive ? (
            <>
              <p>{t('sessionStartPrompt')}</p>
              <div className="privacy-notice-camera-on">
                <p className="privacy-title">{t('privacyProtectionTitle')}</p>
                <p className="privacy-text">
                  {t('privacyProtectionText')}
                </p>
              </div>
            </>
          ) : (
            <p>{t('detectingMovement')}</p>
          )}
        </div>
      </div>

      {/* カメラ設定モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('howToEnableCameraTitle')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="privacy-notice-modal">
                <p className="privacy-title-modal">{t('privacyProtectionModalTitle')}</p>
                <p className="privacy-text-modal">
                  {t('privacyProtectionModalText')}
                </p>
              </div>
              
              <div className="error-instructions">
                <h4>{t('basicTroubleshooting')}</h4>
                <ol>
                  <li>{t('troubleshootingStep1')}</li>
                  <li>{t('troubleshootingStep2')}</li>
                  <li>{t('troubleshootingStep3')}</li>
                </ol>
                
                <div className="browser-help">
                  <p><strong>{t('stillNotWorking')}</strong></p>
                  <ul>
                    <li>{t('checkOtherApps')}</li>
                  </ul>
                </div>
              </div>
              
              <button 
                className="error-reload-btn"
                onClick={() => window.location.reload()}
              >
                {t('reloadButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
