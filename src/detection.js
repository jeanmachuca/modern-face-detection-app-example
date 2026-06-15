import * as faceapi from 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export class FaceDetector {
    constructor() {
        this.modelsLoaded = false;
        this.currentModel = 'ssdMobilenetv1';
        this.labeledDescriptors = {};
    }

    async loadModels(modelType = 'ssdMobilenetv1') {
        this.currentModel = modelType;
        const model = modelType === 'tinyFaceDetector'
            ? faceapi.nets.tinyFaceDetector
            : faceapi.nets.ssdMobilenetv1;

        await model.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        this.modelsLoaded = true;
    }

    async detect(input) {
        if (!this.modelsLoaded) return [];

        const useTiny = this.currentModel === 'tinyFaceDetector';
        const detections = await faceapi
            .detectAllFaces(input, useTiny
                ? new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
                : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
            )
            .withFaceLandmarks()
            .withFaceDescriptors();

        return detections;
    }

    async getDescriptor(input) {
        if (!this.modelsLoaded) return null;

        const result = await faceapi
            .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        return result ? result.descriptor : null;
    }

    setTrainingData(labeledDescriptors) {
        this.labeledDescriptors = labeledDescriptors;
    }

    recognize(descriptor, threshold = 0.5) {
        if (!descriptor || Object.keys(this.labeledDescriptors).length === 0) {
            return null;
        }

        let bestMatch = null;
        let bestDistance = Infinity;

        for (const [label, descriptors] of Object.entries(this.labeledDescriptors)) {
            for (const ref of descriptors) {
                const distance = faceapi.euclideanDistance(descriptor, ref);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = label;
                }
            }
        }

        if (bestDistance < threshold) {
            return { name: bestMatch, distance: bestDistance, confidence: 1 - bestDistance };
        }
        return null;
    }
}
