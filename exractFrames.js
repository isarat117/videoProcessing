const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class VideoProcessor {
  constructor(videoPath) {
    this.videoPath = videoPath;
    this.outputFolder = path.join(__dirname, 'video_frames');
    
    if (!fs.existsSync(this.outputFolder)) {
      fs.mkdirSync(this.outputFolder, { recursive: true });
      console.log(`Klasör başarıyla oluşturuldu: ${this.outputFolder}`);
    }
    
  }

  getFrameCount() {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(this.videoPath, (err, metadata) => {
        if (err) return reject(err);

        const frameCount = metadata.streams[0].nb_frames;

        if (frameCount) {
          resolve(parseInt(frameCount));
        } else {
          const duration = metadata.streams[0].duration;
          const fps = eval(metadata.streams[0].r_frame_rate); 
          resolve(Math.floor(fps * duration));
        }
      });
    });
  }

  extractFrames() {
    return new Promise((resolve, reject) => {
      ffmpeg(this.videoPath)
        .on('end', () => {
          console.log('Kareler başarıyla kaydedildi.');
          resolve();
        })
        .on('error', (err) => {
          console.error('Bir hata oluştu: ' + err.message);
          reject(err);
        })
        .save(`${this.outputFolder}/frame_%04d.png`);
    });
  }

  async framesExist() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.outputFolder, (err, files) => {
        if (err) return reject(err);

        const hasFrames = files.some(file => file.endsWith('.png'));
        resolve(hasFrames);
      });
    });
  }

  async processVideo() {
    try {
      const framesAlreadyExist = await this.framesExist();

      if (framesAlreadyExist) {
        console.log('Video kareleri zaten mevcut. İşlem yapılmadı.');
        return;
      }

      const frameCount = await this.getFrameCount();
      console.log(`Video ${frameCount} kareye sahip.`);

      await this.extractFrames();
      console.log('Tüm işlemler tamamlandı.');
    } catch (err) {
      console.error('Bir hata oluştu:', err);
    }
  }
}

module.exports = VideoProcessor;