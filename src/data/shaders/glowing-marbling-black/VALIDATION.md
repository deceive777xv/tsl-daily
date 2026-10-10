# 银纹流墨 — 验证记录

日期：2026-10-10。用户在披露历史镜像默认许可后，对 **glowingMarblingBlack — nasana（WtdXR8）** 明确回复“批准”。实现从最新 main `e03f05394cc6c8de8f42d2abc7797f057367ffcc` 开始；一个独立 PR，合并仍由用户决定。

## 真实画布与媒体

- Chromium **154.0.8037.99**，实际 WebGPU 与强制 WebGL2 成功启动；非后备 adapter 为 `nvidia / lovelace`，`fallback=false`。
- 海报来自默认 TSL WebGPU 画布，暂停并恢复默认参数，源时间第 7 秒，**1440×900**，WebP quality 90，**69792 bytes**。同尺寸 WebGL2 画布另作对照。
- 同一真实画布用 `captureStream(25)` / MediaRecorder 录制无声动画，速度 0.6；取前 3.76 秒，缩到 960×600，再接倒放。最终 **VP9、25 fps、188 帧、7.52 秒、1300120 bytes**，无音轨；CRF 35。往返仅用于闭合媒体预览，实时动画向前运行。
- 已逐张查看原始 GLSL、WebGPU / WebGL2 默认画布、导出的 WebP、移动画布与参数面板，以及短片中点和末帧。银白亮纹与暗部褶皱清晰可辨，没有只显示底色、黑屏、整幅过曝或明显偏离原作思路。亮纹局部截白来自原作倒数亮度；没有新增 bloom。
- 最初尚未导出媒体时的海报 404 已在媒体导出与重建后消除；最终浏览器证据没有外部请求、pageerror 或 console error。
- 素材：`public/previews/glowing-marbling-black.webp` 与 `public/previews/glowing-marbling-black.webm`。

## 原作与后端对照

`reference-comparison.json`：同一 Chromium、1440×900、源时间 7，未经改动的完整唯一 Image pass。浏览器实际使用的 GLSL 与镜像解码字符串相同，`gl.getError()` 为 0，错误与警告均为空。

- 原作 GLSL → 默认 TSL WebGL2：RGB 字节平均绝对差 **0.009275/255**，最大 **1/255**。
- WebGPU → WebGL2：平均 **0.0001844/255**，最大 **1/255**。
- 两组超过 10 字节的通道比例均为 0；构图、灰度和细纹经视觉对照吻合。检查要求平均差小于 1/255，结合人工视觉审阅；不宣称浮点运算或逐像素完全一致。
- 默认保留九层、幅度 0.6、频率倍率 1、亮度分子 0.1、先更新 x 后更新 y。源时间 7 是初始相位选择；分母下限仅保护原本已经截白的区域。

## 本机性能基线

Windows，AMD Ryzen 9 7950X3D，NVIDIA GeForce RTX 4080 SUPER。实际非后备 WebGPU adapter 已确认。每组默认自动画质暖机 3 秒，采集 120 个 RAF 间隔；这是**浏览器调度观察，不是 GPU 时间戳或真实手机性能**。细节见 `performance.json`。

| 视口             | 实际后端 | 绘制尺寸 | 有效 DPR | 平均 / P95    |
| ---------------- | -------- | -------- | -------- | ------------- |
| 桌面 1440×900    | WebGPU   | 1440×900 | 1        | 6.06 / 6.1 ms |
| 桌面 1440×900    | WebGL2   | 1440×900 | 1        | 6.06 / 6.1 ms |
| 移动模拟 412×915 | WebGPU   | 618×1372 | 1.5      | 6.06 / 6.2 ms |
| 移动模拟 412×915 | WebGL2   | 618×1372 | 1.5      | 6.06 / 6.2 ms |

四组横向溢出为 0，无外部请求。主线程受控增加每帧 45 ms 忙等待、持续 130 帧后，自动 DPR 从 **1 降到 0.8**；这是调整策略的响应验证，不是 shader 自然负载测量。真实手机未测试。

## 减少动态与隐藏暂停

`browser-evidence.json` 保留两类 visibility 结果：

- `prefers-reduced-motion: reduce` 初始 backend 为空，静态海报已加载；主动播放后实际启动 WebGPU，按钮为“暂停动画”。
- 受控隐藏事件：覆盖 `document.hidden=true` 并派发 `visibilitychange`，800 ms 内 GPUQueue 提交计数 **472 → 472**；还原后增至 **608**，按钮与提交均恢复。
- **原生后台隐藏未验证**：自动化切换到另一标签后仍报告 `document.hidden=false`。提交计数短暂停住，但缺少真实隐藏状态，不能证明 Page Visibility 暂停。受控事件只验证共享运行时的暂停路径；原生浏览器后台操作仍需另行补验。

## 质量与回归

- `npm run quality` 通过：格式、ESLint、**20 个案例**契约、**5 个单元测试**、Astro 类型检查与生产构建。Astro **0 errors / 0 warnings**；未提交的本地诊断脚本产生 12 个 hints，构建保留既有共享大块提示。
- 构建结束后完整 `npm run test:browser -- --config output/playwright/marbling.config.ts --workers=4`：**86 passed / 2 skipped / 0 failed**，共 88 项，约 1.2 分钟。临时配置只将生产预览端口改成 18772、指定忽略目录内的输出路径；未提交。两项跳过为既有 Pretty Hip 固定桌面像素宽度策略。
- 新案例 **4/4 通过**：桌面、移动 × 真实 WebGL2 / WebGPU。精确来源与历史许可说明、非空灰度画面、五个参数均改变像素；恢复最大字节差 ≤2/255、平均差 <0.001，没有外部请求、console error 或横向溢出。本机非后备 WebGPU smoke、四组性能、减少动态、DPR 和受控隐藏暂停另行验证，不能用 CI 缺少 adapter 时的跳过替代。
- 最初 16 worker 回归中，新案例的移动灰度检测包含了截图向外取整的一圈页面底色：精确 Pixel 7 412×839 / DPR 2.625 复现显示最右列 `(1,2,3)`，整图色差 2/255、内部色差 0。修正为排除三像素边缘，灰度容差仍为 1/255。另有两项既有测试得到空 WebGL 采样，降低本机并发后完整复查；没有改动其测试或运行时。
- PR 正文记录相同提交的远端 Quality 最终结论。远端若没有 WebGPU adapter，明确记录跳过。

## 来源字节与许可

- 固定镜像 `mirror.json`：1298 bytes，SHA-256 **0F02499A5BC0CCF79F1C50A02C88B1180117E44C3CC355D4471052AD463F5E49**。
- 完整解码 `original.glsl`：SHA-256 **658F67ACBEF17C22948B0DF0913C2242EE7D63F2D43FCA925CDB24EF0B974A2A**，保留全部 10 行与空白。
- `.gitattributes` 禁止两份证据的换行转换；暂存字节与获批镜像及其完整解码 pass 逐一比较。
- 固定提交、2024-10-05 初抓 / 2025-05-29 镜像提交 / 2026-10-10 取回审阅、未知指标采样日期、历史 **221 likes / 65839 views**、全通道检查、当前页面 HTTP 403 和批准记录见 `LICENSE.md`。

许可按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断，非显式源码许可头，非当前页面核验。原作与 TSL 改编 CC BY-NC-SA 3.0；原创中文赏析与生成媒体 CC BY-NC-SA 4.0；框架 MIT；站点永久非商业。候选批准只用于这个独立 PR，合并与发布仍由用户审批。
