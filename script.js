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

const VIDEO = document.getElementById('input_stream');
const ERROR_BLOCK = document.getElementById("error-message-block");
const START_RECORDING_BUTTON = document.getElementById("startRecordingButton");
const START_RECORDING_BUTTON_HEIGHT = START_RECORDING_BUTTON.offsetHeight;
const STOP_RECORDING_BUTTON = document.getElementById("stopRecordingButton");
const CANVAS = document.getElementById('output_canvas');
const CANVAS_CTX = CANVAS.getContext('2d');
//

const DRAWING_UTILS = new DrawingUtils(CANVAS_CTX);
const POSE_LANDMARKER = await createPoseLandmarker();

let recording = false;
let recordedData = INITIAL_RECORDED_DATA;

STOP_RECORDING_BUTTON.disabled = !recording;
START_RECORDING_BUTTON.disabled = !recording;

START_RECORDING_BUTTON.addEventListener('click', startRecording);
STOP_RECORDING_BUTTON.addEventListener('click', stopRecording);

async function createPoseLandmarker() {
  try {
      const vision = await FilesetResolver.forVisionTasks(VISION_TASKS_URL);
      return await PoseLandmarker.createFromOptions(vision, POSE_LAND_MARKER_CONFIG);
  } catch (error) {
      ERROR_BLOCK.textContent ='Error creating PoseLandmarker';
      throw error;
  }
}

function predictWebCam(video, canvas, canvasCtx, poseLandmarker) {
  if (window.innerWidth > window.innerHeight) {
      canvas.width = video.videoWidth * ((window.innerHeight - START_RECORDING_BUTTON_HEIGHT) * 0.9 / video.videoHeight);
      canvas.height = (window.innerHeight - START_RECORDING_BUTTON_HEIGHT) * 0.9;
  } else {
      canvas.width = window.innerWidth * 0.9;
      canvas.height = video.videoHeight * (window.innerWidth * 0.9 / video.videoWidth) - START_RECORDING_BUTTON_HEIGHT;
  }

  if (recordedData['frame_size'] === null) {
    recordedData['frame_size'] = [canvas.width, canvas.height]
  }

  let startTimeMs = performance.now();
  poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      for (const landmark of result.landmarks) {
          DRAWING_UTILS.drawLandmarks(landmark, DRAW_LAND_MARKS_STYLE);
          DRAWING_UTILS.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, DRAW_CONNECTORS_STYLE);
      }

      canvasCtx.restore();
      
      if (result.landmarks[0] && recording) {
        recordData(result.landmarks[0]);
      }
  });

  START_RECORDING_BUTTON.disabled = recording;
  window.requestAnimationFrame(() => predictWebCam(video, canvas, canvasCtx, poseLandmarker));

}

function startRecording() {
recordedData = INITIAL_RECORDED_DATA;
recording = true;
START_RECORDING_BUTTON.disabled = recording;
STOP_RECORDING_BUTTON.disabled = !recording;
}

async function stopRecording() {
  let data = null;  
  try {
      const response = await fetch(API_URl, {
          method: SERVER_CONFIG.method,
          headers: SERVER_CONFIG.headers,
          body: JSON.stringify(recordedData),
      });

      data = await response.json();
    
  } catch (error) {
      data = {'message': 'Error while sending data to the server'}
  } finally {
      recordedData = INITIAL_RECORDED_DATA;
      recording = false;
      START_RECORDING_BUTTON.disabled = recording;
      STOP_RECORDING_BUTTON.disabled = !recording;
  }

  if (window.top != window.self) {
    window.top.postMessage('iframe.close', '*');
    window.top.postMessage(data, '*');
  } else {
    document.getElementById('response').textContent = JSON.stringify(data, null, 2);
  }

}

function recordData(data) {
    recordedData['landmarks'].push(data);
}

async function enableWebCameraStream(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    VIDEO.srcObject = stream;
    VIDEO.setAttribute('playsinline', '');
    VIDEO.setAttribute('muted', '');
    VIDEO.setAttribute('autoplay', '');
    VIDEO.addEventListener('loadeddata', () => {predictWebCam(VIDEO, CANVAS, CANVAS_CTX, POSE_LANDMARKER)});
    VIDEO.addEventListener('loadeddata', () => {VIDEO.play()});
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

enableWebCameraStream();
