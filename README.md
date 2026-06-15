# Modern Face Detection App Example

A working face detection and recognition web app using **WebRTC** + **face-api.js** (TensorFlow.js), including training data migrated from a legacy Flash-based project.

## Features

- Real-time face detection via webcam
- Face recognition against a pre-loaded training database
- Two detection models: TinyFaceDetector (fast) and SSD MobileNetV1 (accurate)
- Training data from the legacy `facerecognitioninbrowser` Flash project
- FPS counter and match confidence display
- No backend server required - all processing happens in the browser

## Live Demo

**[https://jeanmachuca.github.io/modern-face-detection-app-example/](https://jeanmachuca.github.io/modern-face-detection-app-example/)**

## Quick Start

```bash
npx serve .
# or any static file server
```

Then open the URL in a browser (Chrome/Firefox/Edge recommended).

## How It Works

1. **Camera Access**: Uses WebRTC `getUserMedia()` for webcam capture
2. **Face Detection**: face-api.js with TensorFlow.js running under WebGL
3. **Face Recognition**: Pre-loaded training images are processed to extract 128-dimensional face descriptors
4. **Matching**: Euclidean distance comparison against the training database

## Training Data

The `training-data/images/` directory contains 23 JPEG images from the original `facerecognitioninbrowser` Flash project:

| Person | Samples |
|--------|---------|
| AW | 3 |
| NG | 5 |
| OW | 13 |

Click "Train from Images" to process these into face descriptors (stored in memory during the session).

## Technology Stack

- **WebRTC** - Browser camera access
- **face-api.js** (@vladmandic/face-api) - Face detection + recognition
- **TensorFlow.js** - ML runtime with WebGL backend
- **Canvas API** - Frame capture and overlay rendering
- **ES Modules** - Modern JavaScript architecture

## Browser Support

- Chrome 70+
- Firefox 65+
- Edge 80+
- Safari 14.5+ (partial)
- Requires HTTPS or localhost

## Related

- **[facedetection-tutotial](https://github.com/jeanmachuca/facedetection-tutotial)** — Comprehensive tutorial ([live](https://jeanmachuca.github.io/facedetection-tutotial/))
- **[facerecognitioninbrowser](https://github.com/jeanmachuca/facerecognitioninbrowser)** — Original Flash project ([live](https://jeanmachuca.github.io/facerecognitioninbrowser/))

## License

MIT
