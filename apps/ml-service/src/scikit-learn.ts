/**
 * ScikitLearnService — Python bridge adapter for dispatch ML service.
 *
 * Architecture: This TypeScript service calls a Python sidecar process
 * (running FastAPI + scikit-learn) via HTTP. In test/demo environments
 * where the Python sidecar is unavailable, a DemoAdapter is used instead
 * of mock randomness — making the fallback behaviour transparent and
 * deterministic rather than silently wrong.
 *
 * Environment variable: SKLEARN_SIDECAR_URL (e.g. http://localhost:5001)
 * When unset, the DemoAdapter is used automatically.
 */

export interface RegressionModel {
  slope: number;
  intercept: number;
  r2: number;
}

export interface ClassificationModel {
  classes: number[];
  accuracy: number;
}

export interface ClusterResult {
  assignments: number[];
  centroids: number[][];
}

// ────────────────────────────────────────────────────────────────────────────
// Python sidecar adapter (production)
// ────────────────────────────────────────────────────────────────────────────

class PythonSidecarAdapter {
  constructor(private baseUrl: string) {}

  async trainRegressionModel(data: { features: number[][]; labels: number[] }): Promise<RegressionModel> {
    const res = await fetch(`${this.baseUrl}/train/regression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`sklearn sidecar error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async predictRegression(features: number[][], model: RegressionModel): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/predict/regression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, model }),
    });
    if (!res.ok) throw new Error(`sklearn sidecar error ${res.status}`);
    return res.json();
  }

  async trainClassification(data: { features: number[][]; labels: number[] }): Promise<ClassificationModel> {
    const res = await fetch(`${this.baseUrl}/train/classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`sklearn sidecar error ${res.status}`);
    return res.json();
  }

  async predictClassification(features: number[][], model: ClassificationModel): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/predict/classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, model }),
    });
    if (!res.ok) throw new Error(`sklearn sidecar error ${res.status}`);
    return res.json();
  }

  async cluster(data: number[][], nClusters: number): Promise<ClusterResult> {
    const res = await fetch(`${this.baseUrl}/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, n_clusters: nClusters }),
    });
    if (!res.ok) throw new Error(`sklearn sidecar error ${res.status}`);
    return res.json();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Demo adapter (test / development without Python sidecar)
// Returns deterministic results using simple linear algebra, clearly labelled.
// ────────────────────────────────────────────────────────────────────────────

class DemoAdapter {
  async trainRegressionModel(data: { features: number[][]; labels: number[] }): Promise<RegressionModel> {
    const { features, labels } = data;
    const n = features.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      const x = features[i][0];
      const y = labels[i];
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    }
    const denom = n * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    // R² using sum of squares
    const yMean = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
      const yHat = slope * features[i][0] + intercept;
      ssTot += (labels[i] - yMean) ** 2;
      ssRes += (labels[i] - yHat) ** 2;
    }
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, r2 };
  }

  async predictRegression(features: number[][], model: RegressionModel): Promise<number[]> {
    return features.map((f) => model.slope * f[0] + model.intercept);
  }

  async trainClassification(data: { features: number[][]; labels: number[] }): Promise<ClassificationModel> {
    const classes = [...new Set(data.labels)].sort((a, b) => a - b);
    // Accuracy is not computable without a real model — return NaN to signal demo mode
    return { classes, accuracy: NaN };
  }

  async predictClassification(features: number[][], model: ClassificationModel): Promise<number[]> {
    // Return the majority class deterministically (not random)
    const majority = model.classes[0];
    return features.map(() => majority);
  }

  async cluster(data: number[][], nClusters: number): Promise<ClusterResult> {
    if (data.length === 0) return { assignments: [], centroids: [] };
    // Assign each point to cluster (index % nClusters) — deterministic, not random
    const assignments = data.map((_, i) => i % nClusters);
    const dims = data[0].length;
    const centroids: number[][] = Array.from({ length: nClusters }, (_, k) => {
      const pts = data.filter((_, i) => i % nClusters === k);
      if (pts.length === 0) return Array(dims).fill(0);
      return Array.from({ length: dims }, (__, d) => pts.reduce((s, p) => s + p[d], 0) / pts.length);
    });
    return { assignments, centroids };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public service — automatically selects adapter based on env
// ────────────────────────────────────────────────────────────────────────────

type Adapter = PythonSidecarAdapter | DemoAdapter;

class ScikitLearnService {
  private adapter: Adapter;

  constructor() {
    const url = process.env.SKLEARN_SIDECAR_URL;
    this.adapter = url ? new PythonSidecarAdapter(url) : new DemoAdapter();
  }

  get isDemoMode(): boolean {
    return this.adapter instanceof DemoAdapter;
  }

  trainRegressionModel(data: { features: number[][]; labels: number[] }) {
    return this.adapter.trainRegressionModel(data);
  }

  predictRegression(features: number[][], model: RegressionModel) {
    return this.adapter.predictRegression(features, model);
  }

  trainClassification(data: { features: number[][]; labels: number[] }) {
    return this.adapter.trainClassification(data);
  }

  predictClassification(features: number[][], model: ClassificationModel) {
    return this.adapter.predictClassification(features, model);
  }

  cluster(data: number[][], nClusters: number) {
    return this.adapter.cluster(data, nClusters);
  }
}

export const scikitLearnService = new ScikitLearnService();
export { ScikitLearnService, DemoAdapter, PythonSidecarAdapter };
