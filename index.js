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
const text ="sent the ball hard into the nets"
const musicFile = "input/musics/Tom_s Diner (Cover) - AnnenMayKantereit x Giant Rooks.mp3"


async function main() {
    const videoProcessor = new VideoProcessor(videoPath);
    await videoProcessor.processVideo();
    const imageProcessor = new ImageProcessor(inputFolder, outputFolder, overlayImagePath, greenThreshold, overlayWidth, overlayHeight,text, musicFile);

    await imageProcessor.main(); 
}

main().catch(err => {
    console.error('Bir hata oluştu:', err);
});
