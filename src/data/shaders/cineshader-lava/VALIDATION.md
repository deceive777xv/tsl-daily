# CineShader Lava — 验证记录

日期：2026-09-12。基于 `main@8e7d2ddf344d869dd88e0c41def73d295a1b9a3a` 创建 `codex/cineshader-lava`，用户同日对 **CineShader Lava — edankwan（3sySRK）** 明确批准。此记录只覆盖本案例改编；合并仍需用户审批。

## 质量与浏览器

- `npm run quality` 通过：Prettier、ESLint、8 案例契约、Vitest 5/5、Astro check 0 errors / 0 warnings、10 个静态页面生产构建。已有大于 500 kB chunk 提示仍为非阻塞警告。
- `npm run test:browser`：**28/28 通过**，桌面 Chromium 与 Pixel 7 模拟。新增案例覆盖强制 WebGL2、旧镜像默认许可文案、原作链接、五参数、融合参数像素变化与默认值精确恢复、visibilitychange 暂停/恢复；归档首项减少动态效果测试覆盖本案例。
- 生产预览地址：`http://127.0.0.1:4321/tsl-daily/shaders/cineshader-lava/`。两个后端各验证 1440 × 900 和 412 × 915：后端为 WebGPU / WebGL2，无页面或控制台错误、无外部请求、无水平溢出。检查默认与全部参数最小/最大组合。
- 额外逐项检查五个参数：先运行动画 800 ms 后暂停，每次单独调到最大值并还原；两后端共 **10/10** 检查均产生画布像素变化，还原后与该次基准截图字节相同。
- 初次媒体生成前出现预期的海报 404；海报生成后生产验证无资源错误，未将初次开发资源错误当成最终通过结果。

## 隐藏暂停的验证边界

- 受控 `document.hidden=true` + `visibilitychange`：GPUQueue 提交计数在稳定后 800 ms 保持 **8 → 8**；恢复后 **140**，按钮从“播放动画”恢复为“暂停动画”。这证明运行时暂停分支停止了 GPU 提交，而不只是改了按钮。
- 真实窗口最小化、CLI 标签切换、关闭焦点模拟后标签切换、独立 headed Chromium 标签切换均尝试过。本机自动化环境仍报告 `document.hidden=false`，没有真实 visibilitychange 事件，因此**真实后台隐藏事件路径未验证**。独立 Chromium 的提交计数在后台仍从 104 到 106，不能宣称完全停止。
- 没有为通过测试修改产品的 Page Visibility 逻辑；没有将受控事件测试冒充实机后台验收。合并审阅时应留意这一既有环境限制。

## 性能基线

硬件：AMD Ryzen 9 7950X3D / NVIDIA GeForce RTX 4080 SUPER。Chromium **153.0.8010.37**；WebGPU adapter `nvidia / lovelace`，`isFallbackAdapter=false`。

在其他测试结束后，逐一加载生产页面，预热 3 秒，采样 120 个 requestAnimationFrame 间隔；每个视口和后端分别测量。原始摘要见 `performance.json`。这测量的是浏览器帧调度间隔，不是 GPU timestamp，也不等于单帧 Shader 执行耗时。

移动为桌面 GPU 上的 412 × 915、deviceScaleFactor 2.625、触摸视口模拟，不能代表真实手机。默认自动画质桌面有效 DPR 1，移动有效 DPR 1.5。持续注入约 45 ms/帧主线程负载后，实际 DPR 从 1 降至 0.8，确认自适应降级生效。

## 视觉、媒体与来源

- 在真实浏览器绘制未改动的原始 GLSL，`iTime=8`、1440 × 900、RGB 不透明输出（原作 Alpha 是 CineShader 厚度数据）；与同时间 TSL 的 WebGPU / WebGL2 图像对照。
- 主要球团位置、平滑融合轮廓和色彩分布一致。TSL 的停止阈值、法线差分间距和远端保护改变极少量轮廓/明暗；修正了最初把达到 64 步的擦边像素当背景导致的暗缝。
- 已目视检查最终 WebP、最终视频中间帧、移动参数面板、桌面 WebGL2 最大参数组合及原始 GLSL 对照；没有纯底色、黑屏或整体过曝。最大半径/融合时形体可伸出画面边缘，属于参数的形态变化。
- WebP：1440 × 900，来自实际 WebGPU 画布。
- WebM：VP8，1440 × 900，25 fps，**7.52 秒**，无音轨。MediaRecorder 录制真实画布；末尾半秒与开头短交叉淡化。原始多球运动并非严格周期，淡化可能短暂产生重影；不将视频描述为原始运动的精确周期。
- 许可证与镜像 SHA-256 见 LICENSE.md。原始 JSON 字节和 GLSL 空白保留，不经过格式重写。
- 可复现的本机检查脚本与截图位于 `output/playwright/lava-*.cjs` 和 `output/playwright/cineshader-lava-*`（未提交的验证工作文件）。版本控制中保存最终媒体、原始证据、TSL、文章和本记录；PR CI 提供完整站点预览构建供下载审阅，不公开部署新案例。
