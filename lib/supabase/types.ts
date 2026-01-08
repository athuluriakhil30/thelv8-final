/**
 * Supabase Type Helpers
 * Provides type-safe utilities for working with Supabase database types
 */

import { Database } from '@/types/database.types';

// Helper types for cleaner code
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Insertable<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type Updateable<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

// Type-safe table names
export type TableName = keyof Database['public']['Tables'];

// Common query result types
export type QueryResult<T> = {
  data: T | null;
  error: Error | null;
  count?: number;
};

export type QueryArrayResult<T> = {
  data: T[] | null;
  error: Error | null;
  count?: number;
};

// Database function types
export type DbFunction<T extends keyof Database['public']['Functions']> = 
  Database['public']['Functions'][T];

// Helper for handling Supabase errors
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Type guard for checking if error is Supabase error
export function isSupabaseError(error: unknown): error is SupabaseError {
  return error instanceof SupabaseError || 
         (typeof error === 'object' && error !== null && 'code' in error);
}

// Helper to safely handle Supabase responses
export function handleSupabaseResponse<T>(
  data: T | null,
  error: any
): T {
  if (error) {
    // Re-throw AbortErrors as-is so they can be caught and handled gracefully
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      throw error;
    }
    throw new SupabaseError(
      error.message || 'Database operation failed',
      error.code,
      error.details,
      error.hint
    );
  }
  
  if (!data) {
    throw new SupabaseError('No data returned from database');
  }
  
  return data;
}

// Optional handling (returns null instead of throwing)
export function handleSupabaseOptional<T>(
  data: T | null,
  error: any
): T | null {
  if (error) {
    console.error('Supabase error:', error);
    return null;
  }
  return data;
}
