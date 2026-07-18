import { CameraController } from './camera.js';
import { FaceDetector } from './detection.js';
import { TrainingManager } from './training.js';

class App {
    constructor() {
        this.video = document.getElementById('video');
        this.overlay = document.getElementById('overlay');
        this.ctx = this.overlay.getContext('2d');
        this.logContainer = document.getElementById('log');
        this.gallery = document.getElementById('image-gallery');

        this.camera = new CameraController(this.video);
        this.detector = new FaceDetector();
        this.training = new TrainingManager(this.detector);

        this.detectionInterval = null;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.isProcessing = false;
        this._threshold = 0.5;

        this.bindUI();
        this.init();
    }

    get threshold() {
        return this._threshold;
    }

    set threshold(v) {
        this._threshold = v;
        document.getElementById('threshold-value').textContent = v.toFixed(2);
    }

    bindUI() {
        document.getElementById('btn-camera').addEventListener('click', () => this.toggleCamera());
        document.getElementById('btn-capture').addEventListener('click', () => this.captureSample());
        document.getElementById('btn-save-person').addEventListener('click', () => this.savePerson());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearDatabase());

        document.getElementById('input-name').addEventListener('input', () => this.updateCaptureUI());
        document.getElementById('model-select').addEventListener('change', (e) => {
            this.log('Switching model to ' + e.target.value, 'warn');
            this.loadModels(e.target.value);
        });
        document.getElementById('threshold').addEventListener('input', (e) => {
            this.threshold = parseFloat(e.target.value);
        });
    }

    async init() {
        this.log('Initializing app...', 'info');
        await this.loadModels();
        this.renderGallery();
    }

    async loadModels(modelType) {
        this.setModelStatus('Loading models...');

        try {
            await this.detector.loadModels(modelType || 'ssdMobilenetv1');
            this.setModelStatus('Models loaded');
            this.log('Models loaded: ' + (modelType || 'ssdMobilenetv1'), 'success');
            document.getElementById('btn-camera').disabled = false;
        } catch (error) {
            this.setModelStatus('Failed to load models');
            this.log('Model load error: ' + error.message, 'error');
        }
    }

    async toggleCamera() {
        const btn = document.getElementById('btn-camera');

        if (this.camera.active) {
            this.stopDetection();
            this.camera.stop();
            btn.textContent = 'Start Camera';
            this.setCameraStatus('off');
            this.log('Camera stopped', 'info');
            this.updateCaptureUI();
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Starting...';

        try {
            await this.camera.start();
            btn.textContent = 'Stop Camera';
            this.setCameraStatus('on');
            this.log('Camera started', 'success');
            this.updateCaptureUI();
            this.startDetection();
        } catch (error) {
            btn.textContent = 'Start Camera';
            this.log(error.message, 'error');
        }

        btn.disabled = false;
    }

    updateCaptureUI() {
        const cameraOn = this.camera.active;
        const name = document.getElementById('input-name').value.trim();
        const count = this.training.getCurrentCount(name);
        const canCapture = cameraOn && name.length > 0;

        document.getElementById('btn-capture').disabled = !canCapture;

        const countEl = document.getElementById('capture-count');
        if (name.length > 0) {
            countEl.textContent = `${count} / 3 min`;
            countEl.style.color = count >= 3 ? '#4ade80' : '#fbbf24';
        } else {
            countEl.textContent = '';
        }

        document.getElementById('btn-save-person').disabled = !(count >= 3);
        document.getElementById('input-name').disabled = !cameraOn;
    }

    startDetection() {
        this.overlay.width = this.video.videoWidth || 640;
        this.overlay.height = this.video.videoHeight || 480;
        this.frameCount = 0;
        this.fpsTimer = performance.now();
        this.runDetection();
    }

    stopDetection() {
        if (this.detectionInterval) {
            cancelAnimationFrame(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        this.setFaceCount(0);
        this.setFPS(0);
    }

    async runDetection() {
        if (!this.camera.active || this.video.readyState < 2) {
            this.detectionInterval = requestAnimationFrame(() => this.runDetection());
            return;
        }

        if (this.isProcessing) {
            this.detectionInterval = requestAnimationFrame(() => this.runDetection());
            return;
        }
        this.isProcessing = true;

        try {
            this.overlay.width = this.video.videoWidth;
            this.overlay.height = this.video.videoHeight;

            const detections = await this.detector.detect(this.video);

            this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            this.drawDetections(detections);

            this.frameCount++;
            const now = performance.now();
            if (now - this.fpsTimer > 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.fpsTimer = now;
                this.setFPS(this.fps);
            }
        } catch (e) {
            console.error(e);
        }

        this.isProcessing = false;
        this.detectionInterval = requestAnimationFrame(() => this.runDetection());
    }

    drawDetections(detections) {
        const w = this.overlay.width;
        const h = this.overlay.height;

        detections.forEach(det => {
            const box = det.detection.box;
            const x = box.x / this.video.videoWidth * w;
            const y = box.y / this.video.videoHeight * h;
            const bw = box.width / this.video.videoWidth * w;
            const bh = box.height / this.video.videoHeight * h;

            let label = 'Unknown';
            let color = '#22d3ee';

            if (det.descriptor) {
                const match = this.detector.recognize(det.descriptor, this.threshold);
                if (match) {
                    label = `${match.name} (${(match.confidence * 100).toFixed(0)}%)`;
                    color = match.confidence > 0.8 ? '#4ade80' : '#fbbf24';
                }
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, bw, bh);

            this.ctx.fillStyle = color;
            const textWidth = this.ctx.measureText(label).width;
            this.ctx.fillRect(x, y - 22, textWidth + 8, 20);

            this.ctx.fillStyle = '#0f172a';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(label, x + 4, y - 8);
        });

        this.setFaceCount(detections.length);
        if (detections.length > 0 && detections[0].descriptor) {
            const match = this.detector.recognize(detections[0].descriptor, this.threshold);
            this.setMatchResult(match ? `${match.name} (${(match.confidence * 100).toFixed(0)}%)` : '');
        } else {
            this.setMatchResult('');
        }
    }

    async captureSample() {
        const name = document.getElementById('input-name').value.trim();
        if (!name) {
            this.log('Enter a person name first.', 'error');
            return;
        }

        const btn = document.getElementById('btn-capture');
        btn.disabled = true;

        try {
            const result = await this.training.captureFromVideo(this.video, name);
            this.log(`Captured sample ${result.count} for "${result.label}"`, 'success');
        } catch (error) {
            this.log(error.message, 'error');
        }

        this.updateCaptureUI();
    }

    savePerson() {
        const name = document.getElementById('input-name').value.trim();
        if (!name) return;

        try {
            const result = this.training.savePerson(name);
            this.log(`Saved "${result.label}" with ${result.samples} samples`, 'success');
        } catch (error) {
            this.log(error.message, 'error');
            return;
        }

        document.getElementById('input-name').value = '';
        this.updateCaptureUI();
        this.renderGallery();
    }

    clearDatabase() {
        this.training.clear();
        this.log('Training database cleared', 'warn');
        this.updateCaptureUI();
        this.renderGallery();
    }

    renderGallery() {
        this.gallery.innerHTML = '';

        if (this.training.totalSamples === 0) {
            this.gallery.innerHTML = '<p class="hint">No training data yet. Start camera, enter a name, and capture face samples.</p>';
            document.getElementById('btn-clear').disabled = true;
            return;
        }

        document.getElementById('btn-clear').disabled = false;

        const stats = this.training.getTrainingStats();
        const info = document.createElement('p');
        info.className = 'hint';
        info.textContent = `Database: ${stats.totalPeople} people, ${stats.totalSamples} total samples.`;
        this.gallery.appendChild(info);

        stats.people.forEach(person => {
            const card = document.createElement('div');
            card.className = 'person-card';

            const header = document.createElement('div');
            header.className = 'person-header';
            header.textContent = `${person.name} (${person.samples})`;
            card.appendChild(header);

            const thumbs = document.createElement('div');
            thumbs.className = 'person-thumbs';

            this.training.getPersonThumbnails(person.name).forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = person.name;
                thumbs.appendChild(img);
            });

            card.appendChild(thumbs);
            this.gallery.appendChild(card);
        });
    }

    setModelStatus(text) {
        document.getElementById('model-status').textContent = text;
    }

    setCameraStatus(state) {
        const el = document.getElementById('camera-status');
        el.textContent = `Camera: ${state}`;
        el.style.color = state === 'on' ? '#4ade80' : '#f87171';
    }

    setFPS(fps) {
        document.getElementById('fps-display').textContent = `FPS: ${fps}`;
    }

    setFaceCount(count) {
        const el = document.getElementById('face-count');
        if (count === 0) {
            el.textContent = 'No face detected';
            el.style.color = '#94a3b8';
        } else {
            el.textContent = `${count} face${count > 1 ? 's' : ''} detected`;
            el.style.color = '#4ade80';
        }
    }

    setMatchResult(text) {
        document.getElementById('match-result').textContent = text || '';
    }

    log(message, type = 'info') {
        const el = document.createElement('div');
        el.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString();
        el.textContent = `[${time}] ${message}`;
        this.logContainer.appendChild(el);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
}

const app = new App();
