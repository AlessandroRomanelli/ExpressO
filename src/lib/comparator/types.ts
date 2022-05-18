export interface CoverageReport {
  strictCoverage: number;
  coverage: number;
  originalCount: number;
  additional: string[];
  missing: string[];
  matched: string[];
  partiallyMatched: string[];
}

export interface ComparisonResults {
  custom: string;
  generated: string;
  endpoints: CoverageReport;
  responses: CoverageReport;
  parameters: CoverageReport;
}

export type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head' | 'options' | 'trace';
