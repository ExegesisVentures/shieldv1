/**
 * Performance Monitoring Utility
 * 
 * Helps track and optimize API calls and performance bottlenecks
 * in the ShieldNest application.
 * 
 * File: /utils/performance-monitor.ts
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, number> = new Map();

  /**
   * Start tracking a performance operation
   */
  startOperation(operation: string): void {
    const startTime = performance.now();
    this.activeOperations.set(operation, startTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [Performance] Starting: ${operation}`);
    }
  }

  /**
   * End tracking a performance operation
   */
  endOperation(operation: string, success: boolean = true, error?: string): void {
    const startTime = this.activeOperations.get(operation);
    if (!startTime) {
      console.warn(`⚠️ [Performance] No start time found for operation: ${operation}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.activeOperations.delete(operation);
    
    const metric: PerformanceMetric = {
      operation,
      startTime,
      endTime,
      duration,
      success,
      error
    };
    
    this.metrics.push(metric);
    
    if (process.env.NODE_ENV === 'development') {
      const status = success ? '✅' : '❌';
      console.log(`${status} [Performance] ${operation}: ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`⚠️ [Performance] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: PerformanceMetric[];
    errorRate: number;
  } {
    const totalOperations = this.metrics.length;
    const averageDuration = this.metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalOperations;
    const slowOperations = this.metrics.filter(m => (m.duration || 0) > 1000);
    const errorRate = this.metrics.filter(m => !m.success).length / totalOperations;

    return {
      totalOperations,
      averageDuration,
      slowOperations,
      errorRate
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function to automatically track performance
 */
export function trackPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startOperation(operationName);
      
      try {
        const result = await method.apply(this, args);
        performanceMonitor.endOperation(operationName, true);
        return result;
      } catch (error) {
        performanceMonitor.endOperation(operationName, false, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    };
  };
}

/**
 * Utility function to track async operations
 */
export async function trackAsyncOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  performanceMonitor.startOperation(operationName);
  
  try {
    const result = await operation();
    performanceMonitor.endOperation(operationName, true);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operationName, false, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Utility function to track sync operations
 */
export function trackSyncOperation<T>(
  operationName: string,
  operation: () => T
): T {
  performanceMonitor.startOperation(operationName);
  
  try {
    const result = operation();
    performanceMonitor.endOperation(operationName, true);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operationName, false, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
