export type FeatureSpec =
  | { name: string; type: "categorical"; options: string[]; default: string }
  | { name: string; type: "numeric"; min: number; max: number; default: number };

export type CurvePoint = [number, number];

export interface ModelMeta {
  name: string;
  selected: boolean;
  holdout: { AUC: number; ALIFT: number; "PR-AUC": number; "Capture@20%": number; "Capture@50%": number };
  rolling_auc: number[];
  rolling_auc_mean: number;
  rolling_auc_std: number;
  random_split_auc: number;
  tuning_cv_auc: number | null;
  best_params: Record<string, string | number | boolean> | null;
  roc: CurvePoint[];
  gains: CurvePoint[];
}

export interface CapacityRow {
  k: number; tp: number; fp: number; fn: number; tn: number;
  precision: number; recall: number; lift: number;
}

export interface CategoryStat { value: string; count: number; yes_rate: number }

export interface Metadata {
  model_version: string;
  model_name: string;
  sklearn_version: string;
  features: FeatureSpec[];
  operating_point: { default_top_k: number; threshold: number };
  validation: {
    holdout_rows: number; train_rows: number; holdout_yes_rate: number; train_yes_rate: number;
    rolling_folds: { fold: number; test_yes_rate: number; test_euribor3m: number }[];
  };
  models: ModelMeta[];
  capacity: CapacityRow[];
  importance: { feature: string; auc_drop: number }[];
  eda: {
    n_rows: number; n_yes: number; yes_rate: number;
    by_category: Record<string, CategoryStat[]>;
    by_age: CategoryStat[];
    numeric_corr_with_target: Record<string, number>;
    timeline: { block: number; yes_rate: number; euribor3m: number; nr_employed: number }[];
  };
}

export interface Factor { feature: string; value: string; effect: number }

export interface PredictResult {
  probability: number; percentile: number; top_percent: number; predicted_yes: boolean;
  threshold: number; model_version: string; model_name: string; factors: Factor[];
}

export interface BatchResult {
  n_rows: number; n_predicted_yes: number; threshold: number; model_version: string;
  rows: { row: number; probability: number; percentile: number; predicted_yes: boolean }[];
}

export interface HistoryItem {
  id: number; created_at: string; source: "single" | "batch"; input: Record<string, string | number>;
  probability: number; predicted_yes: boolean; model_version: string;
}

export interface Stats {
  enabled: boolean; total?: number; avg_probability?: number; predicted_yes?: number;
  daily?: { date: string; count: number; avg_probability: number }[];
  score_histogram?: { bucket: number; count: number }[];
  batch_jobs?: number; batch_rows?: number;
}
