import 'dotenv/config';

import { generateResumeObject } from '@/lib/server/ai/generateResumeObject';
import { SAMPLE_RESUMES, getAllLanguages, type ResumeLanguage } from './sampleResumes';

export interface ModelPricing {
  inputCost: number;
  outputCost: number;
}

// Together AI serverless chat models (verified IDs from /v1/models API)
// Sorted by input price ascending. Includes all models the user requested.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Lower-cost, smaller models
  'MiniMaxAI/MiniMax-M2.5': { inputCost: 0.30, outputCost: 1.20 },
  'MiniMaxAI/MiniMax-M2.7': { inputCost: 0.30, outputCost: 1.20 },
  'Qwen/Qwen3-Coder-Next-FP8': { inputCost: 0.50, outputCost: 1.20 },
  'moonshotai/Kimi-K2.5': { inputCost: 0.50, outputCost: 2.80 },
  'Qwen/Qwen3.5-397B-A17B': { inputCost: 0.60, outputCost: 3.60 },
  'deepseek-ai/DeepSeek-V3.1': { inputCost: 0.60, outputCost: 1.70 },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': { inputCost: 0.88, outputCost: 0.88 },
  'zai-org/GLM-5': { inputCost: 1.00, outputCost: 3.20 },
  'moonshotai/Kimi-K2.6': { inputCost: 1.20, outputCost: 4.50 },
  'deepcogito/cogito-v2-1-671b': { inputCost: 1.25, outputCost: 1.25 },
  'zai-org/GLM-5.1': { inputCost: 1.40, outputCost: 4.40 },
  'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8': { inputCost: 2.00, outputCost: 2.00 },
  'deepseek-ai/DeepSeek-V4-Pro': { inputCost: 2.10, outputCost: 4.40 },
  'deepseek-ai/DeepSeek-R1-0528': { inputCost: 3.00, outputCost: 7.00 },
};

export const MODELS = Object.keys(MODEL_PRICING);

export interface BenchmarkResult {
  model: string;
  language: ResumeLanguage;
  success: boolean;
  durationMs: number;
  estimatedCost: number;
  error?: string;
}

export async function benchmarkModel(
  model: string,
  language: ResumeLanguage
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  const pricing = MODEL_PRICING[model] || { inputCost: 0, outputCost: 0 };

  try {
    // Reduce token limit for benchmark speed; JSON resume objects rarely need 4096 tokens.
    const result = await generateResumeObject(SAMPLE_RESUMES[language].content, model);
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    return {
      model,
      language,
      success: result !== undefined,
      durationMs,
      estimatedCost: 0,
      error: result === undefined ? 'Generation returned undefined' : undefined,
    };
  } catch (error) {
    const endTime = Date.now();
    const errMsg =
      error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120);
    return {
      model,
      language,
      success: false,
      durationMs: endTime - startTime,
      estimatedCost: 0,
      error: errMsg,
    };
  }
}

export async function runBenchmark(
  models: string[] = MODELS,
  languages: ResumeLanguage[] = getAllLanguages()
): Promise<BenchmarkResult[]> {
  const tasks: Promise<BenchmarkResult>[] = [];

  for (const model of models) {
    for (const language of languages) {
      tasks.push(benchmarkModel(model, language));
    }
  }

  const results = await Promise.all(tasks);

  // Print results grouped by model for readability
  const byModel = new Map<string, BenchmarkResult[]>();
  for (const r of results) {
    if (!byModel.has(r.model)) byModel.set(r.model, []);
    byModel.get(r.model)!.push(r);
  }

  for (const [model, modelResults] of byModel) {
    console.log(`\n[Benchmark] ${model}`);
    for (const r of modelResults) {
      console.log(
        `  ${r.language}: ${r.success ? 'SUCCESS' : 'FAILED'} - ${r.durationMs}ms${r.error ? ` | ${r.error}` : ''}`
      );
    }
  }

  return results;
}

export function printBenchmarkResults(results: BenchmarkResult[]): void {
  console.log('\n========== BENCHMARK RESULTS ==========\n');

  const byModel = new Map<string, BenchmarkResult[]>();
  for (const r of results) {
    if (!byModel.has(r.model)) byModel.set(r.model, []);
    byModel.get(r.model)!.push(r);
  }

  const summary: Array<{
    model: string;
    avgDurationMs: number;
    successRate: number;
    totalRuns: number;
  }> = [];

  for (const [model, modelResults] of byModel) {
    const successCount = modelResults.filter((r) => r.success).length;
    const totalDurationMs = modelResults.reduce((sum, r) => sum + r.durationMs, 0);
    summary.push({
      model,
      avgDurationMs: Math.round(totalDurationMs / modelResults.length),
      successRate: Math.round((successCount / modelResults.length) * 100),
      totalRuns: modelResults.length,
    });
  }

  summary.sort((a, b) => {
    if (b.successRate !== a.successRate) return b.successRate - a.successRate;
    return a.avgDurationMs - b.avgDurationMs;
  });

  console.log('Model                          | Avg Duration | Success Rate | Runs');
  console.log('-------------------------------|--------------|--------------|------');
  for (const s of summary) {
    console.log(
      `${s.model.padEnd(30)}| ${String(s.avgDurationMs).padStart(12)}ms | ${String(s.successRate).padStart(11)}% | ${s.totalRuns}`
    );
  }

  console.log('\n========== BEST MODELS BY SUCCESS RATE & SPEED ==========\n');
  const topBySuccess = [...summary].sort((a, b) => b.successRate - a.successRate);
  const topBySpeed = [...summary]
    .filter((s) => s.successRate === 100)
    .sort((a, b) => a.avgDurationMs - b.avgDurationMs);

  console.log('Top by success rate:');
  for (const s of topBySuccess.slice(0, 5)) {
    console.log(`  ${s.model} - ${s.successRate}% success (${s.avgDurationMs}ms avg)`);
  }

  console.log('\nTop by speed (100% success only):');
  for (const s of topBySpeed.slice(0, 5)) {
    console.log(`  ${s.model} - ${s.avgDurationMs}ms avg`);
  }
}

if (require.main === module) {
  runBenchmark()
    .then(printBenchmarkResults)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
