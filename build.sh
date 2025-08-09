#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

tsc

plugins=""
for file in build/*.js; do
  [ -e "$file" ] || continue
  name="${file##*/}"
  name="${name%.js}"
  plugins+="$name"$'\n'
done

cat > manuallyInstall.js <<EOF
//__RPGMAKER_USER_PLUGIN_REGISTER_START__
// 安装方式：将此 js 文件（不是 sh 文件）复制到<游戏文件夹>/js/plugins.js 的结尾然后将 build 文件夹内的所有 js 复制到 js/plugins/ 文件夹
// install guide: append this js file(not the sh file) to end of <game dir>/js/plugins.js, then copy all js file in build to <game dir>/js/plugins.
;(()=>{
	const plugins = \`
$plugins\`.trim().split("\n");
	const libPlugins = [];
	const normalPlugins = [];
	for (const name of plugins) (name.startsWith("lib") ? libPlugins : normalPlugins).push(name);
	[libPlugins, normalPlugins].flat().forEach(name => \$plugins.push({name, status: true, description: "", parameters: {}}))
})();
//__RPGMAKER_USER_PLUGIN_REGISTER_END__
EOF
