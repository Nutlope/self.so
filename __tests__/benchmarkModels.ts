import { generateResumeObject } from '@/lib/server/ai/generateResumeObject';
import { SAMPLE_RESUMES, getAllLanguages, type ResumeLanguage } from './sampleResumes';

export interface ModelPricing {
  inputCost: number;
  outputCost: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'LFM2-24B-A2B': { inputCost: 0.03, outputCost: 0.12 },
  'OpenAI-GPT-O3-Mini': { inputCost: 0.05, outputCost: 0.20 },
  'google/gemma-3n-e4b-instruct': { inputCost: 0.06, outputCost: 0.12 },
  'Qwen/Qwen3.5-9B-FP8': { inputCost: 0.10, outputCost: 0.15 },
  'EssentialAI/EssentialAI-Rnj-1-Instruct': { inputCost: 0.15, outputCost: 0.15 },
  'OpenAI/GPT-O3-120B': { inputCost: 0.15, outputCost: 0.60 },
  'google/gemma-4-31b-it-FP8': { inputCost: 0.20, outputCost: 0.50 },
  'Qwen/Qwen3-235B-A22B-Instruct-2507-FP8': { inputCost: 0.20, outputCost: 0.60 },
  'MiniMaxAI/MiniMax-M2.7-FP4': { inputCost: 0.30, outputCost: 1.20 },
  'MiniMaxAI/MiniMax-M2.5-FP4': { inputCost: 0.30, outputCost: 1.20 },
  'Qwen/Qwen3-Coder-Next-FP8': { inputCost: 0.50, outputCost: 1.20 },
  'MoonshotAI/Kimi-K2.5': { inputCost: 0.50, outputCost: 2.80 },
  'deepseek-ai/DeepSeek-V3': { inputCost: 0.60, outputCost: 1.70 },
  'Qwen/Qwen3.5-397B-A17B': { inputCost: 0.60, outputCost: 3.60 },
  'Meta-Llama/Llama-3.3-70B-Instruct-Turbo': { inputCost: 0.88, outputCost: 0.88 },
  'Zai-Org/GLM-5-FP4': { inputCost: 1.00, outputCost: 3.20 },
  'Deepcogito/Cogito-v2.1-671B': { inputCost: 1.25, outputCost: 1.25 },
  'Zai-Org/GLM-5.1-FP4': { inputCost: 1.40, outputCost: 4.40 },
  'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8': { inputCost: 2.00, outputCost: 2.00 },
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
    return {
      model,
      language,
      success: false,
      durationMs: endTime - startTime,
      estimatedCost: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runBenchmark(
  models: string[] = MODELS,
  languages: ResumeLanguage[] = getAllLanguages()
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const model of models) {
    console.log(`\n[Benchmark] Testing model: ${model}`);
    for (const language of languages) {
      console.log(`  [Benchmark] Testing language: ${language}`);
      const result = await benchmarkModel(model, language);
      results.push(result);
      console.log(
        `  [Benchmark] ${language}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.durationMs}ms${result.error ? ` - ${result.error}` : ''}`
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