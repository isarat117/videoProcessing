const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const VideoProcessor = require('./exractFrames');
const ImageProcessor = require('./imageProccesor');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/output', express.static(path.join(__dirname, 'public', 'output')));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/process-video', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'music', maxCount: 1 }
]), async (req, res) => {
  console.log('İstek geldi!');
  console.log('İstek gövdesi:', req.body);
  console.log('Yüklenen dosyalar:', req.files);
  
  if (!req.files['video'] || !req.files['music']) {
    return res.status(400).json({ error: 'Video ve müzik dosyaları gereklidir.' });
  }

  const videoPath = req.files['video'][0].path;
  const musicPath = req.files['music'][0].path;
  const text = req.body.text;

  console.log('Dosya yolları:', { videoPath, musicPath, text });

  const inputFolder = './video_frames/';
  const outputFolder = './public/output/';
  const overlayImagePath = './input/images/paris-2024-olympics-soccer.jpg';
  const greenThreshold = 200;
  const overlayWidth = 1000;
  const overlayHeight = 1200;

  try {
    const videoProcessor = new VideoProcessor(videoPath);
    await videoProcessor.processVideo();
    
    const imageProcessor = new ImageProcessor(inputFolder, outputFolder, overlayImagePath, greenThreshold, overlayWidth, overlayHeight, text, musicPath);

    await imageProcessor.deleteOutputFolder();
    await imageProcessor.createOutputFolder();
    await imageProcessor.processImages();

    console.log("Görüntü işleme tamamlandı.");
    console.log("Video oluşturma işlemi başlatılıyor...");
    
    await new Promise((resolve, reject) => {
      imageProcessor.createVideo((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log("Video başarıyla oluşturuldu.");

    const finalOutputPath = path.resolve(__dirname, 'public', 'output', 'final_output_with_audio.mp4');
    
    if (fs.existsSync(finalOutputPath)) {
      const videoUrl = `/output/final_output_with_audio.mp4`;
      console.log('Video URL:', videoUrl);
      res.json({ success: true, videoUrl });
    } else {
      console.error('Video dosyası bulunamadı:', finalOutputPath);
      res.status(500).json({ error: 'İşlenmiş video dosyası bulunamadı.' });
    }

    fs.unlinkSync(videoPath);
    fs.unlinkSync(musicPath);

  } catch (error) {
    console.error('İşlem sırasında bir hata oluştu:', error);
    res.status(500).json({ error: 'Video işleme sırasında bir hata oluştu.', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
