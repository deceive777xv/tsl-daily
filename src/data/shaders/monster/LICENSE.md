# MONSTER 来源与许可证档案

- 原作：MONSTER — butadiene（Shadertoy ID：`WtKSzt`，大小写必须一致）
- 原作链接：<https://www.shadertoy.com/view/WtKSzt>
- 固定镜像：<https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/WtKSzt.json>
- 镜像仓库：GabeRundlett/shadertoy-api-shaders；固定提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。
- README 记载初抓日期：2024-10-05。文件历史 API 核验的提交日期：2025-05-29T06:43:53Z。两者不能当作热度采样日期。
- 本次抓取与完整审阅：2026-10-16。历史热度：129 likes / 61,041 views；精确采样日期未知，非当前指标。

## 用户批准

2026-10-16，本聊天先推荐完全相同的 **MONSTER — butadiene（WtKSzt）**，说明旧镜像、未知指标采样日期、默认许可判断、技术差异与当前访问边界。用户紧接着明确回复 **“批准”**。该批准接受上述镜像证据，仅授权本案例的一次独立 PR，不授权合并、发布或额外案例。

批准记录已追加到自动化 `tsl` 的 memory.md；实现分支 `codex/monster` 从当时最新 main `55c5acb9ff21b959ae4c7a783145cd99938895d2` 建立。原作 RGB 的不透明呈现及数值防护在下方修改说明中记录。

## 全通道审阅与许可判断

完整检查元数据与唯一 Image pass 的 70 行源码，包括末尾：零输入，没有 Common、Buffer 或 Sound 通道；未见自定义许可证、禁止托管、展示、分发或改编的声明，也没有声明引用第三方源码。

依据用户制定并明确批准的历史镜像流程，按 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。它不是源码顶部的显式授权，也不是当前作者确认。当前 Shadertoy 页面抓取返回 HTTP 402，未绕过访问控制；未核验当前源码、热度或许可是否变化。

许可条款：<https://creativecommons.org/licenses/by-nc-sa/3.0/>。该条款页面说明署名、非商业和相同方式共享义务，本身不能证明特定作品适用该许可；本案例的适用判断来自已批准的镜像流程。

保留作品名、butadiene 署名、原作与许可链接、镜像时间线和修改说明。站点永久非商业；原始 GLSL 与移植的 TSL 遵循来源 CC BY-NC-SA 3.0，原创中文赏析与本次生成的媒体采用 CC BY-NC-SA 4.0，站点框架采用 MIT。

## 原始快照完整性

- `mirror.json`：2,566 bytes，SHA256 `3ee98fee0d08914b87631c63a8d42569e64de3a53ea80a388253f60129c14dc4`。
- Git blob：`fb7e1c7396bbfa286517ae49b7dbc111679786e1`，已用原始 bytes 重新计算核对。
- `original.glsl`：1,514 UTF-8 bytes，SHA256 `ac7e6489f2de13b0df4b36cafda5b8a1c6d0a582e14b69953ba6f3d1747ae35c`。
- 原始 JSON 和解码的 GLSL 均逐字节保存，不格式化；`.gitattributes` 禁止 Git 的文本换行转换。浏览器参考渲染的嵌入源码与此快照完全相同。

## 修改范围

以 Three.js TSL 独立重写原作的 RGB 算法，默认保留 66 步、六扇区、四层折叠、0.001 计数阈值与原始颜色；从原作第 2 秒开始。增加五个教学参数及中文赏析。

零半径处显式处理 `atan(0,0)`；绿色倒数切片在恰好为零处取正侧饱和极限 100，避免除零。正侧小于等于 0.0001 的饱和结果保持不变。未给原作步进添加最小步长，保留零步长重复累计的行为。原作 alpha 为零，本站用不透明画布显示 RGB，未将其作为透明度。没有加入贴图、模型、外部媒体、音频或真实折射。

海报和短循环由本次 TSL 的真实浏览器 WebGPU 画布生成；媒体回放采用往返片段，实时程序仍按原作方向连续推进。像素差异、性能与浏览器边界在验证档案中记录，不承诺逐像素等同或真实手机性能。
