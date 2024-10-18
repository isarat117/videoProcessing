const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class ImageProcessor {
    constructor(inputFolder, outputFolder, overlayImagePath, greenThreshold, overlayWidth, overlayHeight, text, musicFile) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.overlayImagePath = overlayImagePath;
        this.greenThreshold = greenThreshold;
        this.overlayWidth = overlayWidth;
        this.overlayHeight = overlayHeight;
        this.text = text
        this.musicFile = musicFile
        this.numCPUs = os.cpus().length;
    }

    async deleteOutputFolder() {
        try {
            await fs.promises.rm(this.outputFolder, { recursive: true, force: true });
            console.log(`Klasör başarıyla silindi: ${this.outputFolder}`);
        } catch (err) {
            console.error(`Klasör silinirken hata oluştu: ${err.message}`);
        }
    }

    async createOutputFolder() {
        try {
            await fs.promises.mkdir(this.outputFolder, { recursive: true });
            console.log(`Klasör başarıyla oluşturuldu: ${this.outputFolder}`);
        } catch (err) {
            console.error(`Klasör oluşturulurken hata oluştu: ${err.message}`);
        }
    }

    async processImages() {
        const overlayImage = await sharp(this.overlayImagePath)
            .resize(this.overlayWidth, this.overlayHeight)
            .raw()
            .ensureAlpha()
            .toBuffer();

        const files = await fs.promises.readdir(this.inputFolder);
        const imageFiles = files.filter(file => ['.png', '.jpg', '.jpeg'].includes(path.extname(file).toLowerCase()));

        const chunkSize = Math.ceil(imageFiles.length / this.numCPUs);
        const chunks = [];

        for (let i = 0; i < imageFiles.length; i += chunkSize) {
            chunks.push(imageFiles.slice(i, i + chunkSize));
        }

        const workers = chunks.map((chunk, index) => {
            return new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: {
                        chunk,
                        overlayData: overlayImage,
                        inputFolder: this.inputFolder,
                        outputFolder: this.outputFolder,
                        overlayWidth: this.overlayWidth,
                        overlayHeight: this.overlayHeight,
                        greenThreshold: this.greenThreshold
                    }
                });

                worker.on('message', resolve);
                worker.on('error', reject);
                worker.on('exit', (code) => {
                    if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                });
            });
        });

        await Promise.all(workers);
    }

    wrapText(text, maxLineLength) {
        const words = text.split(" ");
        let wrappedLines = "";
        let currentLine = "";
        let lineCount = 1;
    
        for (let word of words) {
            if (currentLine.length + word.length + 1 <= maxLineLength) {
                currentLine += (currentLine.length ? " " : "") + word;
            } else {
                wrappedLines += currentLine + "\n";
                lineCount++;
                currentLine = word; 
            }
        }
        wrappedLines += currentLine; 
        return { text: wrappedLines.trim(), lineCount };
    }

    createVideo(callback) {
        const {text, lineCount} = this.wrapText(this.text, 45);
    
        let boxHeight = lineCount * 60;
        const command = `ffmpeg -framerate 30 -pattern_type glob -i '${this.outputFolder}/*.jpg' -vf "
                drawbox=x=0:y=30:w=iw-0:h=${boxHeight}:color=black@0.5:t=fill,
                drawtext=text='${text}':fontcolor=white:fontsize=45:fontfile='/Library/Fonts/Arial.ttf':bordercolor=black:borderw=2:x=(w-text_w)/2:y=40:line_spacing=10
            " -c:v libx264 -preset ultrafast -pix_fmt yuv420p ${this.outputFolder}/111output_video.mp4 && 
        ffmpeg -i ${this.outputFolder}/111output_video.mp4 -i "${this.musicFile}" -c:v copy -c:a aac -strict experimental -shortest ${this.outputFolder}/final_output_with_audio.mp4`;
        
        const ffmpegProcess = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Hata: ${error.message}`);
                callback(error);
                return;
            }
            console.log('Video başarıyla oluşturuldu ve ses eklendi!');
            callback(null);
        });
    
        ffmpegProcess.stderr.on('data', (data) => {
            console.error(data);
        });
    
        ffmpegProcess.on('close', (code) => {
            console.log(`Video oluşturma işlemi ${code} kodu ile tamamlandı.`);
        });
    }
    
    async main() {
        const startTime = Date.now(); 
        try {
            await this.deleteOutputFolder();
            await this.createOutputFolder();
            await this.processImages();
            await new Promise((resolve, reject) => {
                this.createVideo((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error('Bir hata oluştu:', error);
        } finally {
            const endTime = Date.now(); 
            const elapsedTime = (endTime - startTime) / 1000;
            console.log(`Toplam çalışma süresi: ${elapsedTime.toFixed(2)} saniye`);
        }
    }
}

if (!isMainThread) {
    const { chunk, overlayData, inputFolder, outputFolder, overlayWidth, overlayHeight, greenThreshold } = workerData;

    const processImage = async (file) => {
        const backgroundImagePath = path.join(inputFolder, file);
        const outputImagePath = path.join(outputFolder, `output_frame_${path.parse(file).name}.jpg`);

        const { data, info } = await sharp(backgroundImagePath)
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true });

        const { width, height } = info;
        const leftOffset = Math.floor((width - overlayWidth) / 2);
        const topOffset = Math.floor((height - overlayHeight) / 2);

        const compositeImage = Buffer.alloc(width * height * 4);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                if (g > greenThreshold && r < greenThreshold && b < greenThreshold) {
                    const overlayX = x - leftOffset;
                    const overlayY = y - topOffset;

                    if (overlayX >= 0 && overlayX < overlayWidth && overlayY >= 0 && overlayY < overlayHeight) {
                        const overlayIndex = (overlayY * overlayWidth + overlayX) * 4;
                        compositeImage.set(overlayData.subarray(overlayIndex, overlayIndex + 4), index);
                    } else {
                        compositeImage.set([r, g, b, 255], index);
                    }
                } else {
                    compositeImage.set([r, g, b, 255], index);
                }
            }
        }

        await sharp(compositeImage, { raw: { width, height, channels: 4 } })
            .jpeg({ quality: 80 })
            .toFile(outputImagePath);
    };

    Promise.all(chunk.map(processImage))
        .then(() => parentPort.postMessage('done'))
        .catch((err) => console.error(`Bir hata oluştu: ${err.message}`));
}

module.exports = ImageProcessor;