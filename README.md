# Modern Face Detection App — Real-Time Training Tutorial

A working face detection and recognition web app using **WebRTC** + **face-api.js** (TensorFlow.js). This tutorial walks you through how real-time face training works — capturing face samples from a live camera feed and building a recognition database on the fly.

## Features

- Real-time face detection via webcam
- Real-time face training — capture samples directly from the camera
- Live face recognition against captured training data
- Two detection models: TinyFaceDetector (fast) and SSD MobileNetV1 (accurate)
- FPS counter and match confidence display
- No backend server required — all processing happens in the browser

## Quick Start

```bash
npx serve .
```

Then open the URL in a browser (Chrome/Firefox/Edge recommended). HTTPS or localhost required for camera access.

## How Real-Time Training Works

This app captures face training data live from the camera. Here's the full flow:

### Step 1: Start the Camera

Click **"Start Camera"**. The app requests webcam access via WebRTC `getUserMedia()`. Once active, you'll see the live video feed with a face detection overlay.

### Step 2: Enter a Name

Type the person's name into the **"Person Name"** field. This label will be attached to every face sample you capture for this person.

### Step 3: Capture Face Samples

Click **"Capture Face"** to take a snapshot of the current camera frame. The app will:

1. **Grab the current video frame** — draws the `<video>` element onto an offscreen `<canvas>`
2. **Detect a face** — runs face-api.js with SSD MobileNetV1 or TinyFaceDetector
3. **Extract landmarks** — identifies 68 facial landmarks (eyes, nose, mouth, jawline)
4. **Generate a face descriptor** — produces a 128-dimensional floating-point vector (embedding) that uniquely represents this face
5. **Store the descriptor** — groups it under the entered name
6. **Save a thumbnail** — stores a small JPEG of the captured frame for the gallery view

You need **at least 3 samples** per person. The counter shows your progress (`3 / 3 min`). More samples improve recognition accuracy.

### Step 4: Save the Person

Once you have 3+ samples, click **"Save Person"**. This locks in the person's data and clears the name field so you can train the next person.

### Step 5: Recognition

After saving one or more people, the live detection loop will automatically recognize them. When a face appears on camera:

1. The app extracts its 128-dim descriptor in real time
2. It computes **Euclidean distance** against every stored descriptor
3. The closest match below the **Match Threshold** (default 0.5) is displayed
4. Color coding: **green** (>80% confidence), **yellow** (50-80%), **cyan** (unknown)

### Step 6: Manage Training Data

- **Clear Database** — wipes all training data and starts fresh
- **Detection Model** — switch between TinyFaceDetector (fast) and SSD MobileNetV1 (accurate)
- **Match Threshold** — adjust how strict matching is (lower = stricter)

## Architecture

```
src/
  app.js          — Main app: UI, detection loop, drawing, capture flow
  camera.js       — WebRTC camera controller (start/stop)
  detection.js    — face-api.js wrapper (load models, detect, recognize)
  training.js     — Real-time capture, descriptor storage, gallery
index.html        — Single page with video, controls, gallery, log
styles.css        — Dark theme UI
```

### Training Data Flow

```
Camera Frame
  → Offscreen Canvas
    → face-api.js detectSingleFace
      → withFaceLandmarks
        → withFaceDescriptor (128-dim Float32Array)
          → Stored under label in labeledDescriptors
            → Compared via euclideanDistance() during live detection
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Face Descriptor** | A 128-dimensional vector that numerically represents a face. Similar faces produce similar vectors. |
| **Euclidean Distance** | The mathematical distance between two face descriptors. Lower = more similar. |
| **Match Threshold** | Maximum distance to consider a match. Default 0.5. Lower = stricter matching. |
| **SSD MobileNetV1** | Accurate face detection model (~5MB). Better for recognition. |
| **TinyFaceDetector** | Fast face detection model. Lower accuracy but higher FPS. |

## Technology Stack

- **WebRTC** — Browser camera access
- **face-api.js** (@vladmandic/face-api) — Face detection + recognition
- **TensorFlow.js** — ML runtime with WebGL backend
- **Canvas API** — Frame capture and overlay rendering
- **ES Modules** — Modern JavaScript architecture (no bundler required)

## Browser Support

- Chrome 70+
- Firefox 65+
- Edge 80+
- Safari 14.5+ (partial)
- Requires HTTPS or localhost

## Related

- **[facedetection-tutorial](https://github.com/jeanmachuca/facedetection-tutotial)** — Comprehensive tutorial ([live](https://jeanmachuca.github.io/facedetection-tutotial/))
- **[facerecognitioninbrowser](https://github.com/jeanmachuca/facerecognitioninbrowser)** — Original Flash project ([live](https://jeanmachuca.github.io/facerecognitioninbrowser/))

## License

MIT
