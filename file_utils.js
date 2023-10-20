function download(content, fileName, contentType) {
    var a = document.createElement("a");
    document.getElementsByClassName('load_file')[0].appendChild(a)
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

export {download};