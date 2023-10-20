function toggleRecordingButtons(flag) {
    const startRecordingButton = document.getElementById('startRecordingButton');
    startRecordingButton.style.visibility = flag;

    const stopRecordingButton = document.getElementById('stopRecordingButton');
    stopRecordingButton.style.visibility = flag;
    
}

export {toggleRecordingButtons};