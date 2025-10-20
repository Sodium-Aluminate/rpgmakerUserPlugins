# RPG Maker User Plugins
A collection of useful plugins for RMMV/MZ. | [中文](README_zh.md)

# Installation
## Dependencies
To compile: `tsc` (likely comes with the `typescript` package);

For the auto-installation script: `bwrap` and `nodejs`;

~~Manual installation requires a [man](https://en.wikipedia.org/wiki/Man)~~.

The plugins themselves require the game's NW.js to be sufficiently up-to-date.
- As long as your game doesn't use weird obfuscation plugins (like the bad example [Nyaruru Fishy Fight](https://store.steampowered.com/app/1478160/Nyaruru_Fishy_Fight)), you can manually update the NW.js version of the game.
  - Download a [nwjs-sdk](https://nwjs.io/), replace all files in your game folder with it, and launch the game via `nw.exe` (or `nw` depending on your OS). The old `Game.exe` is basically `nw.exe`.
- Alternatively, you can lower the `target` in your `tsconfig.json` before compiling to improve compatibility.

## Compile
Run `./build.sh`.
- Releases with precompiled files are available if you want to skip compiling.

## Auto Install
Run `./utils/installPlugin.sh <game directory>`
- Make sure your package manager has `bwrap` and `nodejs`, and that your kernel supports user-mode nspawn.

## Manual Install
1. Copy all JS files from `build` to `<game root>/js/plugins/`.
2. Append the entire content of `manuallyInstall.js` to the end of `<game root>/js/plugins.js`.

# Plugin Descriptions
## lib*
Libraries used by other plugins.

## caseInsensitiveLoading
Makes file loading via rpg-core (the official RMMV/MZ js) case-insensitive.

- Only effective on non-Windows systems, since NTFS is case-insensitive anyway.
- Most case errors come from authors developing on Windows who can't detect these bugs.

## decryptMediaApi
Provides functions to decrypt original encrypted media (images and audio).

- `decryptFiles` / `decryptAllFiles`

use `decryptFiles()` without arguments shows all options.

`decryptAllFiles` is an alias that:
- decrypts all files in the current folder,
- deletes the encrypted files,
- sets the game's `system.json` to unencrypted so the game reads the unencrypted files directly,
- places a `.nomedia` empty file in the game folder to prevent Android from scanning these images into your gallery.

## FixDrawTextConsoleWarning
`Window_Base.prototype.flushTextState` passes an `undefined` align parameter to `Bitmap.prototype.drawText`, which causes console errors and heavy resource usage if the console is open (because the game sometimes will call this function every frame).
This patch replaces the `undefined` with the default align value to avoid this issue.

## MessageToConsole
Prints game dialogue to the console. This way, when you hold Ctrl to skip dialogue, you don't have to worry about missing anything due to the dialogue moving too fast.
- cuz dialogue without holding Ctrl is generally too slow and a bit painful to read for me.
- Also, some poorly designed games may lack a quest system, and you might get stuck if you forget quest details; reviewing dialogue in the console can be very helpful in such cases.

## NativeLoadFile
RMMV/MZ always uses XMLHttpRequest/fetch to load files, which calls Chromium's layer in NW.js .

Under high CPU load, Chromium delays all such "network" activity, causing slow resource loading.

This plugin reimplements XMLHttpRequest/fetch with `fs` calls to improve responsiveness when loading many files.
- If a file isn't found or called any APIs not used by rpg-core, it will falls back to the original XMLHttpRequest/fetch.

## openConsole
Automatically opens the console (dev tools) when the game starts.
- JavaScript in browsers cannot open the console; this only works in the NW.js environment.
  - yes, you can open `index.html` in your browser, but you cannot save the game, and some third-party plugins that load Node libraries may cause the game to crash.
    - Using an HTTP server instead of `file://` allows saving, but honestly, that's a bit overkill.
- As for JoiPlay? It apparently doesn't have a console.

## saveFileSkipCompress
will not compress the save file. 

the new save file can be read by human but can't be read by vanilla rpgmaker. if you wants to remove this plugin, hold `Shift` before save to create a save file that can be read by vanilla rpgmaker.