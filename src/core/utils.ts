// Portions of this code are Copyright (c) 2024 Adnan Khan
// Used under the MIT License (see LICENSE file)

import https from 'https';

export const agent: https.Agent = new https.Agent({
      rejectUnauthorized: false, // Accept self-signed certificates
});

export function generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length })
        .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
        .join('');
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function calculateCacheVersion(paths: string[]): Promise<string> {
    var cacheUtils = require('@actions/cache/lib/internal/cacheUtils');

    // Use same call from `actions/toolkit`.
    const version = cacheUtils.getCacheVersion(paths, 'zstd-without-long');
    return version
}