// Portions of this code are Copyright (c) 2024 Adnan Khan
// Used under the MIT License (see LICENSE file)

import * as fs from 'fs';
import { GetCacheEntryDownloadURLRequest } from '@actions/cache/lib/generated/results/api/v1/cache';
import { DownloadOptions } from '@actions/cache/lib/options';

const cacheTwirpClient = require('@actions/cache/lib/internal/shared/cacheTwirpClient');
const cacheHttpClient = require('@actions/cache/lib/internal/cacheHttpClient');

export async function retrieveEntry(cache_key: string, cache_version: string, runtimeToken: string, downloadPath: string): Promise<string> {
    if (!runtimeToken) return '';

    process.env['ACTIONS_CACHE_URL'] = 'https://results-receiver.actions.githubusercontent.com';
    process.env['ACTIONS_RUNTIME_TOKEN'] = runtimeToken;

    const request: GetCacheEntryDownloadURLRequest = {
        key: cache_key,
        restoreKeys: [],
        version: cache_version
    };

    const twirpClient = cacheTwirpClient.internalCacheTwirpClient();
    const response = await twirpClient.GetCacheEntryDownloadURL(request);

    if (response.ok) {
        const options: DownloadOptions = { useAzureSdk: true };
        await cacheHttpClient.downloadCache(response.signedDownloadUrl, downloadPath, options);

        return fs.existsSync(downloadPath) ? downloadPath : '';
    }

    return '';
}

export async function setEntry(
    archive: string,
    key: string,
    version: string,
    runtimeToken: string
): Promise<boolean> {
    try {
        if (!runtimeToken) {
            console.error('Runtime token is missing');
            return false;
        }

        if (!fs.existsSync(archive)) {
            console.error(`Archive file does not exist at path: ${archive}`);
            return false;
        }

        const stats = fs.statSync(archive);
        const archiveFileSize = stats.size;

        const request: CreateCacheEntryRequest = { key, version };

        process.env['ACTIONS_RESULTS_URL'] = 'https://results-receiver.actions.githubusercontent.com';
        process.env['ACTIONS_RUNTIME_TOKEN'] = runtimeToken;

        const twirpClient = cacheTwirpClient.internalCacheTwirpClient();
        const response = await twirpClient.CreateCacheEntry(request);

        const options: UploadOptions = { useAzureSdk: true };

        if (response.ok) {
            await cacheHttpClient.saveCache(-1, archive, response.signedUploadUrl, options);
            console.log('Cache entry created successfully.');

            const finalizeRequest: FinalizeCacheEntryUploadRequest = {
                key,
                version,
                sizeBytes: `${archiveFileSize}`,
            };

            const finalizeResponse: FinalizeCacheEntryUploadResponse =
                await twirpClient.FinalizeCacheEntryUpload(finalizeRequest);

            if (finalizeResponse.ok) {
                console.log('Cache entry finalized successfully!');
                return true;
            } else {
                console.error('Error finalizing cache entry');
                return false;
            }
        } else {
            console.error('Error saving cache entry:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error setting cache entry:', error);
        return false;
    }
}
