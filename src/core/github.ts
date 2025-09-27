// Portions of this code are Copyright (c) 2024 Adnan Khan
// Used under the MIT License (see LICENSE file)

import * as github from '@actions/github';
import { Octokit } from "@octokit/rest";

export interface CacheEntry {
    key: string;
    version: string;
    ref: string;
    size: number;
}

/**
 * Resolve owner/repo either from params or GitHub context
 */
async function resolveRepo(token: string, owner?: string, repo?: string) {
    if (owner && repo) return { owner, repo };

    // Fallback to GitHub context
    if (github.context.repo?.owner && github.context.repo?.repo) {
        return { owner: github.context.repo.owner, repo: github.context.repo.repo };
    }

    const octokit = getOctokit(token);

    // As a last resort, get authenticated user's first repo
    
    const user = await octokit.rest.users.getAuthenticated();
    const repos = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 1 });
    if (repos.data.length > 0) {
        return { owner: repos.data[0].owner.login, repo: repos.data[0].name };
    }

    throw new Error('Unable to resolve repository owner and name.');
}

/**
 * List cache entries
 */
export async function listCacheEntries(token: string, owner?: string, repo?: string): Promise<CacheEntry[]> {
    const octokit = getOctokit(token);
    const repoInfo = await resolveRepo(token, owner, repo);

    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/actions/caches', {
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            per_page: 100
        });

        return response.data.actions_caches.map((cache: any) => ({
            key: cache.key,
            version: cache.version,
            ref: cache.ref,
            size: cache.size_in_bytes
        }));
    } catch (error) {
        console.error('Error listing cache entries:', error);
        return [];
    }
}

/**
 * Check if a cache entry exists
 */
export async function checkCacheEntry(token: string, key: string, ref: string, owner?: string, repo?: string): Promise<boolean> {
    const octokit = getOctokit(token);
    const repoInfo = await resolveRepo(token, owner, repo);

    try {
        const response = await octokit.request(
            'GET /repos/{owner}/{repo}/actions/caches?key={key}&ref={ref}',
            {
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                key,
                ref
            }
        );

        return response.data.actions_caches.length > 0;
    } catch (error) {
        console.error('Error checking cache entry:', error);
        return false;
    }
}

/**
 * Delete a cache entry
 */
export async function clearEntry(key: string, version: string, token: string, owner?: string, repo?: string): Promise<boolean> {
    const octokit = getOctokit(token);
    const repoInfo = await resolveRepo(token, owner, repo);

    try {
        const response = await octokit.request('DELETE /repos/{owner}/{repo}/actions/caches?key={key}', {
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            key
        });

        return response.status === 200 || response.status === 404;
    } catch (error) {
        console.error(`Error deleting cache entry:`, error);
        return false;
    }
}

function getOctokit(token: string){
    let octokit;
    if(token){
        octokit = new Octokit({auth: token});
    } else {
        octokit = new Octokit();
    }

    return octokit;
}