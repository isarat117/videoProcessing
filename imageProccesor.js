const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exec } = require('child_process');

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
    }

    async deleteOutputFolder() {
        try {
            const files = await fs.promises.readdir(this.outputFolder);
            await Promise.all(files.map(file => {
                const filePath = path.join(this.outputFolder, file);
                return fs.promises.unlink(filePath);
            }));
            await fs.promises.rmdir(this.outputFolder);
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
        const overlayImage = sharp(this.overlayImagePath)
            .resize(this.overlayWidth, this.overlayHeight)
            .raw()
            .ensureAlpha();
        const overlayData = await overlayImage.toBuffer();

        return new Promise((resolve, reject) => {
            fs.readdir(this.inputFolder, (err, files) => {
                if (err) return reject(err);

                const imageFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
                let promises = imageFiles.map(file => {
                    const backgroundImagePath = path.join(this.inputFolder, file);
                    const outputImagePath = path.join(this.outputFolder, `output_frame_${file}`);
                    return this.processImage(backgroundImagePath, overlayData, outputImagePath);
                });

                Promise.all(promises)
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    async processImage(backgroundImagePath, overlayData, outputImagePath) {
        const overlayWidth = this.overlayWidth;
        const overlayHeight = this.overlayHeight;

        return sharp(backgroundImagePath)
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true })
            .then(async ({ data, info }) => {
                const { width, height } = info;

                const leftOffset = Math.floor((width - overlayWidth) / 2);
                const topOffset = Math.floor((height - overlayHeight) / 2);

                const canvas = sharp({
                    create: {
                        width: width,
                        height: height,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    }
                });

                const compositeImage = Buffer.alloc(width * height * 4);

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const index = (y * width + x) * 4;
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];

                        if (g > this.greenThreshold && r < this.greenThreshold && b < this.greenThreshold) {
                            const overlayX = x - leftOffset;
                            const overlayY = y - topOffset;

                            if (overlayX >= 0 && overlayX < overlayWidth && overlayY >= 0 && overlayY < overlayHeight) {
                                const overlayIndex = (overlayY * overlayWidth + overlayX) * 4;
                                compositeImage[index] = overlayData[overlayIndex];
                                compositeImage[index + 1] = overlayData[overlayIndex + 1];
                                compositeImage[index + 2] = overlayData[overlayIndex + 2];
                                compositeImage[index + 3] = overlayData[overlayIndex + 3];
                            } else {
                                compositeImage[index] = r;
                                compositeImage[index + 1] = g;
                                compositeImage[index + 2] = b;
                                compositeImage[index + 3] = 255; 
                            }
                        } else {
                            compositeImage[index] = r;
                            compositeImage[index + 1] = g;
                            compositeImage[index + 2] = b;
                            compositeImage[index + 3] = 255;
                        }
                    }
                }

                return sharp(compositeImage, { raw: { width, height, channels: 4 } }).toFile(outputImagePath);
            })
            .then(() => {
                console.log(`Resim başarıyla oluşturuldu: ${outputImagePath}`);
            })
            .catch(err => {
                console.error(`Bir hata oluştu: ${err.message}`);
            });
    }

    wrapText(text, maxLineLength) {
        console.log(text)
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
    
    

    createVideo() {
        const {text, lineCount} = this.wrapText(this.text, 45);
    
        let boxHeight = lineCount * 60;
        const command = `ffmpeg -framerate 30 -pattern_type glob -i '${this.outputFolder}/*.png' -vf "
                drawbox=x=0:y=30:w=iw-0:h=${boxHeight}:color=black@0.5:t=fill,
                drawtext=text='${text}':fontcolor=white:fontsize=45:fontfile='/Library/Fonts/Arial.ttf':bordercolor=black:borderw=2:x=(w-text_w)/2:y=40:line_spacing=10
            " -c:v libx264 -pix_fmt yuv420p ${this.outputFolder}/111output_video.mp4 && 
        ffmpeg -i ${this.outputFolder}/111output_video.mp4 -i "${this.musicFile}" -c:v copy -c:a aac -strict experimental -shortest ${this.outputFolder}/final_output_with_audio.mp4`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            console.log('Video created with audio successfully!');
        });
        
        const ffmpegProcess = exec(command);
    
        ffmpegProcess.stdout.on('data', (data) => {
            console.log(data);
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
            this.createVideo();
        } catch (error) {
            console.error('Bir hata oluştu:', error);
        } finally {
            const endTime = Date.now(); 
            const elapsedTime = (endTime - startTime) / 1000;
            console.log(`Toplam çalışma süresi: ${elapsedTime.toFixed(2)} saniye`);
        }
    }
}


module.exports = ImageProcessor;