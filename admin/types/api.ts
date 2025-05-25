
// src/types/api.ts
export type ApiResponse<T> = {
    data: T;
    message?: string;
    error?: string;
  };
  
  export type PaginationParams = {
    limit?: number;
    offset?: number;
  };
  
  export type PaginatedResponse<T> = {
    data: T[];
    total: number;
    limit: number;
    offset: number;
  };