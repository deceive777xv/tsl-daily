# 孔隙方城 — 验证记录

日期：2026-10-09。候选 **Menger Sponge — iq（4sX3Rn）**，作者 Inigo Quilez，用户在披露旧镜像的显式 MIT 证据后明确回复“批准”。实现从最新 main `7f944431738f0a43e26bba6a470727509dcab709` 开始；一个独立 PR，合并仍由用户决定。

## 真实画布与媒体

- Chromium 151.0.7922.34，实际 WebGPU 与强制 WebGL2 均成功启动；最终画布无 shader 编译错误、pageerror、控制台 error 或 warning。
- 海报来自默认 TSL WebGPU 画布，暂停并恢复默认参数，源时间第 2 秒，1440×900，WebP quality 90，208286 bytes。另行捕获同尺寸 WebGL2 画布作对照。
- 同一真实画布用 `captureStream(25)` / MediaRecorder 录制无声动画，速度 0.6；取前 3.76 秒，缩到 960×600，再接倒放。最终 VP9、25 fps、188 帧、7.52 秒、6381793 bytes，无音轨；CRF 35。往返仅用于闭合媒体预览，实时动画向前运行。
- 逐张查看原始 GLSL、两个后端默认海报、桌面和移动画布、移动参数面板，以及循环中点和末帧。金色方块、递归孔洞、紫红色内壁、深处阴影与变形结构可辨认；没有只显示底色、黑屏、整幅过曝或明显偏离原作构造。移动竖屏沿用原作按视口高度定义的相机，横向部分会裁切。
- 最初预览尚无媒体文件时发生的 404 已在导出与重建后消除；最终严格浏览器验证没有控制台错误或外部请求。
- 素材：`public/previews/menger-sponge.webp`、`public/previews/menger-sponge.webm`。原作 `mainVR` 完整归档，但本站只实现普通二维视口。

## 原作与后端对照

`reference-comparison.json`：同一 Chromium、1440×900、源时间 2、iMouse=0，未经改动的完整 Image pass 使用原作 `HW_PERFORMANCE=0` / AA1 分支。原始 `gl.getError()` 为 0，错误和警告均为空。

- 原作 GLSL → 默认 TSL WebGL2：RGB 字节平均绝对差 **0.03612/255**，最大 **148/255**，超过 10 字节的通道约 **0.0462%**。
- WebGPU → WebGL2：平均 **0.03352/255**，最大 **169/255**，超过 10 字节的通道约 **0.0724%**。
- 构图、孔洞与色彩经视觉对照吻合。少数孔洞边缘对浮点运算及原生编译敏感，不宣称逐像素一致。整体均值以 RGB 范围 3.5% 作结构偏差检查，并结合人工视觉检查；这与参数恢复容差不同。
- 实时实现保留 AA1；没有启用原作高性能分支的 2×2 超采样。高画质增加绘制分辨率，不等价于每像素四次采样。
- 原作的立方体距离写法在外部棱角处可能低估欧氏距离；距离场切割、变形、有限 64 步与收敛阈值保留原数学，但并非精确交点或物理光照证明。

## 本机性能基线

Windows，AMD Ryzen 9 7950X3D，NVIDIA GeForce RTX 4080 SUPER。实际 WebGPU adapter 为 `nvidia / lovelace`，`fallback=false`；详细记录见 `performance.json`。

每组默认自动画质暖机 3 秒，采集 120 个 RAF 间隔。这是浏览器调度基线，**不是 GPU 时间戳或真实手机性能**。

| 视口             | 实际后端 | 绘制尺寸 | 有效 DPR | 平均 / P95    |
| ---------------- | -------- | -------- | -------- | ------------- |
| 桌面 1440×900    | WebGPU   | 1440×900 | 1        | 6.06 / 6.1 ms |
| 桌面 1440×900    | WebGL2   | 1440×900 | 1        | 6.06 / 6.2 ms |
| 移动模拟 412×915 | WebGPU   | 618×1372 | 1.5      | 6.06 / 6.2 ms |
| 移动模拟 412×915 | WebGL2   | 618×1372 | 1.5      | 6.06 / 6.2 ms |

四组横向溢出为 0，无外部请求。主线程受控增加每帧 45 ms 忙等待、持续 130 帧后，自动 DPR 从 1 降到 0.8；这是调整策略的响应验证，不是 shader 自然负载测量。真实手机未测试。

## 减少动态与隐藏暂停

`browser-evidence.json` 保留两类 visibility 结果：

- `prefers-reduced-motion: reduce` 初始 backend 为空，静态海报确实加载；主动播放后实际启动 WebGPU，按钮为“暂停动画”。
- 受控隐藏事件：覆盖 `document.hidden=true` 并派发 `visibilitychange`，800 ms 内 GPUQueue 提交计数 **478 → 478**；还原后增至 **616**，按钮与提交均恢复。
- **原生后台隐藏未验证**：自动化浏览器切换到另一标签后仍报告 `document.hidden=false`。提交计数曾短暂停住，但缺少真实隐藏状态，不能据此证明 Page Visibility 暂停。没有把受控事件当作原生后台证据；这一环境限制与已有案例一致，人工浏览器切后台仍需补验。

## 质量与回归

- `npm run quality` 通过：格式、ESLint、19 个案例契约、5 个单元测试、Astro 类型检查和生产构建。Astro 0 errors / 0 warnings；未提交的本地诊断脚本产生 8 个 hints，构建保留既有共享大块提示。
- 构建结束后执行完整 `npm run test:browser -- --config .menger-playwright.config.ts`：**82 passed / 2 skipped / 0 failed**，共 84 项，42.5 秒。本机临时配置只把生产预览端口改成 18771；未提交。两项跳过是既有 Pretty Hip 移动策略。
- 新案例 **4/4 通过**：桌面、移动 × 实际 WebGPU、WebGL2。来源卡、精确原作链接、MIT 声明、默认画面的色彩/亮度范围、五个参数均改变像素；恢复最大字节差 ≤2/255、平均差 <0.001，没有外部请求、控制台错误或横向溢出。
- 本机非后备 WebGPU smoke、四组性能、减少动态、DPR 退化响应及受控隐藏暂停另行验证，不用远端无 adapter 时的跳过替代这些证据。
- PR 正文记录同一提交的远端 Quality 最终结论。若 CI 因缺少 WebGPU adapter 而跳过，明确列为跳过；不声称远端 WebGPU 验收。

## 来源字节

- 固定镜像 `mirror.json`：7589 bytes，SHA-256 **3CEEB8A03A0C297846B0EB915740A7122F588C60AF1EDD44CF7C8639562BCA78**。
- 完整解码 `original.glsl`：SHA-256 **68F9F9DFCED3C5D785AAF9B064EBC5CDC49DF1BB1C2136C8DECBA3A8FECDEB8B**。包括 `mainImage`、`mainVR` 和完整 MIT 头部。
- 暂存前设置 `.gitattributes` 禁止这两份证据的文本换行规范化；Git 暂存字节与获批镜像及其解码 pass 逐一比较。
- 固定提交、镜像/初抓日期、未知指标采样日期、历史 162 likes / 105322 views、单一零输入通道、当前页面 HTTP 402、完整 MIT 通知和候选批准记录见 `LICENSE.md`。

中文赏析与本站生成媒体 CC BY-NC-SA 4.0；框架、原作及 TSL 改编 MIT；站点永久非商业。此记录不授予合并或发布许可。
