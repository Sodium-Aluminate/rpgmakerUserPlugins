# RPG Maker User Plugins
铝箔的 RMMV/MZ 实用小插件集合。

# 安装
## 依赖
编译需要：`tsc`(可能在 `typescript` 包里);

自动安装脚本需要：`bwrap` 和 `nodejs`;

~~手动安装需要[手](https://zh.wikipedia.org/wiki/手)~~。

插件本身需要被安装游戏的 nwjs 要足够新。
- 只要你的游戏没有使用奇怪的混淆插件（如[咸鱼喵喵](https://store.steampowered.com/app/1478160/Nyaruru_Fishy_Fight)这种坏例子），你可以手动更新游戏的 nwjs版本。
  - 下载一个 [nwjs-sdk](https://nwjs.io/)，并全部扔到游戏文件夹（替换已有文件），将 `nw.exe`（或者 `nw`，取决于操作系统） 作为游戏启动入口即可（旧的`Game.exe`其实也是`nw.exe`）。
- 你也可以通过在编译前下调 `tsconfig.json` 的 `target` 来起到兼容的作用。

## 编译
执行 ./build.sh。
- release 有编译好的，如果你犯懒的话。

## 自动安装
使用 `./utils/installPlugin.sh <游戏目录>` 即可
- 确保你的包管理器装了 `bwrap` 和 `nodejs` 以及内核能 user 态 nspawn。

## 手动安装
1. 将 build 下的所有 js 文件复制到 `<游戏根目录>/js/plugins/` 下。
2. 将 `manuallyInstall.js` 内的所有内容复制到 `<游戏根目录>/js/plugins.js` 的末尾。

# 插件描述
## lib*
给别的插件当库的。

## caseInsensitiveLoading
由 rpg-core(指 rpgmaker mv/mz 原版的 js) 加载的文件无视大小写错误。

- 仅在非 Windows 下生效，因为 NTFS 也无视大小写。
- 一般大小写错误都是在 Windows 写游戏的作者干的因为他们测不出来这个 bug。

## decryptMediaApi
提供了一个解密原版加密媒体（图片和音频）的函数。

- `decryptFiles` / `decryptAllFiles`

前者不带参数显示所有的选项

后者是一个 alias，将：
- 解密当前文件夹所有文件
- 删除加密文件
- 将游戏 system.json 配置为未加密，这样游戏将直接读取未加密文件
- 在游戏目录放一个 .nomedia 空文件来防止 Android 将这些图片扫到你的相册。

## FixDrawTextConsoleWarning
`Window_Base.prototype.flushTextState` 给 `Bitmap.prototype.drawText` 传了个 `undefined` 当 align，这个未定义行为会导致在控制台报错，一旦开控制台会带来大量资源消耗（因为这个函数经常被逐帧调用）
我们根据 mozilla 的文档提前将其错误值改为默认值来避免此问题。

## MessageToConsole
游戏对话打印到 console。这样当你通过按住 ctrl 跳过对话时，不必担心对话太快漏掉什么。
- 因为不按 ctrl 的对话一般来说对我而言太慢了，读起来有点折磨
- 另外一些差劲的游戏设计可能没有任务系统，一旦你忘记任务细节就会卡关，此时翻看对话也很有帮助。

## NativeLoadFile
为了兼容性和代码简便，rmmv/mz 无论如何都使用 XMLHttpRequest/fetch 来读取文件，这在 nwjs 内将调用 nwjs 的 chromium 层来读取。

但在高 CPU 占用时，chromium 将延缓所有此类"网络"活动，导致游戏资源加载缓慢。

因此我们将 XMLHttpRequest/fetch 用 fs 做了简单重现，来提高大量文件加载时的相应速度
- 当然，如果找不到文件或者使用了非 rpg-core 的接口，将重新调用原版的 XMLHttpRequest/fetch

实际上，在低cpu占用时，此插件效果并不明显，但在屎山游戏代码导致高 cpu 占用时，加载速度将有明显提升。
- 该卡还是卡...开火焰图找卡顿元凶才是重点...

## openConsole
开游戏的时候自动开控制台(dev tools)。
- 浏览器里js层开不了控制台，仅在 nwjs 环境有效。
  - 没错，你可以通过浏览器打开 index.html，不过无法存档且部分一些游戏引入的第三方插件会加载 node 库导致游戏崩溃。
    - 使用 http server 替代 `file://` 可以存档，但是这么做属实有点多此一举。
- 至于 joiplay？那玩意儿好像没控制台？。

## saveFileSkipCompress
想编辑存档？但是存档被压缩了打不开？

现在存档改成明文存储了，自行探索存档吧。

（明文存储的存档和全局存档无法被原版游戏读取，存档前按住 shift 来保存一个原版的存档。）