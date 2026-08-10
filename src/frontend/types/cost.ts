/**
 * Cost estimation and tracking types for loop engineering.
 */

export interface CostEstimate {
  complexity: 'trivial' | 'simple' | 'medium' | 'complex';
  estimated_cost_low: number;
  estimated_cost_high: number;
  max_possible_cost: number;
  estimated_iterations: number;
  model: string;
}

export interface CostUpdate {
  iteration: number;
  cost_usd: number;
  cumulative_cost_usd: number;
  tokens_in: number;
  tokens_out: number;
  model: string;
  status: 'passed' | 'failed';
  duration_seconds: number;
}

export interface UsageSummary {
  model: string;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: number;
  duration_seconds: number;
  iterations: number;
  iterations_passed: number;
  iterations_failed: number;
}
