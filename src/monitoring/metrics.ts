export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface HistogramBucket {
  le: number;
  count: number;
}

export class MetricsCollector {
  private counters: Map<string, number>;
  private gauges: Map<string, number>;
  private histograms: Map<string, number[]>;
  private labels: Map<string, Record<string, string>>;

  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.labels = new Map();
  }

  incrementCounter(name: string, value = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    if (labels) {
      this.labels.set(key, labels);
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);

    if (labels) {
      this.labels.set(key, labels);
    }
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    if (labels) {
      this.labels.set(key, labels);
    }
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels);
    return this.counters.get(key) || 0;
  }

  getGauge(name: string, labels?: Record<string, string>): number | undefined {
    const key = this.getKey(name, labels);
    return this.gauges.get(key);
  }

  getHistogramStats(
    name: string,
    labels?: Record<string, string>
  ): {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      count: sorted.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.labels.clear();
  }

  getAllMetrics(): {
    counters: Map<string, number>;
    gauges: Map<string, number>;
    histograms: Map<string, number[]>;
  } {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
    };
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

export const globalMetrics = new MetricsCollector();

export function recordRequestDuration(
  endpoint: string,
  duration: number,
  status: number
): void {
  globalMetrics.recordHistogram('http_request_duration_ms', duration, {
    endpoint,
    status: status.toString(),
  });

  globalMetrics.incrementCounter('http_requests_total', 1, {
    endpoint,
    status: status.toString(),
  });
}

export function recordError(errorType: string, operation: string): void {
  globalMetrics.incrementCounter('errors_total', 1, {
    type: errorType,
    operation,
  });
}

export function recordIntentParsing(action: string, duration: number): void {
  globalMetrics.recordHistogram('intent_parsing_duration_ms', duration, {
    action,
  });

  globalMetrics.incrementCounter('intents_parsed_total', 1, {
    action,
  });
}

export function recordTransactionBuild(success: boolean, duration: number): void {
  globalMetrics.recordHistogram('transaction_build_duration_ms', duration);

  globalMetrics.incrementCounter('transactions_built_total', 1, {
    success: success.toString(),
  });
}
