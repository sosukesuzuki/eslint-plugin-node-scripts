# eslint-plugin-node-scripts

Useful scripts for maintainance eslint-plugin-node.

## `find-supported-version-from-docs.js`

Node: A script with the same purpose is currently available at https://github.com/sosukesuzuki/nodejs-api-table. It can be conveniently viewed in a web browser.

```
$  node ./scripts/find-supported-version-from-docs.js fs "12.0.0"
╔══════════════════════════════════════════════╤═══════════════════╗
║ API                                          │ Added             ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fsPromises.lutimes(path, atime, mtime)       │ v14.5.0,v12.19.0  ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fsPromises.opendir(path[, options])          │ v12.12.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fsPromises.rm(path[, options])               │ v14.14.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fsPromises.watch(filename[, options])        │ v15.9.0           ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.lutimes(path, atime, mtime, callback)     │ v14.5.0,v12.19.0  ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.opendir(path[, options], callback)        │ v12.12.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.read(fd, [options,] callback)             │ v13.11.0,v12.17.0 ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.readv(fd, buffers[, position], callback)  │ v13.13.0,v12.17.0 ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.rm(path[, options], callback)             │ v14.14.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.writev(fd, buffers[, position], callback) │ v12.9.0           ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.lutimesSync(path, atime, mtime)           │ v14.5.0,v12.19.0  ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.opendirSync(path[, options])              │ v12.12.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.readSync(fd, buffer, [options])           │ v13.13.0,v12.17.0 ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.readvSync(fd, buffers[, position])        │ v13.13.0,v12.17.0 ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.rmSync(path[, options])                   │ v14.14.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ fs.writevSync(fd, buffers[, position])       │ v12.9.0           ║
╟──────────────────────────────────────────────┼───────────────────╢
║ Class: fs.Dir                                │ v12.12.0          ║
╟──────────────────────────────────────────────┼───────────────────╢
║ Class: fs.StatWatcher                        │ v14.3.0,v12.20.0  ║
╚══════════════════════════════════════════════╧═══════════════════╝
```

## `transform-add-new-node-builtin-feature.js`

[jscodeshift](https://github.com/facebook/jscodeshift) transform script. Add new feature to lib/rules/no-unsupported-features/node-builtins.js.

```sh
$ jscodeshift -t ./scripts/transform-add-new-node-builtin-feature.js $ESLINT_PLUGIN_NODE_PATH/lib/rules/no-unsupported-features/node-builtins.js --module=crypto --api=diffieHellman --supported=v13.9.0 --backported=12.17.0
```

This script may break your coding style, so please fix it manually.
