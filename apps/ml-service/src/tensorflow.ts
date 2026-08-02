// TensorFlow service for dispatch

import * as tf from '@tensorflow/tfjs-node';

class TensorFlowService {
  async predictDeliveryTime(features: number[][]): Promise<number[]> {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [features[0].length] }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    const inputTensor = tf.tensor2d(features);
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const result = await predictions.data();

    inputTensor.dispose();
    predictions.dispose();
    model.dispose();

    return Array.from(result);
  }

  async trainModel(trainingData: { inputs: number[][]; outputs: number[] }) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [trainingData.inputs[0].length] }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    const inputTensor = tf.tensor2d(trainingData.inputs);
    const outputTensor = tf.tensor2d(trainingData.outputs.map((o) => [o]));

    await model.fit(inputTensor, outputTensor, { epochs: 100 });

    inputTensor.dispose();
    outputTensor.dispose();

    return model;
  }

  async saveModel(model: tf.LayersModel, path: string) {
    await model.save(`file://${path}`);
  }

  async loadModel(path: string): Promise<tf.LayersModel> {
    return await tf.loadLayersModel(`file://${path}`);
  }
}

export const tensorflowService = new TensorFlowService();
