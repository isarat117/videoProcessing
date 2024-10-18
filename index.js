const path = require('path');
const VideoProcessor = require('./exractFrames');
const ImageProcessor = require('./imageProccesor');

const videoPath = "./input/video.mp4"

const inputFolder = './video_frames/'; 
const outputFolder = './output/'; 
const overlayImagePath = './input/images/paris-2024-olympics-soccer.jpg'; 
const greenThreshold = 200; 
const overlayWidth = 1000; 
const overlayHeight = 1200; 
const text = "sent the ball hard into the nets"
const musicFile = "input/musics/Tom_s Diner (Cover) - AnnenMayKantereit x Giant Rooks.mp3"

async function main() {
    const başlangıçZamanı = Date.now();

    const videoProcessor = new VideoProcessor(videoPath);
    await videoProcessor.processVideo();
    
    const imageProcessor = new ImageProcessor(inputFolder, outputFolder, overlayImagePath, greenThreshold, overlayWidth, overlayHeight, text, musicFile);

    await imageProcessor.deleteOutputFolder();
    await imageProcessor.createOutputFolder();
    await imageProcessor.processImages();

    console.log("Görüntü işleme tamamlandı.");
    console.log("Video oluşturma işlemi başlatılıyor...");
    
    const videoOluşturmaPromise = new Promise((resolve, reject) => {
        imageProcessor.createVideo((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

    await videoOluşturmaPromise;
    console.log("Video başarıyla oluşturuldu.");

    const bitişZamanı = Date.now();
    const geçenSüre = (bitişZamanı - başlangıçZamanı) / 1000;
    console.log(`Toplam çalışma süresi: ${geçenSüre.toFixed(2)} saniye`);
}

main().catch(err => {
    console.error('Bir hata oluştu:', err);
});
