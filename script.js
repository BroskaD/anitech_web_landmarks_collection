import { createPoseLandmarker, predictWebCam, startRecording, stopRecording } from './mediapipe_utils.js';

const canvas = document.getElementById('output_canvas');
const canvasCtx = canvas.getContext('2d');

const poseLandmarker = await createPoseLandmarker();

const startRecordingButton = document.getElementById('startRecordingButton');
const stopRecordingButton = document.getElementById('stopRecordingButton');

let video = document.getElementById('input_stream');

startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);

async function enableWebCameraStream(){

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.addEventListener('loadeddata', () => {predictWebCam(video, canvas, canvasCtx, poseLandmarker)});
    video.addEventListener('loadeddata', () => {video.play()});
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

enableWebCameraStream();
