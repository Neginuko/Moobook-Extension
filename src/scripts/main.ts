import { HandLandmarker, FilesetResolver, HandLandmarkerResult, NormalizedLandmark, Landmark } from "@mediapipe/tasks-vision";

interface DetectionStatus {
    delta: number[],
    handPosition: number[],
    isGrabbed: boolean,
    time: number,
}

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

// Environment
const script: HTMLScriptElement = document.querySelector('[data-moobook-ext]')!;
const extensionId = script.getAttribute('data-runtime-id');
const wasmurl = `chrome-extension://${extensionId}/wasm` || "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
// Build mediapipe vision task
FilesetResolver.forVisionTasks(wasmurl)
    .then(
        (vision) => {
            // Load model for handLandmarker
            HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `chrome-extension://${extensionId}/hand_landmarker.task`,
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
            })
            .then(
                (handLandmarker) => {
                    // Main loop
                    const renderLoop = (lastDetectionStatus: DetectionStatus) => {
                        if (lastDetectionStatus.time !== video.currentTime && video.currentTime - (lastDetectionStatus.time ?? -1)) {
                            const detection = handLandmarker.detectForVideo(video, video.currentTime);
                            console.debug(detection);
                            let result = processResult(detection, lastDetectionStatus);

                            // update LastDetectionStatus
                            result.time = video.currentTime;

                            if (result.isGrabbed) console.debug("Grabbing!");
                            else console.debug("Not Grabbing...");

                            window.requestAnimationFrame(() => {
                                renderLoop(result)
                            });
                        } else {
                            window.requestAnimationFrame(() => {
                                renderLoop(lastDetectionStatus)
                            })
                        }
                    }

                    // Fire animations
                    renderLoop({
                        time: -1,
                        handPosition: [-1, -1],
                        isGrabbed: false,
                        delta: [0, 0],
                    });
            });
    });

const processResult = (detection: HandLandmarkerResult, lastDetectionStatus: DetectionStatus): DetectionStatus => {
    const result: DetectionStatus = lastDetectionStatus;

    if (detection.landmarks.length !== 0) {
        drawPreviewCanvas(detection.landmarks[0]);
        const currentPosition = position(detection.landmarks[0], video.width, video.height);
        const currentDelta = delta(currentPosition, lastDetectionStatus.handPosition);

        // Update to current status
        result.isGrabbed = isGrabbing(detection.worldLandmarks[0]);
        result.handPosition = currentPosition;
        result.delta = currentDelta;
        console.debug(result.delta[1]);
    } else {
        result.delta = [0, 0];
        result.handPosition = [-1, -1];
        result.isGrabbed = false;
    }

    // Handles
    if (lastDetectionStatus.isGrabbed && result.isGrabbed) {
        if (Math.abs(result.delta[1]) >= 5) {
            scrollPage(result.delta[1]);
        }
    }
    return result;
}

const drawPreviewCanvas = (landmarks: NormalizedLandmark[], markersize: number = 20, color: string = 'rgb(255, 0, 0)') => {
    const context = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;
    context.drawImage(video, 0, 0);
    for (let landmark of landmarks) {
        context.fillStyle = color;
        context.fillRect(Math.floor(width*landmark.x) - Math.floor(markersize / 2), Math.floor(height*landmark.y) - Math.floor(markersize / 2), markersize, markersize);
    }
}

const position = (landmarks: NormalizedLandmark[], width: number, height: number) : number[] => {
    return [Math.floor(landmarks[0].x * width), Math.floor(landmarks[0].y * height)];
}

const delta = (current: number[], last: number[]) : number[] => {
    if (last.every((e) => e === -1)) {
        return [0, 0];
    }
    return [current[0] - last[0], current[1] - last[1]];
}

const isGrabbing = (landmarks: Landmark[]): boolean => {
    if (Math.abs(landmarks[4].x - landmarks[8].x) < 0.02 && Math.abs(landmarks[4].y - landmarks[8].y) < 0.02 && Math.abs(landmarks[4].z - landmarks[8].z) < 0.05) {
        return true;
    }
    return false;
}

const scrollPage = (velocity: number) => {
    let currentYOffset = window.scrollY;
    window.scrollTo({
        top: currentYOffset + velocity,
        behavior: 'auto'
    });
    // requestAnimationFrame(() => {scrollPage(velocity)});
}

const easeOutCubic = (process: number): number => {
    return 1 - Math.pow(1 - process, 3);
}
