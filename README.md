# Video Processing Case Study

This project was created as a solution for a case study where the task was to overlay an image with text on a green area in a video and add background music.

## Features

- Detects the green area in the video and overlays an image.
- Adds custom text over the image.
- Adds background music to the video.

## Technologies Used

- **Node.js**: Backend processing.
- **FFmpeg**: Video processing (adding image, text, and background music).
- **Sharp**: Image manipulation and processing.

## Prerequisites

Before running this project, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [FFmpeg](https://ffmpeg.org/download.html)
- [Sharp](https://sharp.pixelplumbing.com/install)

## Installation

 Install the required dependencies:

```bash
# git clone
$ git clone https://github.com/isarat117/videoProcessing.git

# get direction
$ cd videoProcessing

# install dependecies
$ npm install

```

## Usage 
To process the video and overlay the image with text, follow these steps:

Ensure you have a video file named video.mp4 in the input folder.
Place the image you want to overlay in the input/images folder.
Add the background music file in the input/music folder.

```bash
# run the project
$ node index

```
