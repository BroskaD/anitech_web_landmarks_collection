function createVideoElement(src) {
    const videoElement = document.createElement('video');
    videoElement.autoplay = false;
    videoElement.style.display = 'none';

    if (typeof src === 'string') {
      videoElement.src = src;
    } else if (src instanceof MediaStream) {
      videoElement.srcObject = src;
    }

    document.body.appendChild(videoElement);
    return videoElement;
};

function deleteVideoElements() {
    const elements = document.getElementsByTagName('video');
    if (elements.length > 0) {
        for (let elem of elements){
            elem.remove();
        }
    }
};


export {createVideoElement, deleteVideoElements};