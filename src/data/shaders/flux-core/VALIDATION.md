# 螺旋能核 — 验证记录

日期：2026-10-12。用户对 **Flux Core — otaviogood（ltlSWf）** 明确回复“批准”，接受完整旧镜像的显式 CC0 1.0。分支从最新 main `4399aad15b8ff7f4fe53d7699ea16e8e5635b758` 创建；一个独立 PR，合并是用户的最终发布审批。

## 实际画布与媒体

- Chromium **151.0.7922.34**，默认实际 WebGPU、强制 WebGL2 均成功。非后备 WebGPU adapter 为 `nvidia / lovelace`、`fallback=false`。
- 海报来自默认 TSL WebGPU 画布，暂停并恢复参数后为源时间 20 秒、1440×900，再缩到 **960×600**，WebP quality 90，**167098 bytes**。WebGL2 同尺寸另存对照。
- 同一真实 TSL 画布以 `captureStream(25)` / MediaRecorder 录制无声动画，速度 0.6。取前 3.76 秒、缩到 960×600，再连接倒放；最终 **VP9 / 25 fps / 188 帧 / 7.52 秒 / 3964145 bytes / CRF 32**，只有视频流，无音轨。往返仅用于媒体闭环，实时保留原作 70 秒时间线。
- 已查看原始 GLSL、两个后端默认画布、最终 WebP、短循环中间帧及两后端桌面/移动视口。镂空层级、蓝束、橙环与锈纹清楚；没有只显示底色、黑屏、整幅过曝或明显偏离原作构图。局部光带夹白与细支撑杆的不稳定来自原作的画法。
- 文件：`public/previews/flux-core.webp`、`public/previews/flux-core.webm`。

## 原作与后端对照

`reference-comparison.json` 保存完整未经修改 Image pass 的浏览器对照：1440×900、源时间 20、默认参数。实际源码与镜像解码字符串相同，GL 错误为 0，浏览器错误与警告为空。

| 对照                   | RGB 平均绝对字节差 | 最大字节差 | 差值超过 10 的通道比例 |
| ---------------------- | ------------------ | ---------- | ---------------------- |
| 原始 GLSL → TSL WebGL2 | 0.139248 / 255     | 160 / 255  | 0.001573817            |
| WebGPU → WebGL2        | 0.210051 / 255     | 203 / 255  | 0.002501800            |

约 0.157% / 0.250% 的通道差值超过 10，整个平均差很小；`sin` 哈希、变形距离场的迭代与后端浮点计算敏感，不宣称逐像素相同。视觉对照保留同一构图、空间折叠、镂空与发光方法。半径 `1e-6` 保护、逆序 `smoothstep` 的显式展开、全局发光副作用的显式返回见 `LICENSE.md` 和赏析。

## 本机性能基线

Windows，AMD Ryzen 9 7950X3D，NVIDIA GeForce RTX 4080 SUPER；本次已读取本机型号并验证非后备 WebGPU adapter。默认自动画质暖机 3 秒，逐组采集 120 个 RAF 间隔。这是**浏览器调度观察，不是 GPU 时间戳或真实手机性能**，原始记录在 `performance.json`。

| 视口             | 实际后端 | 绘制尺寸 | 有效 DPR | 平均 / P95    |
| ---------------- | -------- | -------- | -------- | ------------- |
| 桌面 1440×900    | WebGPU   | 1440×900 | 1        | 6.06 / 6.1 ms |
| 桌面 1440×900    | WebGL2   | 1440×900 | 1        | 6.06 / 6.1 ms |
| 移动模拟 412×915 | WebGPU   | 618×1372 | 1.5      | 6.06 / 6.1 ms |
| 移动模拟 412×915 | WebGL2   | 618×1372 | 1.5      | 6.06 / 6.2 ms |

四组横向溢出为 0，无外部请求或浏览器错误。受控增加每帧 45 ms 主线程负载、持续 130 帧，自动 DPR **1 → 0.8**；这验证 DPR 响应策略，不能当作自然 shader 成本。实体命中后的阴影与噪声成本、空间折叠后的非严格距离及 210 次主步进上限均需考虑，真实手机未测。

## 减少动态与隐藏暂停

`browser-evidence.json` 保留检测结果：

- `prefers-reduced-motion: reduce` 初始 backend 为空，海报加载成功；主动播放后启动 WebGPU，按钮显示“暂停动画”。
- 受控设置 `document.hidden=true` 并派发 `visibilitychange`，800 ms 内 GPUQueue 提交 **468 → 468**；还原后增至 **604**，按钮和渲染恢复。
- **原生后台隐藏未核验**：将另一个实际标签页置前后，此页仍报告 `document.hidden=false`。不能由短暂停止提交推断 Page Visibility 正常；受控事件独立验证运行时路径，原生后台仍需另行补验。

## 测试证据

- `npm run quality` 全部通过：格式、ESLint、**22 个案例**契约、**5 个单元测试**、Astro **0 errors / 0 warnings** 和生产构建。本机忽略目录内的旧诊断脚本产生 14 个 hints，保留既有共享大块构建提示。
- 完整 `npm run test:browser -- --config output/playwright/flux.config.ts --workers=2 --reporter=list,json`：**94 passed / 2 skipped / 0 failed**，96 项、约 2.6 分钟。两项跳过为既有 Pretty Hip 固定桌面像素宽度策略。临时配置只指定本机 Chromium 路径、独立端口 18774 与忽略目录内的输出，不提交。
- 新案例 **4/4 通过**：桌面、移动 × 实际 WebGPU、强制 WebGL2。精确来源、历史 CC0 和五个参数均验证；每个参数改变像素，恢复最大字节差 ≤2/255、平均差 <0.001。冻结默认画面的亮度、变化与黑白像素比例检查排除空白或整幅过曝，没有外部请求、console error 或横向溢出。
- 本机非后备 WebGPU smoke、四组性能、减少动态、自动 DPR 和受控隐藏暂停独立验证；不能用 CI 无 adapter 的跳过替代。
- 完整逐项记录保存在 `browser-evidence.json`，同一提交的远端 Quality 最终结论记录在 PR 正文。CI 若无 WebGPU adapter，必须将跳过和本机实际硬件验证区分记录。

## 来源字节与许可

- `mirror.json`：25501 bytes，SHA-256 **38DC42FCE250AECDD0CC114D1B08DA36694F4D26BCE5851EE3401815D8960591**。
- 完整 674 行 `original.glsl`：23631 UTF-8 bytes，SHA-256 **82DA36878A0C00AEEA34B0FC67A073CEA05E854835485C85D8B15D2D53A6EC59**。
- `.gitattributes` 禁止两个来源文件的换行转换；提交前将暂存字节逐项与获批镜像及解码 pass 比较。
- 固定镜像提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，2024-10-05 初次下载 / 2025-05-29 镜像提交 / 2026-10-12 取回与审阅；历史 **271 likes / 37507 views**，指标采样日期未知。唯一 pass 全部审阅、零输入、显式 CC0、自定义声明优先于平台默认；当前原作 HTTP 402，未绕过访问控制。

原作与 TSL 改编 CC0 1.0，原创中文赏析与生成媒体 CC BY-NC-SA 4.0，框架 MIT；站点永久非商业。候选批准只授权这一独立 PR，不授权合并。
