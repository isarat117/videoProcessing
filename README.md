# Video İşleme Uygulaması

Bu proje, kullanıcıların video yükleyip üzerine metin ekleyebileceği ve arka plan müziği ekleyebileceği bir web uygulamasıdır.

## Özellikler

- Video yükleme
- Müzik dosyası yükleme
- Özel metin ekleme
- Video işleme (metin ekleme ve arka plan müziği ekleme)
- İşlenmiş videoyu oynatma

## Kullanılan Teknolojiler

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Video İşleme**: FFmpeg
- **Görüntü İşleme**: Sharp

## Gereksinimler

Bu projeyi çalıştırmadan önce aşağıdakilerin yüklü olduğundan emin olun:

- [Node.js](https://nodejs.org/)
- [FFmpeg](https://ffmpeg.org/download.html)

## Kurulum

1. Projeyi klonlayın:
   ```
   git clone https://github.com/isarat117/videoProcessing.git
   ```

2. Proje dizinine gidin:
   ```
   cd videoProcessing
   ```

3. Gerekli bağımlılıkları yükleyin:
   ```
   npm install
   ```

## Kullanım

1. Sunucuyu başlatın:
   ```
   node server.js
   ```

2. Tarayıcınızda `http://localhost:3000` adresine gidin.

3. Açılan web sayfasında, video dosyası ve müzik dosyası yükleyin, ardından metin girin.

4. "İşlemi Başlat" butonuna tıklayın ve işlemin tamamlanmasını bekleyin.

5. İşlem tamamlandığında, işlenmiş video otomatik olarak sayfada görüntülenecektir.

## Proje Yapısı

- `server.js`: Ana sunucu dosyası
- `exractFrames.js`: Video karelerini çıkaran modül
- `imageProccesor.js`: Görüntü işleme modülü
- `index.html`: Web arayüzü
- `public/`: Statik dosyalar ve işlenmiş videolar için klasör

## Katkıda Bulunma

1. Bu repo'yu fork edin
2. Yeni bir branch oluşturun (`git checkout -b new-feature`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: XYZ'`)
4. Dalınıza push yapın (`git push origin new-feature`)
5. Bir Pull Request oluşturun
