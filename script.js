import { createVideoElement, deleteVideoElements } from './video_utils.js';
import { toggleRecordingButtons } from './control_utils.js';
import { createPoseLandmarker, predictWebCam, predictVideoFile, startRecording, stopRecording, setSource } from './mediapipe_utils.js';

const canvas = document.getElementById('output_canvas');
const canvasCtx = canvas.getContext('2d');

const poseLandmarker = await createPoseLandmarker();

const enableFileVideoButton = document.getElementById('filevideoButton');
const enableCameraButton = document.getElementById('webcamVideoButton');
const fileInput = document.getElementById('fileInput');
const startRecordingButton = document.getElementById('startRecordingButton');
const stopRecordingButton = document.getElementById('stopRecordingButton');

let currentStream = null;

let video = undefined;

enableFileVideoButton.addEventListener('click', enableVideoFile);
enableCameraButton.addEventListener('click', enableWebCameraStream);
startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);

fileInput.addEventListener('change', (event) => {
  console.log('file input add event listener');
  stopCurrentStream();
  deleteVideoElements();
  const selectedFile = event.target.files[0];

  
  if (selectedFile) {
    toggleRecordingButtons('hidden');
    video = createVideoElement(`videos/${selectedFile.name}`);
    video.addEventListener('loadeddata', () => {predictVideoFile(video, canvas, canvasCtx, poseLandmarker)});
    video.addEventListener('loadeddata', () => {video.play()});
  }
});

function stopCurrentStream() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
}

async function enableVideoFile(event){ 
  fileInput.value = '';
  setSource('video');
  fileInput.click();
}

async function enableWebCameraStream(event){
  stopCurrentStream();
  deleteVideoElements();
  setSource('webcam');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video = createVideoElement(stream);
    toggleRecordingButtons('visible');
    video.addEventListener('loadeddata', () => {predictWebCam(video, canvas, canvasCtx, poseLandmarker)});
    video.addEventListener('loadeddata', () => {video.play()});
    currentStream = stream;
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}
