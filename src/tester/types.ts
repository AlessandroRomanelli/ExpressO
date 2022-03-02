export interface CoverageReport {
  coverage: number;
  additional: string[];
  missing: string[];
  matched: string[];
}

export interface ComparisonResults {
  custom: string,
  generated: string,
  endpoints: CoverageReport,
  responses: CoverageReport,
  parameters: CoverageReport
}

export type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head' | 'options' | 'trace';
