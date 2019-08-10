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

let section, ctx;
let txt, previewDiv, prev;
let submit, fileInput, prefixInput, sizeInput, delayLabel, delayInput, form;
let progress, timeTaken;

function init () {
    section = $('canvas');
    ctx = section.getContext('2d');

    txt = $('textarea');
    previewDiv = $('div');
    prev = $('td#preview');

    form = $('form');
    submit = $('input#submit');
    fileInput = $('input#file');
    prefixInput = $('input#prefix');
    sizeInput = $('input#size');
    delayLabel = $('label[for="delay"]');
    delayInput = $('input#delay');

    progress = $('strong');
    timeTaken = $('p');

    delayLabel.style.display = delayInput.style.display = 'none';

    form.addEventListener('submit', e => e.preventDefault());
    addEventListeners();
}

const toBlob = (d) => new Promise((res) => d.toBlob(res));
const isValidFile = (file) => !!file && VALID_EXTENSIONS.some(ext => file.name.endsWith(ext));

function addEventListeners () {
    form.addEventListener('submit', splitImages);
    fileInput.addEventListener('change', handleFileChange);
}

function handleFileChange () {
    file = fileInput.files[ 0 ] || file;
    if (!isValidFile(file)) return;
    $('em').innerText = file.name;
    delayLabel.style.display = delayInput.style.display = file.name.endsWith('.gif') ? '' : 'none';
}

function save () {
    saveAs(currentZip, 'emojis.zip');
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

    timeTaken.innerText = 'In progress...';

    txt.value = '';
    section.width = section.height = size;

    const prefix = prefixInput.value || file.name.replace(/\.\w+$/, '');

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
            $('em').innerText = err;
            throw err;
        }

        const delay = +$('input#delay').value;

        const img = frames[ 0 ].frameInfo;

        const w = Math.ceil(img.width / size);
        const h = Math.ceil(img.height / size);

        const startTime = Date.now();
        const zip = new JSZip();
        let str = '';

        const previewSize = Math.min(prev.offsetWidth / w, prev.offsetHeight / h);

        let done = 0;

        const queue = [];
        ctx.fillStyle = '#36393F';
        for (let y = 0; y > -h; y--) {
            const q = [];
            for (let x = 0; x > -w; x--) {
                ++done;
                progress.innerText = `Progress: ${ done }/${ w * h }`;

                // Script path relative to index.html
                const gif = new GIF({
                    workerScript: 'js/gif.worker.js'
                });

                for (const frame of frames) {
                    const image = frame.getImage();
                    ctx.drawImage(image, x * size, y * size);
                    // console.log(x, y, x * size, y * size);
                    gif.addFrame(section, { copy: true, delay });
                    ctx.clearRect(0, 0, size, size);
                    ctx.fillRect(0, 0, size, size);
                }

                gif.render();

                await new Promise((res, _) => {
                    gif.on('finished', blob => {
                        if (w * h > 50) {
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
            }
            queue.push(q);
            str += '\r\n';
        }
        progress.innerText = `Progress: ${ w * h }/${ w * h }`;

        for (let y = 0; y < h; y++) {
            const row = document.createElement('div');
            row.classList.add('imageRow');
            row.style.height = `${ Math.floor(previewSize) + 0.8 * 2 }px`;
            for (let x = 0; x < w; x++) {
                row.appendChild(queue[ y ][ x ]);
            }
            previewDiv.appendChild(row);
        }
        // Lotta boilerplate lol

        txt.value = str;
        txt.rows = h + 1;

        zip.file('emojis.txt', str);
        currentZip = await zip.generateAsync({ type: 'blob' });

        timeTaken.innerText = `Time taken: ${ Date.now() - startTime }ms`;
        submit.value = 'Split';
        $('a').removeEventListener('click', save);
        $('a').addEventListener('click', save);

        addEventListeners();
    } else {

        // If the image is not a gif
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.addEventListener('load', async function () {
            const startTime = Date.now();
            const zip = new JSZip();
            submit.value = 'Wait for it...';

            const w = Math.ceil(img.width / size);
            const h = Math.ceil(img.height / size);

            const previewSize = Math.min(prev.offsetWidth / w, prev.offsetHeight / h);

            let str = '';
            let done = 0;

            for (let y = 0; y > -h; y--) {
                const row = document.createElement('div');
                row.classList.add('imageRow');
                row.style.height = `${ Math.floor(previewSize) + 0.8 * 2 }px`;
                for (let x = 0; x > -w; x--) {
                    ++done;
                    progress.innerText = `Progress: ${ done }/${ w * h }`;
                    ctx.drawImage(img, x * size, y * size);
                    const blob = await toBlob(section);
                    if (w * h > 50) {
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
                }
                previewDiv.appendChild(row);
                str += '\r\n';
            }

            progress.innerText = `Progress: ${ w * h }/${ w * h }`;
            txt.value = str;
            txt.rows = h + 1;

            zip.file('emojis.txt', str);
            currentZip = await zip.generateAsync({ type: 'blob' });

            timeTaken.innerText = `Time taken: ${ Date.now() - startTime }ms`;
            submit.value = 'Split';

            $('a').removeEventListener('click', save);
            $('a').addEventListener('click', save);

            addEventListeners();
        });
    }

    // form.addEventListener('submit', splitImages);
    // fileInput.addEventListener('change', handleFileChange);
}