// Fix: Replaced placeholder content with type definitions for the application.
export enum PipelineStageStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface ProductSummary {
  description: string;
  pros: string[];
  cons: string[];
}

export interface ProductSpecifications {
  [key: string]: string | number | boolean | null;
}

export interface ProductSourceInfo {
  review_urls: string[];
  retail_urls: string[];
  research_date: string; // ISO 8601 date string
}

export interface ProductSchema {
  product_id: string;
  product_name: string;
  category: string;
  price_usd: number | null;
  summary: ProductSummary;
  specifications: ProductSpecifications;
  source_info: ProductSourceInfo;
}

export interface ResearchJob {
  productName: string;
  category: string;
  status: PipelineStageStatus;
  result: ProductSchema | null;
  error?: string;
}

export interface ResearchBatch {
  id: number;
  jobs: ResearchJob[];
}
