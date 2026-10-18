# Palace of Mind 许可与来源档案

## 原作与审批

- 原作：**Palace of Mind — butadiene（wttXDl）**。
- 原作链接：<https://www.shadertoy.com/view/wttXDl>。
- 2026-10-18，自动化先给出完全相同的标题、作者、大小写敏感 ID、原作链接、技术差异、历史热度、镜像日期和默认许可判断，用户随后明确回复 **「批准」**。
- 批准接受按旧镜像证据继续，并且仅用于本案例一个独立 PR。最终合并与发布由用户决定；不授权其他案例或自动合并。

## 可复核旧镜像

- 仓库：<https://github.com/GabeRundlett/shadertoy-api-shaders>。
- 固定提交：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`。
- 文件：[shaders/wttXDl.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/wttXDl.json)。内部 ID、名称与作者已逐项核对。
- GitHub 文件历史核验：**2025-05-29T06:43:53Z**，提交信息 `Update shaders May 29, 2025`。
- 固定 [README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md) 声明初始下载于 **2024-10-05**，提醒 Windows 大小写文件名可能碰撞；本案例文件名与内部 ID 完全一致。
- 获取、完整核查与用户批准日期：**2026-10-18**。
- 历史 **48 likes / 56,998 views**，具体采样日期未知；不得将初始下载日、文件提交日或本次核查日写成热度采样日，也不作为实时热度。

## 许可判断：基于旧镜像快照

已阅读全部元数据、唯一 Image pass 全部 **131 行**，包括开头与末尾。零输入通道，没有外部图片、纹理、模型或其他媒体；未见自定义许可证、禁止托管/展示/分发/改编的限制，或已声明的第三方源码来源。

依用户确定的历史镜像流程，使用 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）**。这是依流程作出的默认判断，不是源码有明确许可头，也不是当前作者重新授权。保留 butadiene、原作标题、原作/镜像/许可链接、非商业、相同方式共享与改动说明。

- 许可摘要：<https://creativecommons.org/licenses/by-nc-sa/3.0/>。
- 完整条文：<https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode>。
- 当前原作页面通过可用 web 工具无法访问，没有提供确定 HTTP 状态；不推断特定状态，不绕过访问控制，未核验当前作者、页面版本或统计。
- 没有使用其他作品的 Shader 源码或外部素材。原作未调用的 `cube`、`noise` 辅助函数仍原样保留在证据快照中，运行版不实现死代码。

## 原始字节

| 文件            | 字节数 | SHA-256                                                            |
| --------------- | -----: | ------------------------------------------------------------------ |
| `mirror.json`   |   4615 | `ef949bdbaed6f1b62b7414e272f419d58418ba1121577de5422923cebb7388bd` |
| `original.glsl` |   3579 | `feebe901240b6c2bb210b6789dd311473fc4faba03c84f7171151ca936487fc7` |

原始镜像 Git blob 为 `891ece7af675e0fa2d0b4f76abecf04ad856934c`，与固定 tree 一致；按未过滤字节核验，不使用自动换行转换后的哈希。GLSL 是 JSON `code` 的原样 UTF-8 解码，不增删字符或末尾换行。`.gitattributes` 对两份证据禁用文本换行转换，提交前重新比较工作区与暂存区字节。

## TSL 与媒体改动

独立用 Three.js TSL 表达原作 RGB 算法，保留未变形坐标选取单元、单元随机值、变换顺序、四轮默认折叠、三轴方柱最小值并集、距离除以七、原始相机叉积基、100 次有符号步进上限、先更新再判断命中、四面体法线、表面高光、周期发光带、远景混色和 2.2 次幂调色。

- 默认从第 2 秒开始；新增速度、梁柱半宽、折叠层数、条纹亮度、远景深度五个教学参数。最多五轮折叠用于参数范围，默认四轮与原作一致。
- 法线梯度长度下限 `1e-8`，退化零梯度返回零向量；发光条纹分母下限 `1e-6`，在零点取原倒数经 clamp 后的有限饱和极限。
- 原作 alpha 为 `1.1 - t`，本页以不透明 RGB 展示。原始 GLSL 与 alpha 表达式保留，未混入源快照改动。
- 最终裁剪显示 RGB，再解码 sRGB 一次交给共享 renderer。与原作和后端的视觉/像素差异独立记录，不承诺所有像素、时间和参数一致。
- WebP 与静音 WebM 来自真实浏览器的 TSL 非 fallback WebGPU 画布；短循环正放后倒放的处理只作用于媒体，实时运行不倒放。

原作与移植遵循来源 CC BY-NC-SA 3.0；中文赏析与原创预览采用 CC BY-NC-SA 4.0；站点框架 MIT，永久非商业。
