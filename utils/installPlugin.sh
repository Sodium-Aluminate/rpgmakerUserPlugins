#!/usr/bin/env bash

set -euo pipefail


target_dir="${1-}"
if [ -z "$target_dir" ]; then
	printf '%s\n' "expected install dist (or path of Game.exe)" >&2
	exit 1
fi

target_dir="$(realpath "$target_dir")"

if [ -d "$target_dir" ]; then
	base="$target_dir"
else
	base="$(dirname "$target_dir")"
fi

if [ -d "$base/www" ] && [ -d "$base/www/js" ] && [ ! -d "$base/js" ]; then
	base="$base/www" # rmmv
fi

plugin_js_file_path="$base"/js/plugins.js

if [ ! -f "$plugin_js_file_path" ]; then
	printf 'can'\''t find "js/plugins.js" in %s\n' "$base" >&2
	exit 1
fi


printf 'found plugins.js in: %s\n' "$plugin_js_file_path"

if ! command -v bwrap >/dev/null 2>&1; then
  printf '%s\n' "need bwrap to create a sandbox." >&2
  exit 1
fi


scriptDir="$(dirname "$0")"
buildDir="$(realpath "$scriptDir"/../build)"
scriptDir="$(realpath "$scriptDir")"

args=(
	--dev-bind / /
	--bind /tmp/bwrap /tmp
	--tmpfs /var/tmp --tmpfs $HOME --tmpfs /run/media --tmpfs /mnt

	--unshare-user --unshare-ipc --unshare-pid --unshare-uts --unshare-cgroup --unshare-net
	--hostname bwrap
	--die-with-parent
	
	--ro-bind "$buildDir" "$buildDir"
	--ro-bind "$scriptDir" "$scriptDir"
	--bind "$plugin_js_file_path" "$plugin_js_file_path"
)

echo -- "${args[@]}"
bwrap "${args[@]}" node "$scriptDir"/installPlugin.js "$plugin_js_file_path"

cp "$buildDir"/*.js "$base"/js/plugins/
