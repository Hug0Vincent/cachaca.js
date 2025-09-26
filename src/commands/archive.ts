import { updateArchiveWithFile, listArchiveEntries } from '../core/archive';

export async function buildArchive(
    archivePath: string,
    sourcePath: string,
    leadingPath?: string,
    list?: boolean
) {
  try {

    if(list){
        await listArchive(archivePath);
    } else {
        console.log(`📦 building archive: ${archivePath}`);
        await updateArchiveWithFile(archivePath, sourcePath, leadingPath);
        console.log(`✅ Archive updated.`);
        await listArchive(archivePath);
    }
  } catch (err) {
    console.error(`❌ Failed to update archive:`, err);
    process.exit(1);
  }
}


async function listArchive(path){
    console.log(`📄 Archive entries:`);
    const entries = await listArchiveEntries(path);
    entries.forEach(entry => {
      console.log(`\t- ${entry}`);
    });
}