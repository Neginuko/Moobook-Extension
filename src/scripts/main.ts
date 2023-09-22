import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from "@mediapipe/tasks-vision";

// For debug Previewer
const canvas = document.createElement('canvas');
canvas.style.transform = 'scaleX(-1)';
canvas.style.display = 'none';
// video setup
const video = document.createElement('video');
video.autoplay = true;
video.width = 640;
video.height = 480
video.style.display = 'none';
navigator.mediaDevices.getUserMedia(
        {
            audio: false,
            video: {
                width: {
                    min: 640, ideal: 1280,
                },
                height: {
                    min: 480, ideal: 720,
                }
            },
        }
    )
    .then(
        (stream) => {
            video.width = stream.getTracks()[0].getSettings().width ?? video.width;
            video.height = stream.getTracks()[0].getSettings().height ?? video.height;
            canvas.width = stream.getTracks()[0].getSettings().width ?? video.width;
            canvas.height = stream.getTracks()[0].getSettings().height ?? video.height;
            video.srcObject = stream;
    });
document.body.appendChild(video);
document.body.appendChild(canvas);

const script: HTMLScriptElement = document.querySelector('[data-moobook-ext]')!;
const extensionId = script.getAttribute('data-runtime-id');
const wasmurl = `chrome-extension://${extensionId}/wasm` || "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
FilesetResolver.forVisionTasks(wasmurl)
    .then(
        (vision) => {
            HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `chrome-extension://${extensionId}/hand_landmarker.task`,
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
            })
            .then(
                (handLandmarker) => {
                    const renderLoop = (lastDetectionTime: number) => {
                        let temp = lastDetectionTime;
                        if(lastDetectionTime !== video.currentTime) {
                            const detection = handLandmarker.detectForVideo(video, video.currentTime);
                            processResult(detection);
                            temp = video.currentTime;
                        }

                        window.requestAnimationFrame(() => {
                            renderLoop(temp)
                        });
                    }
                    renderLoop(-1);
            });
    });

const processResult = (detection: HandLandmarkerResult) => {
    const context = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;
    context.drawImage(video, 0, 0);
    if(detection.landmarks[0]) {
        for (let landmark of detection.landmarks[0]) {
            context.fillStyle = 'rgb(255,0,0)'
            context.fillRect(Math.floor(width*landmark.x)-10, Math.floor(height*landmark.y)-10, 20, 20);
        }
    }
}
