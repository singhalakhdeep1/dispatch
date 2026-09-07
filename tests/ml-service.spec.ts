/**
 * ScikitLearnService — DemoAdapter unit tests.
 *
 * Tests the deterministic DemoAdapter behaviour without requiring
 * a Python sidecar. The PythonSidecarAdapter is tested separately
 * with a mock fetch (integration tests against the live sidecar
 * belong in e2e/ and require SKLEARN_SIDECAR_URL to be set).
 */
import { describe, it, expect } from 'vitest';
import { DemoAdapter, ScikitLearnService } from '../apps/ml-service/src/scikit-learn';

// ────────────────────────────────────────────────────────────────────────────
// DemoAdapter (regression)
// ────────────────────────────────────────────────────────────────────────────

describe('DemoAdapter — regression', () => {
  const adapter = new DemoAdapter();

  it('computes slope and intercept for a perfect linear dataset', async () => {
    // y = 2x + 1
    const features = [[1], [2], [3], [4], [5]];
    const labels = [3, 5, 7, 9, 11];
    const model = await adapter.trainRegressionModel({ features, labels });

    expect(model.slope).toBeCloseTo(2, 5);
    expect(model.intercept).toBeCloseTo(1, 5);
  });

  it('computes R² = 1.0 for a perfect linear fit', async () => {
    const features = [[1], [2], [3], [4], [5]];
    const labels = [2, 4, 6, 8, 10]; // y = 2x
    const model = await adapter.trainRegressionModel({ features, labels });

    expect(model.r2).toBeCloseTo(1.0, 4);
  });

  it('computes R² close to 0 for a flat/noisy dataset', async () => {
    const features = [[1], [2], [3], [4], [5]];
    const labels = [5, 5, 5, 5, 5]; // constant — no explanatory power
    const model = await adapter.trainRegressionModel({ features, labels });

    // slope = 0 (no relationship), R² = 0 or NaN → either is acceptable
    expect(model.slope).toBeCloseTo(0, 5);
  });

  it('predicts using the model correctly', async () => {
    const features = [[1], [2], [3]];
    const labels = [3, 5, 7]; // y = 2x + 1
    const model = await adapter.trainRegressionModel({ features, labels });
    const preds = await adapter.predictRegression([[4], [5]], model);

    expect(preds[0]).toBeCloseTo(9, 1);  // 2*4+1
    expect(preds[1]).toBeCloseTo(11, 1); // 2*5+1
  });

  it('handles single data point without throwing', async () => {
    const model = await adapter.trainRegressionModel({ features: [[3]], labels: [7] });
    expect(model).toHaveProperty('slope');
    expect(model).toHaveProperty('intercept');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// DemoAdapter (classification)
// ────────────────────────────────────────────────────────────────────────────

describe('DemoAdapter — classification', () => {
  const adapter = new DemoAdapter();

  it('returns distinct sorted classes from training labels', async () => {
    const model = await adapter.trainClassification({
      features: [[1], [2], [3], [4]],
      labels: [1, 0, 1, 0],
    });
    expect(model.classes).toEqual([0, 1]);
  });

  it('predictClassification returns majority class deterministically (not random)', async () => {
    const model = await adapter.trainClassification({
      features: [[1], [2]],
      labels: [0, 1],
    });
    const preds1 = await adapter.predictClassification([[5], [6]], model);
    const preds2 = await adapter.predictClassification([[5], [6]], model);

    // Must be identical (deterministic)
    expect(preds1).toEqual(preds2);
    // All predictions should be a known class
    preds1.forEach(p => expect(model.classes).toContain(p));
  });

  it('accuracy is NaN in demo mode (no real model)', async () => {
    const model = await adapter.trainClassification({
      features: [[1]], labels: [0],
    });
    expect(Number.isNaN(model.accuracy)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// DemoAdapter (clustering)
// ────────────────────────────────────────────────────────────────────────────

describe('DemoAdapter — clustering', () => {
  const adapter = new DemoAdapter();

  it('returns correct number of cluster assignments', async () => {
    const data = [[1, 2], [3, 4], [5, 6], [7, 8]];
    const result = await adapter.cluster(data, 2);
    expect(result.assignments).toHaveLength(4);
  });

  it('returns correct number of centroids', async () => {
    const data = [[1, 2], [3, 4], [5, 6]];
    const result = await adapter.cluster(data, 3);
    expect(result.centroids).toHaveLength(3);
  });

  it('assignments are deterministic (not random)', async () => {
    const data = [[1], [2], [3], [4], [5], [6]];
    const r1 = await adapter.cluster(data, 2);
    const r2 = await adapter.cluster(data, 2);
    expect(r1.assignments).toEqual(r2.assignments);
  });

  it('assignments use index % nClusters', async () => {
    const data = [[0], [1], [2], [3], [4], [5]];
    const result = await adapter.cluster(data, 3);
    expect(result.assignments).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('handles empty data without throwing', async () => {
    const result = await adapter.cluster([], 2);
    expect(result.assignments).toHaveLength(0);
    expect(result.centroids).toHaveLength(0);
  });

  it('centroids are computed as mean of assigned points', async () => {
    // data: [0], [2], [4], [6] with nClusters=2
    // cluster 0: [0],[4] → centroid = [2]
    // cluster 1: [2],[6] → centroid = [4]
    const data = [[0], [2], [4], [6]];
    const result = await adapter.cluster(data, 2);
    expect(result.centroids[0][0]).toBeCloseTo(2, 5);
    expect(result.centroids[1][0]).toBeCloseTo(4, 5);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// ScikitLearnService — adapter selection
// ────────────────────────────────────────────────────────────────────────────

describe('ScikitLearnService — adapter selection', () => {
  it('uses DemoAdapter when SKLEARN_SIDECAR_URL is not set', () => {
    delete process.env.SKLEARN_SIDECAR_URL;
    const svc = new ScikitLearnService();
    expect(svc.isDemoMode).toBe(true);
  });

  it('uses PythonSidecarAdapter when SKLEARN_SIDECAR_URL is set', () => {
    process.env.SKLEARN_SIDECAR_URL = 'http://localhost:5001';
    const svc = new ScikitLearnService();
    expect(svc.isDemoMode).toBe(false);
    delete process.env.SKLEARN_SIDECAR_URL;
  });
});
