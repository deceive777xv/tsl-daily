# 逐波海面 — 验证记录

日期：2026-10-08。源作 **Very fast procedural ocean — afl_ext（MdXyzX）**，用户对该候选明确回复“批准”。默认数值保持原作，从源时间第 7 秒开始。PR 合并由用户决定。

## 真实画布与媒体

- Chromium 151.0.7922.34，实际 WebGPU 与强制 WebGL2 都成功初始化，无 shader 编译错误、pageerror、控制台 error 或 warning。
- 海报来自实际 WebGPU TSL 画布，1440×900，默认参数、暂停后恢复默认；WebP 编码 quality 90。WebGL2 默认画布另行采样对照。
- 无声短片由同一画布的 `captureStream(25)` / MediaRecorder 录制，时间速度 0.35；取前 3.76 秒，缩到 960×600，再接入倒放，VP9、25 fps、总长 7.52 秒，无音轨。往返只用于预览媒体，交互运行时保持向前。
- 原始 GLSL、TSL WebGPU / WebGL2 海报及循环中点、末帧逐张查看。海面波峰、暗谷、天空和太阳反射清晰；没有仅底色、黑屏、整幅过曝或偏离原作海面构造。太阳及局部镜面反光有原作的白色亮部，保留此表现。
- 素材文件：`public/previews/fast-procedural-ocean.webp`、`public/previews/fast-procedural-ocean.webm`。

## 源作对照及数值边界

`reference-comparison.json`：在同一 Chromium、1440×900、源时间 7、iMouse=0 下，用未经改动的完整 GLSL 对比默认 TSL WebGL2。原始 `gl.getError()` 为 0。

- 原作→TSL：RGB 字节平均绝对差 **4.83725/255**，最大 **234/255**；顶部 35% 区域平均 **0.02940/255**，其余区域平均 **7.42609/255**。
- WebGPU→WebGL2：平均 **0.04017/255**，最大 **85/255**；超过 10 字节的通道占比约 **0.0586%**。
- 构图、波形与色彩经视觉对照保持原作思路。细碎水面反光对浮点计算顺序和原生 shader 编译敏感，个别高亮像素差异较大，**不宣称逐像素一致**。源对照的整体均值检查按 RGB 范围 3.5% 作为结构偏差上限，并同时做人工视觉检查；这不是参数恢复的容差。
- 初次对照定位并修正了列主序相机矩阵的俯仰符号。最终实现保留原作差分切线、上下平面方向和权重混合顺序；两个截断平面交点几乎重合时改用视线，避免归一化零向量。

## 本机性能基线

Windows，AMD Ryzen 9 7950X3D，NVIDIA GeForce RTX 4080 SUPER。`performance.json` 记录 Chromium 151.0.7922.34 的实际 `nvidia / lovelace` WebGPU adapter，`fallback=false`。

每组默认自动画质暖机 3 秒，采集 120 个 RAF 间隔。下表是浏览器调度间隔，**不是 GPU 查询耗时、相对性能排名或真实手机数据**。

| 视口             | 实际后端 | 绘制尺寸 | 有效 DPR | 平均 / P95    |
| ---------------- | -------- | -------- | -------- | ------------- |
| 桌面 1440×900    | WebGPU   | 1440×900 | 1        | 6.06 / 6.2 ms |
| 桌面 1440×900    | WebGL2   | 1440×900 | 1        | 6.06 / 6.2 ms |
| 移动模拟 412×915 | WebGPU   | 618×1372 | 1.5      | 6.06 / 6.2 ms |
| 移动模拟 412×915 | WebGL2   | 618×1372 | 1.5      | 6.06 / 6.2 ms |

四组横向溢出为 0，无外部资源请求。真实手机耗时未测试。人为在主线程每 RAF 增加 45 ms 忙等待、持续 130 帧，自动 DPR 从 1 降至 0.8；这是受控退化响应检查，不是该 shader 的自然运行负载。

## 减弱动态与隐藏暂停

`browser-evidence.json` 分开记录两类 visibility 证据：

- `prefers-reduced-motion: reduce`：初始 backend 为空，海报确实加载；点击播放后实际启动 WebGPU，按钮变为“暂停动画”。
- 受控隐藏：设置 `document.hidden=true` 并派发 `visibilitychange`，800 ms 内 GPUQueue 提交计数不变；还原后提交恢复，按钮也恢复播放状态。
- **原生后台隐藏未验证**：自动化浏览器切换标签后仍报告 `document.hidden=false`。没有把短暂停止提交、受控事件或用户可见的标签切换当成真实 Page Visibility 证明。该环境边界与已有案例相同，人工浏览器切后台仍需补验。

## 质量与回归

- `npm run quality` 通过：格式、ESLint、18 个案例契约、5 个单元测试、Astro 类型检查和生产构建。Astro 0 errors / 0 warnings；本地未提交的诊断脚本有 6 个 hints，构建保留既有共享大块提示。
- 构建完成后执行 `npm run test:browser -- --config=output/playwright/ocean-playwright.config.ts`，同一生产预览使用空闲端口 18770；**78 passed / 2 skipped / 0 failed**，共 80 项，约 1.1 分钟。两项跳过是既有 Pretty Hip 移动策略。
- 新案例 **4/4 通过**：桌面、移动 × 实际 WebGPU、WebGL2。验证来源卡/许可证、零音视频与外部输入、五个参数确实改变画面、恢复最大差 ≤2/255 且平均差 <0.001；四个波形参数同时取最小/最大时，下方海面仍有起伏、无黑屏或整幅过曝。
- 本机非后备 WebGPU smoke 与四组性能/生命周期检查独立执行；adapter 明确 `fallback=false`。网页与两个后端画布、移动参数面板及短循环关键帧均做视觉检查。
- 两份镜像、两个完整解码 GLSL、BakingLab HLSL 与完整 MIT 通知在 Git 暂存字节层与审阅来源逐一比较；全部一致。
- 远端 CI 结论在 PR 正文记录，以同一提交的完整 Quality 结论为准。CI 没有 WebGPU adapter 时的跳过单独列出，不当作远端 WebGPU 验收；本机实际 WebGPU 证据保留。

## 来源字节

- 主作镜像 JSON：CE423773A03155F0291445CF6B7BDB4640F8E627399B63C03EED2E0BE9C834F1。
- 主作完整解码 GLSL：34C2FB622DBE3E87B24445526FA6E3BE1FFCE31806665B9576E8C34422E3B4FC。
- 自引用 XsGfWV 完整解码 GLSL：E8E3342660902BA572DBA219E62C215E696521565B5F7D5D1C21F43416D450D7。
- 其他原始证据哈希与分开适用的 MIT / CC BY-NC-SA 3.0 见 `LICENSE.md`。已在暂存前设置 `.gitattributes`，防止换行或空白规范化。

中文原创赏析 CC BY-NC-SA 4.0；框架与本案例主作改编 MIT；站点永久非商业。未合并、未发布此案例。
