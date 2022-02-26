export interface CoverageReport {
  coverage: number;
  additional: string[];
  missing: string[];
}

export type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head' | 'connect' | 'options' | 'trace';

export interface OAPISpecification {
  openapi: string;
  info: { [key: string]: any };
  servers: { [key: string]: any };
  paths: {
    [key: string]: {
      [key in HTTPMethod]: {
        responses: {
          [key: number]: any;
        };
        parameters: {
          [key: string]: {
            name: string;
            in: string;
            required: boolean;
          };
        };
      };
    };
  };
}
