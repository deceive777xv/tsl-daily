# Lens Flare Example — 验证记录

日期：2026-09-13。基于 `main@3aac5320f0298e5ca3aa8adbd62d75c3399f2872`，分支 `codex/lens-flare-example`。用户对相同标题、作者、ID（4sX3Rs）及本地噪声替换范围明确回复“批准”。仅制作一个案例 PR，合并仍为最终发布审批。

## 质量与浏览器

- `npm run quality` 通过：Prettier、ESLint、9 案例契约、Vitest 5/5、Astro check 0 errors / 0 warnings、11 个静态页面生产构建。已有大 chunk 提示和未提交的旧 `lava-extra.cjs` 未用变量 hint 不影响构建。
- `npm run test:browser`：**34/34 通过**，桌面 Chromium 与 Pixel 7 模拟。新增案例覆盖 WebGL2、Unlicense 来源、原作链接、无外部请求、五参数、鬼影像素变化与默认恢复、桌面拖动/悬停、受控 visibilitychange；归档第一项的减少动态效果检查覆盖本案例。
- 首轮 33/34：旧 Star Nest 拖动检查在悬停基准比较失败。统一基准与后续画面的 medium 画质和显式重绘后，全套通过。未修改 Star Nest 或共用运行时代码。
- 独立生产 smoke：1440 × 900 与 412 × 915，各验证默认 WebGPU 和强制 WebGL2；无页面/控制台错误、无外部素材请求、无横向溢出。检查默认值、五参数全部最小/最大组合，移动参数面板可用。
- 额外逐项比较五参数：先播放 800 ms 再暂停并稳定，每项独立改到最大值再恢复，两个后端共 **10/10** 有像素变化且恢复在严格阈值内。WebGPU 五项逐字节一致；本次 WebGL2 鬼影/色散还原各有 3 个颜色通道相差 1 字节，其余一致。此前一次速度还原有 7 个通道相差 1 字节，因此不声称所有还原逐字节一致。阈值：最大差 ≤ 1/255，RGBA 字节平均绝对差 < 0.001。原始数值见 `browser-evidence.json`。正式默认恢复测试仍保留精确相等断言。
- 媒体生成前的开发预览有预期海报 404；最终生产检查无资源错误。

## 隐藏暂停的边界

- 真实 headed Chromium 窗口最小化后仍报告 `document.hidden=false`，没有真实 visibilitychange，GPU 提交从 84 增至 92。因此**真实后台隐藏路径未验证**，不能把本机自动化结果当作实际隐藏成功。
- 受控 `document.hidden=true` + `visibilitychange`，稳定后 800 ms GPUQueue 提交计数 **9 → 9**，恢复后 **143**；按钮状态同步。证明暂停分支停止提交，不仅是文案变化。
- 这延续已有运行时的验证边界，没有修改产品 Page Visibility 逻辑来迎合测试。合并审阅时应关注真实浏览器后台暂停；实体手机未测试。

## 本机性能

AMD Ryzen 9 7950X3D / NVIDIA GeForce RTX 4080 SUPER；Chromium **153.0.8010.37**。WebGPU adapter `nvidia / lovelace`，非 fallback。

各生产配置独立预热 3 秒、采样 120 个 requestAnimationFrame 间隔：桌面/移动模拟两后端平均均为 **6.06 ms**；桌面 WebGPU p95 **6.2 ms**，其余 **6.1 ms**。桌面有效 DPR 1，移动有效 DPR 1.5（618 × 1373 缓冲区）。45 ms/帧受控主线程负载后 DPR 从 **1 降至 0.8**。原始摘要见 `performance.json`。

这是浏览器帧调度间隔，不是 GPU timestamp 或单帧 Shader 执行耗时。移动配置为桌面 GPU 上的触摸视口与 deviceScaleFactor 2.625 模拟，不代表真实手机。

## 图像、视频和来源

- 使用字节保真的原始 GLSL、相同本地生成噪声、1440 × 900、`iTime=0.7` 绘制参考图。TSL 保留默认横屏构图，主要鬼影与光源位置一致。原始 GLSL 与 TSL WebGL2 的 RGB 字节平均绝对差分别为 0.01352 / 0.01212 / 0.01021；WebGL2 与 WebGPU 为 0.00032 / 0.00027 / 0.00026。不是与未知原始噪声图的逐像素比较。
- 目视检查最终海报、视频中间帧、原作参考图、移动参数面板、桌面 WebGL2 最大参数组合。无黑屏、纯底色或整体过曝；主光源有意保留白色高光，全部参数调高时鬼影高光增大，属于探索范围。
- WebP：1440 × 900，由真实 WebGPU 画布截图编码，质量 90。
- WebM：VP8，1440 × 900，25 fps，**7.44 秒**，无音轨，3,283,999 字节。MediaRecorder 录制实际画布，再以末尾 0.5 秒和开头片段交叉淡化形成短循环。原始双正弦轨迹没有这个短周期，接缝可能有短暂重影，不声称原运动精确周期。
- 未下载、请求或托管原作噪声图片。`mirror.json` 的原始输入路径只是证据文本。完整哈希、来源、批准记录与修改清单见 `LICENSE.md`，代码许可全文见 `UNLICENSE.txt`。
- 本机可复核脚本与截图：`output/playwright/flare-*.cjs`、`output/playwright/lens-flare-example-*`（未提交工作文件）。提交中保留最终媒体、源码、文章、证据与本记录；CI artifact 提供完整站点构建用于审阅，不提前公开部署案例。
