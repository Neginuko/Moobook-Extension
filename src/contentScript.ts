import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

(async () => {
  const video = document.createElement('video');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: {
        min: 320,
      },
      height: {
        min: 180,
      },
    },
  });
  video.srcObject = stream;

  // Builds vision task
  FilesetResolver.forVisionTasks(chrome.runtime.getURL('wasm')).then(
    (vision) => {
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: chrome.runtime.getURL('hand_landmarker.task'),
        },
        runningMode: 'VIDEO',
      }).then((handLandmarker) => {
        console.log('Vision task is ready!');
      });
    }
  );
})();
