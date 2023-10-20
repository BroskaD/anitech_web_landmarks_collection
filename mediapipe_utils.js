import {FilesetResolver, PoseLandmarker, DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

//constants
const API_KEY = 'password';
const API_URl = 'http://localhost:5000/predict_score';
const SERVER_CONFIG = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
    }
};
const VISION_TASKS_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm';
const MODEL_ASSET_PATH = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

const POSE_LAND_MARKER_CONFIG = {
    baseOptions: {
        modelAssetPath: MODEL_ASSET_PATH
    },
    runningMode: "VIDEO",
    numPoses: 1
};
const DRAW_LAND_MARKS_STYLE = {
    color: '#FF0000',
    fillColor: '#FF0000',
    lineWidth: 2,
    radius: 2
};
const DRAW_CONNECTORS_STYLE = {
    color: '#00FF00',
    lineWidth: 2
}
const INITIAL_RECORDED_DATA = {
    frame_size: null,
    landmarks: []
};
//

let recording = false;
let recordedData = INITIAL_RECORDED_DATA;


async function createPoseLandmarker() {
    try {
        const vision = await FilesetResolver.forVisionTasks(VISION_TASKS_URL);
        return await PoseLandmarker.createFromOptions(vision, POSE_LAND_MARKER_CONFIG);
    } catch (error) {
        alert('Error creating PoseLandmarker');
        throw error;
    }
}

function predictWebCam(video, canvas, canvasCtx, poseLandmarker) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const drawingUtils = new DrawingUtils(canvasCtx);

    if (recordedData['frame_size'] === null) {
      recordedData['frame_size'] = [canvas.width, canvas.height]
    }

    let startTimeMs = performance.now();
    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        for (const landmark of result.landmarks) {
            drawingUtils.drawLandmarks(landmark, DRAW_LAND_MARKS_STYLE);
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, DRAW_CONNECTORS_STYLE);
        }

        canvasCtx.restore();
        
        if (result.landmarks[0] && recording) {
          recordData(result.landmarks[0]);
        }
    });

    window.requestAnimationFrame(() => predictWebCam(video, canvas, canvasCtx, poseLandmarker));

}

function startRecording() {
  recordedData = INITIAL_RECORDED_DATA;
  recording = true;
}

async function stopRecording() {
    try {
        const response = await fetch(API_URl, {
            method: SERVER_CONFIG.method,
            headers: SERVER_CONFIG.headers,
            body: JSON.stringify(recordedData),
        });

        const data = await response.json();
        document.getElementById('response').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        alert('Error while sending data to the server');
    } finally {
        recordedData = INITIAL_RECORDED_DATA;
        recording = false;
    }
}

function recordData(data) {
  recordedData['landmarks'].push(data);
}

export {createPoseLandmarker, predictWebCam, startRecording, stopRecording};