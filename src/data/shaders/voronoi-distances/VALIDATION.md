# 金线分域 — 验证记录

日期：2026-10-13。用户在完全相同的 **Voronoi - distances — iq / Inigo Quilez（ldl3W8）** 候选后明确回复「批准」，接受旧镜像的显式 MIT 和原源码自带程序哈希替代未核验噪声贴图。分支 `codex/voronoi-distances` 从最新 main `20fd205705f9cef479b279491f898b2a7033c098` 创建；一个独立 PR，合并是用户的最终发布审批。

## 实际画布与媒体

- Chromium **151.0.7922.34**，默认实际 WebGPU、强制 WebGL2 均成功。非后备 WebGPU adapter 为 `nvidia / lovelace`、`fallback=false`。
- 海报来自真实 TSL WebGPU 画布，暂停并恢复默认参数，源时间 7 秒、1440×900，再缩到 **960×600**，WebP quality 90，**106478 bytes**。WebGL2 同尺寸另存对照。
- 同一真实 TSL 画布以 `captureStream(25)` / MediaRecorder 录制无声动画，速度 0.6。取前 3.76 秒、缩到 960×600，再连接倒放；最终 **VP9 / 25 fps / 188 帧 / 7.52 秒 / 932329 bytes / CRF 32**，只有视频流，无音轨。往返仅用于媒体闭环，实时动画继续正向推进。
- 已查看程序哈希 GLSL 参考、两个后端画布、最终 WebP、短循环中间帧及移动参数面板。金色多边形边框、橙色特征点和灰色等距条纹清楚；没有只显示底色、黑屏、整幅过曝或明显偏离原作方法。
- 文件：`public/previews/voronoi-distances.webp`、`public/previews/voronoi-distances.webm`。

## 批准范围内的源码与后端对照

`reference-comparison.json` 保存 1440×900、源时间 7 秒、默认参数的浏览器对照。参考使用原源码已有的程序哈希，仅替换原始噪声贴图的 `return`；其余 GLSL 不变。嵌入的原始源码仍与镜像解码字符串相同，原始快照没有修改。报告明确 `sourceUnmodified=false`，不能称为未改动贴图版本的截图。GL 错误为 0，浏览器错误与警告为空。

| 对照                       | RGB 平均绝对字节差 | 最大字节差 | 差值超过 10 的通道比例 |
| -------------------------- | ------------------ | ---------- | ---------------------- |
| 程序哈希 GLSL → TSL WebGL2 | 0.005146 / 255     | 1 / 255    | 0                      |
| WebGPU → WebGL2            | 0.000138 / 255     | 1 / 255    | 0                      |

实际图像已目视对照，分区、边框、等距纹与点位一致。微小浮点和显示转换差异仍存在，不宣称逐像素相同。正弦哈希会放大浮点差异，以上数值只对应这台机器和已测配置。

## 交互与运行时

- 生产构建四组检查均通过：桌面 **1440×900**、模拟 Pixel 7 **412×915**，分别使用实际 WebGPU 与 WebGL2，无页面错误、外部网络请求或横向溢出；移动自动 DPR 1.5。
- `prefers-reduced-motion: reduce` 初始显示已加载海报、不初始化后端；手动播放后实际 WebGPU 工作。
- 自适应 DPR 在受控 **45 ms 主线程负载 × 130 帧**下，从 **1 降到 0.8**。这是响应机制测试，不是本 Shader 自然开销。
- 受控 `document.hidden=true` 与 `visibilitychange`：GPU 提交数 **482 → 482**，800 ms 内保持不变；恢复后达到 **624**，播放按钮同步。
- **原生后台标签页暂停未验证**：实际切换到另一个标签时，这一自动化环境仍报告 `document.hidden=false`。记录中的提交数不能替代 Page Visibility 证据，受控事件结果不能当作原生后台成功。

## 本机性能基线

硬件通过本机 CIM 核验：**AMD Ryzen 9 7950X3D / NVIDIA GeForce RTX 4080 SUPER**；另有 AMD Radeon(TM) Graphics，实际 WebGPU adapter 为非后备 NVIDIA。

每组独立预热 3 秒，再收集 120 个 RAF 间隔，均值均为 **6.06 ms**；桌面 WebGPU P95 **6.2 ms**，其余三组 P95 **6.1 ms**。这是浏览器调度间隔，不是 GPU 时间戳，不代表真实手机性能。

两轮搜索执行 9 与 25 次候选查询，默认形状和细胞密度不会增加循环次数。高密度和高等距线频率可能增加走样；增加 DPR 会增加总像素数。本例没有添加时间累积或全屏超采样。

## 质量与浏览器回归

`npm run quality` 通过：23 个案例契约、5 个单元测试、格式和 ESLint 检查、Astro 检查与生产构建；Astro 为 0 errors / 0 warnings，本机 ignored 辅助脚本有提示，不属于产品源码错误。

最终完整回归命令为 `npm run test:browser -- --config output/playwright/voronoi.config.ts --workers=1 --retries=1 --reporter=list,json`。结果 **98 passed / 2 skipped / 0 failed / 0 flaky**，100 项，333.33 秒。配置与仓库 CI 相同允许一次重试，**本轮没有触发重试**。两项跳过是已有 Pretty Hip 移动像素锐度策略；新案例四组实际 WebGPU/WebGL2、桌面/移动均通过，五个参数的 20 次恢复均为最大与平均 **0 字节差**。默认金色像素约 19.5%，灰色等距纹约 53–57%，纯白比例 0，排除只显示底色或整幅过曝。

初次 2-worker 全量为 95 passed / 2 skipped / 3 failed，均为已有 WebGL2 恢复检查：Filtering samples 最大差 3、Flux glow 82、Menger palette 132。三个原失败项在单 worker 隔离复跑全部通过（20.4 秒）。随后 1-worker / 无重试全量为 96 passed / 2 skipped / 2 failed：Filtering 最大差 3、RGBA 均差 0.000359，I/O 最大差 32、均差 0.000052。两轮中新案例四组均通过。这说明降低并发不是这些已有恢复检查的根因修复。

最终按 CI 策略运行全部通过，已有实现、测试断言与容差均未修改。初次 JSON 报告与日志、串行失败报告和 trace 保存在 ignored `output/playwright`；`browser-evidence.json` 记录完整结论与先前失败。没有宣称已经修复这些已有检查的不稳定原因。

远程 CI 的完成结论及 WebGPU 跳过边界由 PR 正文另行记录，不能用本机结果代替远程结果。

## 审批、热度与许可证据

镜像、GLSL 与 SHA-256 见 `LICENSE.md`。固定镜像 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，README 记载下载于 2024-10-05，文件提交于 2025-05-29，本次完整审阅于 2026-10-13。历史 575 likes / 122212 views 的精确采样日期未知。

唯一 Image pass 全部 102 行与元数据已审阅，源码包含完整 MIT；原噪声图片授权未核验且未下载或托管，使用用户批准的原源码程序哈希替代。当前原作 HTTP 402，未绕过访问控制。原作与 TSL 改编 MIT，中文赏析与媒体 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。候选批准只授权这一独立 PR，不授权合并。
