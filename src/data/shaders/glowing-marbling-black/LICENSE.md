# glowingMarblingBlack — 许可证与来源证据

- 原作：**glowingMarblingBlack — nasana（WtdXR8）**，[原作链接](https://www.shadertoy.com/view/WtdXR8)。
- 固定镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/WtdXR8.json)。
- 镜像提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**；按文件路径查询提交历史确认。README 声明初次下载于 **2024-10-05**。JSON 内部 ID、大小写精确标题和作者已确认分别为 `WtdXR8`、`glowingMarblingBlack`、`nasana`。
- 本次取回、完整审阅及批准：**2026-10-10**。
- 历史热度：**221 likes / 65839 views**。精确指标采样日期未知，不能把初抓日或文件提交日当作精确采样时间，也不代表当前热度。
- `mirror.json` 原始 **1298 bytes**，SHA-256：`0F02499A5BC0CCF79F1C50A02C88B1180117E44C3CC355D4471052AD463F5E49`。`original.glsl` 是完整唯一 Image pass 的解码字符串，头尾和空白均保留；这两份证据禁止 Git 文本换行转换。
- `original.glsl` SHA-256：`658F67ACBEF17C22948B0DF0913C2242EE7D63F2D43FCA925CDB24EF0B974A2A`，未经格式化或插入许可头；本站署名和许可判断另存于本档案与 TSL 文件。
- 本次直接请求当前 Shadertoy 页面返回 **HTTP 403**，响应 11 bytes；未核验当前源码、许可或热度，未绕过访问控制，也没有声称观察到 Cloudflare 挑战。

## 全通道检查与许可判断

完整 JSON 只有一个 Image / image render pass，`inputs` 为空。已检查完整 10 行源码，包括开头、结尾以及全部元数据：没有 Common、Buffer、Sound 通道，没有外部贴图、音频或反馈输入。元数据描述只链接作者自己的 Twitter。

所有 render pass 源码顶部及完整内容均**没有自定义许可证、禁止托管、展示、分发或改编的限制，也没有第三方源码引用**。因此依据用户授权的旧镜像审查流程，按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断；这不是作者在源码中的显式授权声明，也不是当前页面许可核验。

原作与 TSL 改编遵循 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)，保留作者、作品标题、原作链接、许可与改编说明，限非商业并遵循相同方式共享。框架 MIT；原创中文赏析与本站生成媒体 CC BY-NC-SA 4.0；本站永久非商业。署名不表示作者为本站背书。

## 用户批准记录

2026-10-10 先推荐 **glowingMarblingBlack — nasana（WtdXR8）**，披露原作、关键技术、历史热度与未知采样日期、镜像/初抓日期、默认许可判断、当前访问限制及与 Base warp fBM / I/O 的差异，并展示旧镜像 GLSL 的真实浏览器筛选画面。用户随后明确回复 **“批准”**，接受按该旧镜像证据继续；批准于 **2026-10-10T12:42:20.4997276Z** 记录到 automation memory。

该批准仅用于这个完全相同标题和大小写精确 ID 的一个案例、一个独立 PR。实现从最新 main `e03f05394cc6c8de8f42d2abc7797f057367ffcc` 开始；候选批准不是 PR 合并许可。合并仍为最终发布审批。

## 改编说明

- 保留按视口短边归一化的坐标、九层 `0.6 / i` 位移、2.5 与 1.5 的余弦频率、先 x 后 y 的更新顺序，以及 `0.1 / abs(sin(time - y - x))` 的灰度亮纹。
- 默认从源时间 7 秒开始。新增五个教学参数：速度、1–12 层扭曲、幅度、共同频率倍率、倒数亮度分子；默认值 1、9、0.6、1、0.1 保持原作数学。
- 分母下限 0.0001 防止除零；全部参数下它只影响原本已经截白的区域。显示灰度先 sRGB 解码，再交给共用 sRGB 输出，避免重复编码。没有额外贴图、模糊、bloom 或模拟。
- WebP 海报和无声 WebM 来自真实浏览器 TSL 画布；往返仅用于短片闭环。实际后端、原作对照、媒体、性能及隐藏标签页边界见 `VALIDATION.md`。

Attribution: glowingMarblingBlack by nasana, Shadertoy WtdXR8. Historical source and the 2026 TSL adaptation: CC BY-NC-SA 3.0, based on the approved old mirror snapshot. Changes are listed above. No endorsement is implied.
