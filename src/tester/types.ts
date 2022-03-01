export interface CoverageReport {
  coverage: number;
  additional: string[];
  missing: string[];
  matched: string[];
}

export type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head' | 'options' | 'trace';
