export class TrainingManager {
    constructor(detector) {
        this.detector = detector;
        this.labeledDescriptors = {};
        this.thumbnails = {};
    }

    get knownLabels() {
        return Object.keys(this.labeledDescriptors);
    }

    get totalSamples() {
        return Object.values(this.labeledDescriptors).reduce((sum, arr) => sum + arr.length, 0);
    }

    async captureFromVideo(videoElement, label) {
        if (!label || !label.trim()) {
            throw new Error('Enter a name before capturing.');
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const descriptor = await this.detector.getDescriptor(canvas);
        if (!descriptor) {
            throw new Error('No face detected. Look at the camera and try again.');
        }

        const trimmed = label.trim();
        if (!this.labeledDescriptors[trimmed]) {
            this.labeledDescriptors[trimmed] = [];
        }
        this.labeledDescriptors[trimmed].push(descriptor);

        if (!this.thumbnails[trimmed]) {
            this.thumbnails[trimmed] = [];
        }
        this.thumbnails[trimmed].push(canvas.toDataURL('image/jpeg', 0.6));

        this.detector.setTrainingData(this.labeledDescriptors);
        return { label: trimmed, count: this.labeledDescriptors[trimmed].length };
    }

    getCurrentCount(label) {
        if (!label) return 0;
        const trimmed = label.trim();
        return this.labeledDescriptors[trimmed] ? this.labeledDescriptors[trimmed].length : 0;
    }

    savePerson(label) {
        if (!label) throw new Error('No name provided.');
        const trimmed = label.trim();
        const count = this.getCurrentCount(trimmed);
        if (count < 3) {
            throw new Error(`Need at least 3 samples. Currently have ${count}.`);
        }
        return { label: trimmed, samples: count };
    }

    getPersonThumbnails(label) {
        const trimmed = label.trim();
        return this.thumbnails[trimmed] || [];
    }

    getTrainingStats() {
        return {
            totalPeople: this.knownLabels.length,
            people: this.knownLabels.map(name => ({
                name,
                samples: this.labeledDescriptors[name].length,
            })),
            totalSamples: this.totalSamples,
        };
    }

    clear() {
        this.labeledDescriptors = {};
        this.thumbnails = {};
        this.detector.setTrainingData({});
    }
}
