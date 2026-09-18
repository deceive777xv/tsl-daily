# Shader Art Coding Introduction — 许可证与来源证据

- 原作：**Shader Art Coding Introduction — kishimisu（mtyGWy）**。
- 原作链接：https://www.shadertoy.com/view/mtyGWy
- 本案例：TSL 授权移植「叠环流彩」。
- **CC BY-NC-SA 3.0：基于旧镜像快照的默认许可判断，不是源码显式声明。**
- 许可正文：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode
- 原始 GLSL、TSL 改编及衍生海报/视频按 CC BY-NC-SA 3.0；独立中文赏析 CC BY-NC-SA 4.0，框架 MIT；站点永久非商业。

## 固定镜像

[原始镜像文件](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/mtyGWy.json)

- 仓库 GabeRundlett/shadertoy-api-shaders。
- 提交 f6d538adf936215ccf2d11ba9b4a6c79ccb448c5；文件提交日期 **2025-05-29T06:43:53Z**，GitHub API 已核验。
- [README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md)标注下载于 **2024-10-05**。指标精确采样日期未知。
- 历史快照 **1305 likes / 138973 views**，不代表当前热度。
- 抓取与全文审阅 **2026-09-18**。当前 Shadertoy 页面、源码及指标未重新核验。
- mirror.json SHA-256：`5D02275F49B2271034D2EAD41F9812727B673F653AF3495E9550A2704CBB8F8B`。
- 已核对内部 info.id 为大小写精确的 mtyGWy，作者 kishimisu。仅一个 Image pass，输入数组为空。
- 完整源码及头尾无自定义许可证、禁止展示/托管/分发/改编声明。按用户允许的旧镜像流程使用默认 CC BY-NC-SA 3.0，不将此判断表述为当前来源复核。

## 概念来源边界

原作在 palette 前署名 [Inigo Quilez 的 palettes 文章](https://iquilezles.org/articles/palettes/)。2026-09-18 从原站取回文章，核对其中数学表达式 color(t) = a + b · cos[2π(c·t+d)]。本案例保留概念署名，运行版直接在循环内独立表达三通道相位余弦公式，不复制文章正文、图像、示例文件或其他 IQ Shadertoy。原始镜像中的函数和署名仅随原作品完整保留为快照，不删除署名或将其冒充原创。

原作描述和头部另链接作者自己的 [教学视频](https://youtu.be/f4s1h2YETNY)。本案例不复制、请求或托管该视频或音频。源码没有其他素材输入和二级作者声明。

## 用户批准

2026-09-18，本任务推荐 **Shader Art Coding Introduction — kishimisu（mtyGWy）**，披露历史热度、镜像日期、默认许可判断、IQ 仅作数学概念引用和与既有案例的区别，并展示实际浏览器预览。用户随后明确回复 **“批准”**。

批准仅用于此标题/ID 的一个案例与一个 PR。PR 合并为最终发布审批，自动化不自行合并。之前“继续”仅允许筛查，未被当作批准。

## 保留与改编

- mirror.json 字节保持原样；original.glsl 等于唯一 Image pass 的完整解码文本，包括原作者注释与末尾换行。
- 默认四层、平铺 1.5、频率 8、辉光分子 0.01，与原作一致；宽度控件以原作为一倍（0.3–1.8）。新增五个参数：速度、层数（1–6）、平铺倍率、频率、辉光宽度。
- 初始时刻为原作第 2 秒。按屏幕高度归一化，竖屏不压扁圆环。
- 反幂分母下限 0.0001，避免除零奇点；最终显示 RGB 截断并解码后交由站点输出。
- 仅一个程序化视觉 pass，无外部输入、模型、纹理或音频。预览来自实际浏览器，WebM 无声并做首尾短交叉淡化，不声称原作动画严格周期。

Shader Art Coding Introduction by kishimisu — https://www.shadertoy.com/view/mtyGWy

Cosine palette mathematical concept credited to Inigo Quilez. TSL adaptation and independent Chinese commentary: TSL Daily contributors, 2026. No endorsement by the original author is implied.
