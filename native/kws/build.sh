#!/usr/bin/env bash
# 编译 sherpa-onnx 关键词识别（KWS）的 WebAssembly 版本，供烹饪模式语音指令使用。
# 由 CNB 在推送 kws-* 标签时运行（见 .cnb.yml），产物放在 native/kws/dist/，再上传到 COS。
set -euo pipefail

SHERPA_VERSION="v2.0.0"
MODEL="sherpa-onnx-kws-zipformer-wenetspeech-3.3M-2024-01-01-mobile"

HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$HERE/.build"
DIST="$HERE/dist"
rm -rf "$WORK" "$DIST"
mkdir -p "$WORK" "$DIST"

if ! command -v cmake >/dev/null || ! command -v bzip2 >/dev/null; then
  apt-get update -qq && apt-get install -y -qq cmake bzip2 git curl >/dev/null
fi
emcc --version | head -1

cd "$WORK"
git clone --depth 1 --branch "$SHERPA_VERSION" https://github.com/k2-fsa/sherpa-onnx.git
curl -fsSL -o model.tar.bz2 "https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/$MODEL.tar.bz2"
tar xjf model.tar.bz2

# 只打包 int8 模型，体积约 4.7MB；文件名在前端的 createKws 配置里对应
ASSETS="sherpa-onnx/wasm/kws/assets"
cp "$MODEL/encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx" "$ASSETS/"
cp "$MODEL/decoder-epoch-12-avg-2-chunk-16-left-64.onnx" "$ASSETS/"
cp "$MODEL/joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx" "$ASSETS/"
cp "$MODEL/tokens.txt" "$ASSETS/"
rm -f "$ASSETS/README.md"
ls -lh "$ASSETS"

cd sherpa-onnx
sed -i "s/make -j8/make -j$(nproc)/" build-wasm-simd-kws.sh
./build-wasm-simd-kws.sh

OUT="build-wasm-simd-kws/install/bin/wasm"
cp "$OUT/sherpa-onnx-wasm-kws-main.js" "$OUT/sherpa-onnx-wasm-kws-main.wasm" "$OUT/sherpa-onnx-wasm-kws-main.data" "$OUT/sherpa-onnx-kws.js" "$DIST/"
cp LICENSE "$DIST/LICENSE-sherpa-onnx.txt"
cd "$DIST"
sha256sum ./* > SHA256SUMS.txt
ls -lh "$DIST"
