const $ = document.querySelector.bind(document); // i made jquery :poggers:
const b = $('input[type="submit"]');
const section = $('canvas');
const ctx = section.getContext('2d');
const txt = $('textarea');
const previewDiv = $('div');
const prev = $('td#preview');
const inFile = $('input#file');
const progress = $('strong');

$('label[for="delay"]').style.display = $('input#delay').style.display = 'none';

inFile.onchange = () => {
    const file = inFile.files[0];
    $('em').innerHTML = file.name;
    $('label[for="delay"]').style.display = $('input#delay').style.display = file.name.endsWith('.gif') ? '' : 'none';
}

const rm = (tag) => {
    for (const el of document.querySelectorAll(tag)) el.parentNode.removeChild(el);
}

const toBlob = (d) => new Promise((res) => d.toBlob(res));

let fn;

$('form').onsubmit = async (e) => {
    e.preventDefault();
    const file = inFile.files[0];
    const size = +$('input#size').value;
    b.value = "Working...";
    rm('img'); rm('br'); // rm('canvas');
    
    txt.value = '';
    section.width = section.height = size;

    if (file.name.endsWith('.gif')) {
        try {
            var frames = await gifFrames({ 
                url: URL.createObjectURL(file), 
                frames: 'all',
                outputType: 'canvas' 
            });
        } catch (err) {
            $('em').innerHTML = err;
        }

        const delay = +$('input#delay').value;
        
        const img = frames[0].frameInfo;

        const w = Math.ceil(img.width / size);
        const h = Math.ceil(img.height / size);
        // console.log(img.width, img.height, w, h, size);

        const startTime = Date.now();
        const zip = new JSZip();
        let str = '';

        const previewSize = Math.min(prev.offsetWidth / w, prev.offsetHeight / h);

        const queue = [];

        for (let y = 0; y > -h; y--) {
            const q = []; 
            for (let x = 0; x > -w; x--) {
                progress.innerHTML = `Progress: ${-y * w - x}/${w * h}`;
                const gif = new GIF();
                for(const frame of frames) {
                    const image = frame.getImage();
                    ctx.drawImage(image, x * size, y * size);
                    // console.log(x, y, x * size, y * size);
                    gif.addFrame(section, { copy: true, delay });
                    ctx.clearRect(0, 0, size, size);
                }

                gif.render();

                await new Promise((res, _) => {
                    gif.on('finished', blob => {
                        zip.file(`${-x}_${-y}.gif`, blob);
                        const preview = document.createElement('img');
                        preview.src = URL.createObjectURL(blob);
                        preview.width = preview.height = previewSize;
                        q.push(preview);
                        str += `:${-x}_${-y}:`;
                        res();
                    })
                });
            }
            queue.push(q);
            str += '\r\n';
        }
        progress.innerHTML = `Progress: ${w * h}/${w * h}`;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                previewDiv.appendChild(queue[y][x]);
            }
            previewDiv.appendChild(document.createElement('br'));
        }
        // Lotta boilerplate lol

        txt.value = str;
        txt.rows = h + 1;

        zip.file('emojis.txt', str);
        const genZip = await zip.generateAsync({ type: 'blob' });

        $('p').innerHTML = `Time taken: ${Date.now() - startTime}ms`;
        b.value = 'Split';
        $('a').onclick = () => saveAs(genZip, 'emojis.zip');
        return;
    }


    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
        const startTime = Date.now();
        const zip = new JSZip();
        b.value = "Wait for it...";

        const w = Math.ceil(img.width / size);
        const h = Math.ceil(img.height / size);

        const previewSize = Math.min(prev.offsetWidth / w, prev.offsetHeight / h);

        console.log(w, h, size);

        let str = '';

        for (let y = 0; y > -h; y--) {
            for (let x = 0; x > -w; x--) {
                progress.innerHTML = `Progress: ${-y * w - x}/${w * h}`;
                ctx.drawImage(img, x * size, y * size);
                const blob = await toBlob(section);
                zip.file(`${-x}_${-y}.png`, blob);
                const preview = document.createElement('img');
                preview.src = URL.createObjectURL(blob);
                preview.width = preview.height = previewSize;
                previewDiv.appendChild(preview);
                ctx.clearRect(0, 0, size, size);
                str += `:${-x}_${-y}:`;
            }
            previewDiv.appendChild(document.createElement('br'));
            str += '\r\n';
        }

        progress.innerHTML = `Progress: ${w * h}/${w * h}`;
        txt.value = str;
        txt.rows = h + 1;

        zip.file('emojis.txt', str);
        const genZip = await zip.generateAsync({ type: 'blob' });

        $('p').innerHTML = `Time taken: ${Date.now() - startTime}ms`;
        b.value = 'Split';
        //$('a').href = 'data:application/zip;base64,' + b64;
        $('a').onclick = () => saveAs(genZip, 'emojis.zip');
    }
}