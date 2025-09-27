// Portions of this code are Copyright (c) 2024 Adnan Khan
// Used under the MIT License (see LICENSE file)

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from "child_process";

const execAsync = promisify(exec);

/**
 * Adds a file or directory to a .tar.zst archive.
 * - Creates the archive if it doesn't exist.
 * - Applies a path transform if leadingPath is provided.
 *
 * @param archivePath - Path to the .tar.zst archive
 * @param sourcePath - File or directory to add
 * @param leadingPath - Optional new leading path inside the archive (e.g., 'src/')
 */
export async function updateArchiveWithFile(
    archivePath: string,
    sourcePath: string,
    leadingPath: string,
    targetFileName?: string
): Promise<void> {
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const baseName = path.basename(sourcePath);
    const archiveFileName = targetFileName || baseName;

    // POSIX-style path for use in tar transform
    const archiveRelativePath = path.posix.join(leadingPath, archiveFileName);
    const transformFlag = `--transform="s|^${sourcePath}$|${archiveRelativePath}|"`;

    const tempTar = `${archivePath}.untarred`

    if (!fs.existsSync(archivePath)) {
        // Create new archive
        const createCmd = `tar -P --zstd ${transformFlag} -cf ${archivePath} ${sourcePath}`;
        await execAsync(createCmd);
    } else {
        // Archive exists: update
        await execAsync(`zstd -d < ${archivePath} > ${tempTar}`);
        const appendCmd = `tar -P --append ${transformFlag} --file=${tempTar} ${sourcePath}`;
        await execAsync(appendCmd);
        await execAsync(`zstd < ${tempTar} > ${archivePath}`);
        fs.unlinkSync(tempTar);
    }
}


/**
 * Lists entries in a .tar.zst archive without extracting it.
 *
 * @param archivePath - Path to the .tar.zst archive
 * @returns List of file paths inside the archive
 */
export async function listArchiveEntries(archivePath: string): Promise<string[]> {
    try {
        const { stdout } = await execAsync(`zstd -dc ${archivePath} | tar -t`);
        return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
        console.error('Error listing archive entries:', error);
        throw error;
    }
}


/**
 * Extracts the contents of a .tar.zst archive to a target directory
 *
 * @param archivePath - Path to the .tar.zst archive
 * @param targetDir - Directory to extract files into
 */
export async function extractArchive(archivePath: string, targetDir: string): Promise<void> {
    const tempTar = `${archivePath}.untarred`;

    try {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        await execAsync(`zstd -d < ${archivePath} > ${tempTar}`);
        await execAsync(`tar -xf ${tempTar} -C ${targetDir}`);
    } catch (error) {
        console.error('Error extracting archive:', error);
        throw error;
    } finally {
        if (fs.existsSync(tempTar)) {
            fs.unlinkSync(tempTar);
        }
    }
}