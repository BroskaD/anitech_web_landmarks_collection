import {FilesetResolver, PoseLandmarker, DrawingUtils} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
import {download} from './file_utils.js';

const apiKey = 'password';
let recording = false;
let recordedData = {
  'frame_size': null,
  'landmarks': []
};


async function createPoseLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`
      },
      runningMode: "VIDEO",
      numPoses: 1
    });
    return poseLandmarker;
  };

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
            drawingUtils.drawLandmarks(landmark, {color: '#FF0000', fillColor: '#FF0000', lineWidth: 2, radius: 2});
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        }

        canvasCtx.restore();
        
        if (result.landmarks[0] && recording) {
          recordData(result.landmarks[0]);
        }
    });

    window.requestAnimationFrame(() => predictWebCam(video, canvas, canvasCtx, poseLandmarker));

    }

function startRecording() {
  recordedData = {
    'frame_size': null,
    'landmarks': []
  };
  recording = true;
}

function stopRecording() {
  // Uncomment to save local landmarks.json file
  // download(JSON.stringify(recordedData), 'landmarks.json', 'application/json');
  fetch('http://localhost:5000/predict_score', {
    method: 'POST',
    mode: 'cors',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `${apiKey}`
      },
    body: JSON.stringify(recordedData)
    })
    .then(response => response.json())
    .then(data => {
        
        console.log(data);
        document.getElementById('response').textContent = JSON.stringify(data, null, 2);
    });
  recordedData = {
    'frame_size': null,
    'landmarks': []
  };
  recording = false;
}

function recordData(data) {
  recordedData['landmarks'].push(data);
}

export {createPoseLandmarker, predictWebCam, startRecording, stopRecording};