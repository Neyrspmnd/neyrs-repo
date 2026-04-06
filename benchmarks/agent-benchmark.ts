import { IntentParser } from '../src/core/parser';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
}

async function benchmark(
  name: string,
  fn: () => Promise<void>,
  iterations = 1000
): Promise<BenchmarkResult> {
  const times: number[] = [];

  console.log(`\nRunning benchmark: ${name}`);
  console.log(`Iterations: ${iterations}`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\rProgress: ${i + 1}/${iterations}`);
    }
  }

  process.stdout.write('\r');

  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSec = 1000 / avgTime;

  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    opsPerSec,
  };
}

function printResults(results: BenchmarkResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('BENCHMARK RESULTS');
  console.log('='.repeat(80));

  for (const result of results) {
    console.log(`\n${result.name}`);
    console.log('-'.repeat(80));
    console.log(`Iterations:     ${result.iterations.toLocaleString()}`);
    console.log(`Total Time:     ${result.totalTime.toFixed(2)} ms`);
    console.log(`Average Time:   ${result.avgTime.toFixed(3)} ms`);
    console.log(`Min Time:       ${result.minTime.toFixed(3)} ms`);
    console.log(`Max Time:       ${result.maxTime.toFixed(3)} ms`);
    console.log(`Throughput:     ${result.opsPerSec.toFixed(0)} ops/sec`);
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  console.log('🚀 Neyrs Agent Benchmark Suite\n');

  const parser = new IntentParser();
  const results: BenchmarkResult[] = [];

  const swapResult = await benchmark(
    'Intent Parsing - Swap',
    async () => {
      await parser.parse('swap 5 SOL for USDC');
    },
    1000
  );
  results.push(swapResult);

  const sendResult = await benchmark(
    'Intent Parsing - Send',
    async () => {
      await parser.parse('send 2 SOL to DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK');
    },
    1000
  );
  results.push(sendResult);

  const balanceResult = await benchmark(
    'Intent Parsing - Balance',
    async () => {
      await parser.parse('show my balance');
    },
    1000
  );
  results.push(balanceResult);

  const priceResult = await benchmark(
    'Intent Parsing - Price',
    async () => {
      await parser.parse("what's the price of SOL");
    },
    1000
  );
  results.push(priceResult);

  const complexResult = await benchmark(
    'Intent Parsing - Complex Query',
    async () => {
      await parser.parse('exchange 100.5 BONK to USDC with high priority');
    },
    1000
  );
  results.push(complexResult);

  printResults(results);

  const avgThroughput =
    results.reduce((sum, r) => sum + r.opsPerSec, 0) / results.length;
  console.log(`\n📊 Average Throughput: ${avgThroughput.toFixed(0)} ops/sec`);

  const avgLatency =
    results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
  console.log(`⚡ Average Latency: ${avgLatency.toFixed(3)} ms\n`);
}

main().catch(console.error);
