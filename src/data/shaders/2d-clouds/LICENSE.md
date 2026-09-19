# 2D Clouds — 许可证与来源证据

- 原作：**2D Clouds — drift（4tdSWr）**，https://www.shadertoy.com/view/4tdSWr 。
- 本案例：TSL 授权移植「晴空云絮」。
- **CC BY-NC-SA 3.0：基于旧镜像快照的默认许可判断，不是源码显式许可声明。**
- 许可正文：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode 。
- 原始 GLSL、TSL 改编与衍生海报/短片遵循 CC BY-NC-SA 3.0；独立中文赏析 CC BY-NC-SA 4.0，框架 MIT，站点永久非商业。

## 固定证据

[镜像原文件](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4tdSWr.json)

- 仓库：GabeRundlett/shadertoy-api-shaders。
- 提交：f6d538adf936215ccf2d11ba9b4a6c79ccb448c5；文件提交日期 2025-05-29T06:43:53Z，GitHub API 核验。
- [README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md) 标注下载于 2024-10-05。
- 历史指标：858 likes / 83564 views；精确采样日期未知，不代表当前热度。
- 抓取与完整审阅：2026-09-19。
- mirror.json SHA-256：`A37D7412AD39A01249E1B63F02FCE9875D83F023C976369B9CC703D0E626EB5B`。
- 内部 info.id 精确为 4tdSWr，作者 drift，标题 2D Clouds。一个 Image pass，inputs 为空。
- 已检查完整源码及头尾，未见自定义许可、限制托管/展示/分发/改编的声明或二级代码来源署名。描述中列出的两个 pouet 演示作品被标为使用本 Shader 的作品，不是声明的上游依赖；本案例不下载或引用其素材。
- 当前原作页面请求返回 HTTP 402；未确认当前代码、许可和热度。用户批准明确接受上述旧镜像证据范围。

## 用户批准

2026-09-19，本任务推荐 **2D Clouds — drift（4tdSWr）**，披露历史指标、镜像日期、默认许可判断和与现有 fBM 案例的差异。用户随后明确回复 **“批准”**。本批准仅授权此标题/ID 的一个案例和一个 PR；合并 PR 是最终发布审批，自动化不自行合并。

## 保留与改编

- mirror.json 字节不变；original.glsl 为唯一 Image pass 的完整解码文本，不改写空白或源码头尾。
- 保留原作梯度 hash、三角格噪声、各层次数和权重、矩阵方向、云形及颜色公式。新增速度、尺度、云量、不透明度和细节明暗五个参数。
- 默认视觉参数与原作一致；初始时间为第 2 秒。添加显示 RGB 到线性空间的解码以适配站点输出，不声称不同 GPU 的 sin/hash 浮点结果逐像素一致。
- 无外部纹理、模型、音频或其他素材依赖。单程序化视觉 pass。
- WebP 和无声 WebM 来自真实浏览器；视频首尾短交叉淡化，非数学上的严格周期。

2D Clouds by drift — https://www.shadertoy.com/view/4tdSWr

TSL adaptation and independent Chinese commentary: TSL Daily contributors, 2026. No endorsement by the original author is implied.
