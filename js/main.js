const $ = document.querySelector.bind(document); // i made jquery :poggers:

document.addEventListener('DOMContentLoaded', init);

const VALID_EXTENSIONS = [
    '.gif',
    '.svg',
    '.jpg',
    '.jpeg',
    '.png',
    '.bmp',
    '.tiff',
    '.webp'
]

let txt, previewDiv, prev, shrinkCheck, shrinkCross, fileInfo;
let submit, fileInput, prefixInput, sizeInput, shrinkInput, delayLabel, delayInput, form, download;
let progress, timeTaken;

const section = document.createElement('canvas');
const ctx = section.getContext('2d');

function init () {
    txt = $('textarea');
    previewDiv = $('div');
    prev = $('td#preview');
    shrinkCheck = $('i.fa-check');
    shrinkCross = $('i.fa-times');
    fileInfo = $('em');

    form = $('form');
    prefixInput = $('input#prefix');
    shrinkInput = $('input#shrink');
    delayInput = $('input#delay');
    fileInput = $('input#file');
    sizeInput = $('input#size');
    submit = $('input#submit');
    delayLabel = $('label[for="delay"]');
    download = $('a');

    progress = $('strong');
    timeTaken = $('p');

    delayLabel.style.display = delayInput.style.display = 'none';

    form.addEventListener('submit', e => e.preventDefault());
    shrinkInput.addEventListener('click', toggleShrink);
    addEventListeners();
    toggleShrink();
}

const toBlob = (d) => new Promise((res) => d.toBlob(res));
const isValidFile = (file) => !!file && VALID_EXTENSIONS.some(ext => file.name.endsWith(ext));

function addEventListeners () {
    form.addEventListener('submit', splitImages);
    fileInput.addEventListener('change', handleFileChange);
}

function toggleShrink () {
    if (shrinkInput.checked) {
        shrinkCheck.style.display = '';
        shrinkCross.style.display = 'none';
    } else {
        shrinkCross.style.display = '';
        shrinkCheck.style.display = 'none';
    }
}

function handleFileChange () {
    file = fileInput.files[ 0 ] || file;
    if (!isValidFile(file)) return;
    fileInfo.innerText = file.name;
    delayLabel.style.display = delayInput.style.display = file.name.endsWith('.gif') ? '' : 'none';
}

function save () {
    saveAs(currentZip, 'emojis.zip');
}

function resize (img, w, h) {
    const resizerCanvas = document.createElement('canvas');
    const resizerCtx = resizerCanvas.getContext('2d');
    resizerCanvas.width = w;
    resizerCanvas.height = h;
    resizerCtx.drawImage(img, 0, 0, w, h);
    return resizerCanvas;
}

async function splitImages () {
    if (!isValidFile(file)) return;

    const size = +sizeInput.value;
    submit.value = "Working...";

    form.removeEventListener('submit', splitImages);
    fileInput.removeEventListener('change', handleFileChange);

    // Clear preview from previous image splitting
    for (const el of document.querySelectorAll('div.imageRow'))
        el.parentNode.removeChild(el);

    let str = '';
    let done = 0;
    let w, h, numTiles;
    const prefix = prefixInput.value || file.name.replace(/\.\w+$/, '');
    const zip = new JSZip();
    const startTime = Date.now();

    timeTaken.innerText = 'In progress...';
    submit.value = 'Wait for it...';
    progress.innerText = '';
    txt.value = '';
    section.width = section.height = size;

    if (file.name.endsWith('.gif')) {
        // Is the image a gif?

        try {
            // Create array of frames of the provided gif
            var frames = await gifFrames({
                url: URL.createObjectURL(file),
                frames: 'all',
                outputType: 'canvas'
            });
        } catch (err) {
            fileInfo.innerText = err;
            throw err;
        }

        const delay = +delayInput.value;

        const img = frames[ 0 ].frameInfo;
        w = Math.ceil(img.width / size);
        h = Math.ceil(img.height / size);
        numTiles = w * h;

        if (shrinkInput.checked && numTiles > 50) {
            const scale = 50 / (w * h);

            for (let i = 0; i < frames.length; i++) {
                const frameImage = frames[ i ].getImage();
                frames[ i ] = resize(frameImage, img.width * scale, img.height * scale);
            }

            const frameImage = frames[ 0 ];

            w = Math.ceil(img.width * scale / size);
            h = Math.ceil(img.height * scale / size);
            numTiles = w * h;
        }

        const previewSize = Math.min(prev.offsetWidth / w, prev.offsetHeight / h);

        const queue = [];
        ctx.fillStyle = '#36393F';

        for (let y = 0; y > -h; y--) {
            const q = [];

            for (let x = 0; x > -w; x--) {
                // Script path relative to index.html
                const gif = new GIF({
                    workerScript: 'js/gif.worker.js'
                });

                for (const image of frames) {
                    if (image instanceof HTMLElement) {
                        // document.body.appendChild(image);
                        // console.log(image)
                        ctx.drawImage(image, x * size, y * size);
                    } else {
                        ctx.drawImage(image.getImage(), x * size, y * size);
                    }

                    gif.addFrame(section, { copy: true, delay });

                    ctx.clearRect(0, 0, size, size);
                    ctx.fillRect(0, 0, size, size);
                }

                gif.render();

                await new Promise((res, rej) => {
                    gif.on('finished', blob => {
                        if (blob.size > 256000) {
                            txt.value += `WARNING: Image ${ prefix }_${ -x }_${ -y } is too large for a discord emoji (>256kb) at ${ blob.size / 1000 }kb.\n`;
                        }

                        if (numTiles > 50) {
                            zip.file(`section${ Math.floor(done / 50) }/${ prefix }_${ -x }_${ -y }.gif`, blob);
                        } else {
                            zip.file(`${ prefix }_${ -x }_${ -y }.gif`, blob);
                        }

                        const preview = document.createElement('img');
                        preview.src = URL.createObjectURL(blob);
                        preview.width = preview.height = previewSize;
                        q.push(preview);

                        str += `:${ prefix }_${ -x }_${ -y }:`;
                        res();
                    })
                });

                progress.innerText = `Progress: ${ ++done }/${ numTiles }`;
            }

            queue.push(q);
            str += '\r\n';
        }

        for (let y = 0; y < h; y++) {
            const row = document.createElement('div');
            row.classList.add('imageRow');
            row.style.height = `${ Math.floor(previewSize) + 0.8 * 2 }px`;

            for (let x = 0; x < w; x++) {
                row.appendChild(queue[ y ][ x ]);
            }

            previewDiv.appendChild(row);
        }
    } else {

        // If the image is not a gif
        let img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise((res, rej) => {
            img.addEventListener('load', async function () {

                w = Math.ceil(img.width / size);
                h = Math.ceil(img.height / size);
                numTiles = w * h;

                if (shrinkInput.checked && numTiles > 50) {
                    // Find a scale value such that w * h <= 50

                    const scale = 50 / (w * h);

                    img = resize(img, img.width * scale, img.height * scale);

                    w = Math.ceil(img.width / size);
                    h = Math.ceil(img.height / size);
                    numTiles = w * h;
                }

                // const c = document.createElement('canvas');
                // c.width = img.width;
                // c.height = img.height;
                // c.getContext('2d').drawImage(img, 0, 0);
                // document.body.appendChild(c);

                const previewSize = Math.min(prev.offsetWidth / w, prev.offsetHeight / h);

                for (let y = 0; y > -h; y--) {
                    const row = document.createElement('div');
                    row.classList.add('imageRow');
                    row.style.height = `${ Math.floor(previewSize) + 0.8 * 2 }px`;

                    for (let x = 0; x > -w; x--) {
                        ctx.drawImage(img, x * size, y * size);
                        const blob = await toBlob(section);

                        if (blob.size > 256000) {
                            txt.value += `WARNING: Image ${ prefix }_${ -x }_${ -y } is too large for a discord emoji (>256kb) at ${ blob.size / 1000 }kb.\n`;
                        }

                        if (numTiles > 50) {
                            zip.file(`section${ Math.floor(done / 50) }/${ prefix }_${ -x }_${ -y }.png`, blob);
                        } else {
                            zip.file(`${ prefix }_${ -x }_${ -y }.gif`, blob);
                        }

                        const preview = document.createElement('img');
                        preview.src = URL.createObjectURL(blob);
                        preview.width = preview.height = previewSize;
                        row.appendChild(preview);

                        ctx.clearRect(0, 0, size, size);
                        str += `:${ prefix }_${ -x }_${ -y }:`;
                        progress.innerText = `Progress: ${ ++done }/${ numTiles }`;
                    }

                    previewDiv.appendChild(row);
                    str += '\r\n';
                }

                res();
            });
        });
    }

    progress.innerText = `Progress: ${ numTiles }/${ numTiles }`;

    txt.value += str;

    zip.file('emojis.txt', str);
    currentZip = await zip.generateAsync({ type: 'blob' });

    timeTaken.innerText = `Time taken: ${ Date.now() - startTime }ms`;
    submit.value = 'Split';

    download.removeEventListener('click', save);
    download.addEventListener('click', save);

    addEventListeners();
}