export class TrainingManager {
    constructor(detector) {
        this.detector = detector;
        this.labeledDescriptors = {};
    }

    get knownLabels() {
        return Object.keys(this.labeledDescriptors);
    }

    get totalSamples() {
        return Object.values(this.labeledDescriptors).reduce((sum, arr) => sum + arr.length, 0);
    }

    async processImages(imagePaths) {
        const results = {};

        for (const { path, label } of imagePaths) {
            try {
                const img = await this.loadImage(path);
                const descriptor = await this.detector.getDescriptor(img);

                if (descriptor) {
                    if (!results[label]) results[label] = [];
                    results[label].push({
                        file: path.split('/').pop(),
                        descriptor: Array.from(descriptor),
                    });
                }
            } catch (e) {
                console.warn(`Failed to process ${path}:`, e.message);
            }
        }

        this.labeledDescriptors = {};
        for (const [label, embeddings] of Object.entries(results)) {
            this.labeledDescriptors[label] = embeddings.map(e => new Float32Array(e.descriptor));
        }

        this.detector.setTrainingData(this.labeledDescriptors);
        return results;
    }

    loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${path}`));
            img.src = path;
        });
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
        this.detector.setTrainingData({});
    }
}
