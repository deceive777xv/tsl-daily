# The Universe Within 验证记录

日期：2026-09-08。案例从最新 `origin/main` 的 `265f3882e4963a97be92637c8dad9e9c62daf3c9` 开始制作，候选 `The Universe Within（lscczl）` 已由用户同日在本任务明确回复“批准”。

## 自动检查

- `npm run quality`：通过。Prettier、ESLint、6 案例契约、Vitest 5/5、Astro check 0 errors / 0 warnings、8 页面生产构建。
- `npm run test:browser`：20/20 通过，桌面 Chromium 与 Pixel 7 模拟视口。
- 新案例覆盖：WebGL2 后备启动、显式 CC BY-NC-SA 3.0 与原作链接、5 个参数、暂停状态下改变密度产生画布像素变化、恢复默认参数后像素恢复一致、没有音频/视频播放元素。
- 通用覆盖：首页与归档无横向溢出，减少动态效果先显示静态替身、手动播放启动，Star Nest 拖动回归，各相关案例的 visibilitychange 暂停/恢复。
- 隐藏暂停检查使用可控的 `document.hidden` 和 `visibilitychange`，没有声称真实后台标签页切换路径已验证。
- 新增原始 JSON 被格式工具排除并设置 `-text`，原始 GLSL 保留上游空白，不修改证据文件来通过格式检查。
- 沙箱内单独 `npm run check` 曾遇到 Astro 模块加载 `require is not defined`；授权在沙箱外运行完整 `npm run quality` 后通过，未因此修改应用依赖或配置。

## 浏览器与视觉

生产构建由本地预览服务提供。另用 Playwright CLI 驱动 Chromium **149.0.7827.22**，检查以下四种组合；全部显示正确后端，无页面异常、控制台错误、横向溢出或外部 HTTP 请求：

| 视口                | 后端   | 画布       | 有效 DPR |
| ------------------- | ------ | ---------- | -------- |
| 1440 × 900          | WebGPU | 1440 × 900 | 1.0      |
| 1440 × 900          | WebGL2 | 1440 × 900 | 1.0      |
| 412 × 915，触屏模拟 | WebGPU | 618 × 1372 | 1.5      |
| 412 × 915，触屏模拟 | WebGL2 | 618 × 1372 | 1.5      |

已检查桌面默认帧、移动参数面板、移动最大值组合、海报及视频中间帧，画面有完整星网结构，不是纯底色、黑屏或整体过曝。各组合还操作了所有参数的最小值与最大值，并恢复默认值。

同一浏览器中额外编译原始 GLSL 对照画面：`iTime=30`、居中 `iMouse`，仅在临时对照程序中把唯一 FFT 读取替换为常量 `0.15`，不修改归档。与两个 TSL 后端的默认帧逐图检查，构图和主要辉光结构一致；没有声称逐像素严格相同，零长度边与极亮中心已按许可证档案说明修正。

## 预览媒体

- 海报：真实 WebGPU 画布截图转换为 WebP，1440 × 900，质量 88。
- 短循环：浏览器 `canvas.captureStream(25)` + MediaRecorder 录制，FFmpeg 裁切并将末尾半秒交叉淡化到开头；VP8、1440 × 900、25 fps、7.04 秒。
- ffprobe 验证仅有一个视频流，**没有音轨**。不包含原作音乐文件、外部音源请求或音乐播放器。
- 已查看最终 WebP 和 WebM 解码中间帧。预览淡化只影响媒体，不改变实时 Shader。

## 本机性能基线

硬件：AMD Ryzen 9 7950X3D，NVIDIA GeForce RTX 4080 SUPER（另有 AMD 集成显卡）。实测 WebGPU adapter 为 `nvidia / lovelace`，`isFallbackAdapter=false`。浏览器 Chromium 149.0.7827.22。生产构建预热 3 秒，记录 120 个 `requestAnimationFrame` 间隔。

| 视口       | 后端   | 平均间隔 | p95     |
| ---------- | ------ | -------- | ------- |
| 1440 × 900 | WebGPU | 6.06 ms  | 6.20 ms |
| 1440 × 900 | WebGL2 | 6.06 ms  | 6.10 ms |
| 412 × 915  | WebGPU | 6.06 ms  | 6.20 ms |
| 412 × 915  | WebGL2 | 6.06 ms  | 6.10 ms |

这是自动化浏览器的帧调度间隔，**不是 GPU 执行耗时**。移动视口仍使用同一台桌面硬件，不能证明实体手机达到 30 fps。与其他案例不同浏览器版本的历史值不作严格性能对比。

在生产构建桌面 WebGPU 页面中注入约 45 ms/帧的主线程负载，持续 130 帧，实际画布有效 DPR 从 **1.0 降至 0.8**，自适应降级有效。该测试验证调度反馈路径，不是在模拟特定移动 GPU。

## 审批边界

案例仅进入独立 PR，未合并、未触发本案例的 Pages 发布。Quality CI 上传完整 `dist` 预览与浏览器测试产物供下载审阅。原始镜像日期、许可证与音乐排除范围见 LICENSE.md；当前 Shadertoy 源码仍未独立复核。
