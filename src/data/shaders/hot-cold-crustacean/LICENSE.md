# Hot and Cold Crustacean 许可与来源档案

## 原作与审批

- 原作：**Hot and Cold Crustacean — TheGrego（ltXyzS）**。
- 原作链接：<https://www.shadertoy.com/view/ltXyzS>。
- 2026-10-17，本自动化先给出上述完全相同标题、作者、大小写敏感 ID、原作预览、镜像日期、历史热度、默认许可判断与技术差异；用户随后明确回复 **「批准」**。批准仅用于本案例的一个独立 PR，最终合并仍由用户决定。
- 审批接受按固定旧镜像证据继续；不代表作者提供了新的明确许可，也不授权其他案例或自动合并。

## 可复核的旧镜像

- 镜像：<https://github.com/GabeRundlett/shadertoy-api-shaders>。
- 固定提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。
- 文件：[shaders/ltXyzS.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/ltXyzS.json)。内部 ID、名称和作者与候选一致。
- 文件历史经 GitHub API 核验：提交时间 **2025-05-29T06:43:53Z**，提交信息 `Update shaders May 29, 2025`。
- 固定 [README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md) 声明初始下载于 **2024-10-05**，并提醒 Windows 文件名可能发生大小写碰撞；本案例文件名和内部 ID 完全一致。
- 本次获取、完整审核和用户批准日期：**2026-10-17**。
- 历史热度：**35 likes / 54,519 views**。统计采样日未知，既不是本次实时统计，也不能将 README 初始下载日等同于这组数据的采样日。

## 许可证判断：基于旧镜像快照

完整审核了所有元数据和唯一 **Image pass 的全部 27 行**，包括顶部与末尾；零输入通道。快照没有自定义许可证、禁止托管/展示/分发/改编的限制、外部素材或已声明的第三方源码来源。

按用户确定的历史镜像流程，没有自定义许可证时使用 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）**。这是默认许可判断，不是源码中存在明确许可头的结论。保留 TheGrego、原作标题、原作及镜像链接、许可链接与修改说明；以非商业、相同方式共享条款继续移植。

- 许可摘要：<https://creativecommons.org/licenses/by-nc-sa/3.0/>。
- 完整条文：<https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode>。
- 当前原作页面通过本次可用的 web 工具无法访问，返回结果未提供确定 HTTP 状态；不推断特定状态，不绕过访问控制。当前作者/页面版本未核实。
- 没有引入其他作者的 Shader 源码、图片、模型或纹理，也不借此判断任何其他作品的许可。

## 原始字节

| 文件            | 字节数 | SHA-256                                                            |
| --------------- | -----: | ------------------------------------------------------------------ |
| `mirror.json`   |   1987 | `5f299bbebf99f80379f7c4b3733102bc6ce9f43c3ac4e1ce31c9420cca936aa3` |
| `original.glsl` |    796 | `5f3e2de46a98fe70f9289c01bd434246704c120026cda5ea9bf1431a3c6c59c6` |

镜像 Git blob 为 `f00fe9c03abf7a019966d846c2545893e656038a`，与固定提交的 tree 条目一致。GLSL 是对 JSON 中唯一 pass 的 `code` 原样 UTF-8 解码，不补结尾换行、不修改源字符。`.gitattributes` 禁用两个证据文件的文本换行转换，提交前重新核验工作区和暂存区字节。

## TSL 改动

由原始公式独立表达为 Three.js TSL 节点，默认参数保留原作：底边中央原点、行向量乘矩阵的旋转方向、逐分量坐标乘法、三次按 R/G/B 顺序递进、周期距离与未限制权重的 `mix`。运行默认从第 7 秒开始，增加速度、径向扭转、纹理细度、褶皱频率、纵向压缩五个教学参数。

数值处理包括：半径除数下限 `1e-6`，在原点取连续延拓零值；第一通道的零次幂用一表示，避开 `pow(0,0)`；源 `pow(uv.y,1.0)` 直接用有符号 `uv.y` 表示，避免负底数幂函数未定义；最终才裁剪到显示 RGB，并在共享 renderer 编码前解码 sRGB 一次。原始快照不含这些改动，逐像素比较及其边界另见验证档案，不承诺位级一致。

WebP 海报和静音 WebM 由真实浏览器中的 TSL WebGPU 画面生成。短循环将一小段正向片段接上倒放，仅用于媒体接头，实时运行不倒放。原作/移植依 CC BY-NC-SA 3.0；中文赏析和原创预览依 CC BY-NC-SA 4.0；站点框架 MIT，永久非商业。
