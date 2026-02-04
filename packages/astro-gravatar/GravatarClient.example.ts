/**
 * Example usage of the GravatarClient class
 * This file demonstrates various features and configurations
 */

import { GravatarClient } from './src/lib/GravatarClient.js';

// ============================================================================
// Basic Usage Examples
// ============================================================================

/**
 * Example 1: Basic client setup
 */
async function basicExample() {
  console.log('=== Basic Client Example ===');

  // Create a client with default configuration
  const client = new GravatarClient();

  try {
    // Fetch a single profile
    const profile = await client.getProfile('user@example.com');
    console.log('Profile:', profile.display_name);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}

/**
 * Example 2: Client with API key and custom configuration
 */
async function advancedExample() {
  console.log('\n=== Advanced Client Example ===');

  // Create a client with custom configuration
  const client = new GravatarClient({
    apiKey: process.env.GRAVATAR_API_KEY,
    baseUrl: 'https://api.gravatar.com/v3',
    timeout: 15000, // 15 seconds
    headers: {
      'X-Custom-Header': 'my-app',
      'User-Agent': 'MyApp/1.0.0',
    },
    cache: {
      ttl: 600, // 10 minutes
      maxSize: 50,
      enabled: true,
    },
    retry: {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryOnRateLimit: true,
    },
    rateLimit: {
      autoHandle: true,
      safetyBuffer: 0.2, // 20% safety buffer
    },
  });

  try {
    // Fetch profiles in batch
    const emails = [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ];

    const results = await client.getProfiles(emails, {
      concurrency: 5,
      failFast: false,
      batchDelay: 100,
    });

    results.forEach(({ email, profile, error }) => {
      if (profile) {
        console.log(`${email}: ${profile.display_name}`);
      } else {
        console.error(`${email}: Failed - ${(error as Error)?.message}`);
      }
    });

  } catch (error) {
    console.error('Batch request failed:', error);
  }
}

// ============================================================================
// Enterprise Features Examples
// ============================================================================

/**
 * Example 3: Monitoring and Statistics
 */
async function monitoringExample() {
  console.log('\n=== Monitoring Example ===');

  const client = new GravatarClient({
    apiKey: process.env.GRAVATAR_API_KEY,
    cache: { ttl: 300, maxSize: 100 },
  });

  try {
    // Make some requests
    await client.getProfile('user1@example.com');
    await client.getProfile('user2@example.com');

    // Get cache statistics
    const cacheStats = client.getCacheStats();
    console.log('Cache Statistics:');
    console.log(`  Size: ${cacheStats.size}/${cacheStats.maxSize}`);
    console.log(`  Hit Ratio: ${(cacheStats.hitRatio * 100).toFixed(1)}%`);
    console.log(`  Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}`);

    // Get request statistics
    const requestStats = client.getRequestStats();
    console.log('\nRequest Statistics:');
    console.log(`  Total Requests: ${requestStats.totalRequests}`);
    console.log(`  Successful: ${requestStats.successfulRequests}`);
    console.log(`  Failed: ${requestStats.failedRequests}`);
    console.log(`  Retries: ${requestStats.totalRetries}`);

    if (requestStats.currentRateLimit) {
      console.log('\nCurrent Rate Limit:');
      console.log(`  Limit: ${requestStats.currentRateLimit.limit}`);
      console.log(`  Remaining: ${requestStats.currentRateLimit.remaining}`);
    }

  } catch (error) {
    console.error('Monitoring example failed:', error);
  }
}

/**
 * Example 4: Error Handling and Recovery
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');

  const client = new GravatarClient({
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    rateLimit: {
      autoHandle: true,
      safetyBuffer: 0.1,
    },
  });

  try {
    // This might fail and trigger retries
    const profile = await client.getProfile('nonexistent@example.com');
    console.log('Profile:', profile);
  } catch (error) {
    console.log('Expected error occurred:', (error as Error).message);
    const err = error as any;

    // Check if it was a rate limit error
    if (err.code === 'RATE_LIMITED' && err.rateLimit) {
      console.log(`Rate limited. Reset at: ${new Date(err.rateLimit.reset * 1000)}`);
    }
  }
}

/**
 * Example 5: Dynamic Configuration Updates
 */
async function dynamicConfigExample() {
  console.log('\n=== Dynamic Configuration Example ===');

  const client = new GravatarClient({
    timeout: 5000,
    cache: { ttl: 60, maxSize: 10 },
  });

  try {
    // Make initial request
    await client.getProfile('user@example.com');
    console.log('Initial request completed');

    // Update configuration dynamically
    client.updateConfig({
      timeout: 15000,
      cache: { ttl: 300, maxSize: 50 },
      headers: { 'X-New-Feature': 'enabled' },
    });

    console.log('Configuration updated');
    console.log('New config:', client.getConfig());

    // Make another request with new configuration
    await client.getProfile('user@example.com');
    console.log('Request with new config completed');

  } catch (error) {
    console.error('Dynamic config example failed:', error);
  }
}

// ============================================================================
// Integration with Existing Code
// ============================================================================

/**
 * Example 6: Integration with Astro components
 */
function integrationExample() {
  console.log('\n=== Integration Example ===');

  // Create a singleton client for your Astro app
  const gravatarClient = new GravatarClient({
    apiKey: process.env.GRAVATAR_API_KEY,
    cache: {
      ttl: 300, // 5 minutes - good for production
      maxSize: 1000, // Large cache for better performance
    },
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
    },
  });

  // Export for use in components
  return {
    getClient: () => gravatarClient,

    // Helper methods for common operations
    async getProfileData(email: string) {
      try {
        return await gravatarClient.getProfile(email);
      } catch (error) {
        console.error(`Failed to fetch profile for ${email}:`, error);
        return null;
      }
    },

    async getMultipleProfiles(emails: string[]) {
      try {
        const results = await gravatarClient.getProfiles(emails);
        return results.filter(result => result.profile).map(result => result.profile!);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        return [];
      }
    },

    // Method to get health/status information
    getHealth() {
      const cacheStats = gravatarClient.getCacheStats();
      const requestStats = gravatarClient.getRequestStats();

      return {
        cache: {
          size: cacheStats.size,
          hitRatio: cacheStats.hitRatio,
        },
        requests: {
          total: requestStats.totalRequests,
          successRate: requestStats.totalRequests > 0
            ? requestStats.successfulRequests / requestStats.totalRequests
            : 0,
        },
      };
    },
  };
}

// ============================================================================
// Performance Optimization Examples
// ============================================================================

/**
 * Example 7: Performance-optimized client for high-traffic applications
 */
function performanceOptimizedClient() {
  console.log('\n=== Performance Optimized Client ===');

  return new GravatarClient({
    // Aggressive caching for high traffic
    cache: {
      ttl: 1800, // 30 minutes
      maxSize: 5000, // Large cache
      enabled: true,
    },

    // Optimized retry settings
    retry: {
      maxAttempts: 2, // Fewer retries for better latency
      baseDelay: 500,
      maxDelay: 2000,
      backoffFactor: 1.5,
    },

    // Shorter timeout for better responsiveness
    timeout: 5000,

    // Custom headers for CDN/proxy integration
    headers: {
      'X-CDN-Cache': 'bypass',
      'Connection': 'keep-alive',
    },

    // Conservative rate limit handling
    rateLimit: {
      autoHandle: true,
      safetyBuffer: 0.25, // 25% safety buffer
    },
  });
}

// ============================================================================
// Run Examples
// ============================================================================

/**
 * Main function to run all examples
 */
async function runExamples() {
  console.log('GravatarClient Usage Examples\n');

  // Note: These examples require a valid Gravatar API key
  // Set GRAVATAR_API_KEY environment variable to run them fully

  try {
    await basicExample();
    await advancedExample();
    await monitoringExample();
    await errorHandlingExample();
    await dynamicConfigExample();

    const integration = integrationExample();
    console.log('\n=== Integration Setup Complete ===');
    console.log('Health check:', integration.getHealth());

    const optimizedClient = performanceOptimizedClient();
    console.log('\n=== Performance Optimized Client Created ===');
    console.log('Config:', optimizedClient.getConfig());

  } catch (error) {
    console.error('Examples failed:', error);
  }
}

// Export examples for individual testing
export {
  basicExample,
  advancedExample,
  monitoringExample,
  errorHandlingExample,
  dynamicConfigExample,
  integrationExample,
  performanceOptimizedClient,
  runExamples,
};

// Run examples if this file is executed directly
if (import.meta.main) {
  runExamples();
}