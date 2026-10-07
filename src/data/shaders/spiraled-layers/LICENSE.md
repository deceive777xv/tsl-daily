# Spiraled Layers — 许可证与来源证据

- 原作：**Spiraled Layers — Tater（Ns3XWf）**，https://www.shadertoy.com/view/Ns3XWf 。
- 本案例：TSL 授权移植「螺旋卷层」。
- **CC BY-NC-SA 3.0：基于旧镜像快照的 Shadertoy 默认许可判断，不是源码显式许可声明。**
- 许可正文：https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode 。
- 原始 GLSL、TSL 改编及衍生海报和短片遵循 CC BY-NC-SA 3.0；独立中文赏析 CC BY-NC-SA 4.0，站点框架 MIT，网站永久非商业。

## 固定证据

- 镜像仓库：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)；[Ns3XWf.json 固定原文件](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/Ns3XWf.json)。
- 固定提交：f6d538adf936215ccf2d11ba9b4a6c79ccb448c5，文件提交于 2025-05-29T06:43:53Z，已核对 GitHub API。
- [镜像 README](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/README.md) 标注初始下载于 2024-10-05。2026-09-24 取回并审阅；历史记录为 272 likes / 11171 views，指标的精确采样日期未知，不代表当前热度。
- mirror.json 原始字节的 SHA-256：715349F8885D736462ADFEDF0611664FFB61B0AFBC0063424831BF4FB90246B2。内部 info.id 大小写精确为 Ns3XWf，作者 Tater，标题 Spiraled Layers。
- 一个 Image pass，零外部输入。已完整检查描述、唯一 render pass 源码头尾及正文：未见自定义许可证、限制托管/展示/分发/改编的声明，亦无二级源码署名。不能由此推断作者另行给予无限制使用许可。
- 当前 Shadertoy 原作页面请求返回 HTTP 402；当前代码、许可和指标未能复核。

## 用户批准

2026-09-24，本任务推荐 **Spiraled Layers — Tater（Ns3XWf）**，披露历史热度、镜像日期、默认许可判断及与既有案例的差异。用户随后明确回复 **“批准”**，同意按这份固定旧镜像证据继续。该批准只对应这个标题和 ID 的一个案例及一个独立 PR；PR 合并是最终发布审批，自动化不自行合并。

## 保留与改编

- mirror.json 保持原文件字节不变；original.glsl 为唯一 Image pass 的完整解码源码，不删改注释或空白。
- TSL 保留螺旋曲线距离构造、三组错相位卷层、限定重复、射线与单元边界求交、法线、阴影和环境光遮蔽的核心思路。
- 默认从原作第 2 秒构图开始；新增展开速度、卷层厚度、分层宽度和相机偏航四个教学参数，默认值保持原作数值。原作可按住鼠标转动相机，这里提供可重复的偏航滑块。为了控制跨后端成本，光线追踪上限由 200 次改为 128 次，阴影上限由 64 次改为 24 次，环境光遮蔽下限由 0.1 提高到 0.65 以保持明亮侧面；这些改动可能改变边缘和遮挡细节，不宣称逐像素复制。
- 原作写出 alpha=0，网页只展示其 RGB，不将作品作为透明图层合成。TSL 把原作显示 RGB 解码为线性颜色，由站点统一输出为 sRGB。
- 无外部纹理、音频、模型或其他素材。WebP 海报与无声 WebM 短循环由真实浏览器渲染；短片取浏览器录制的前半段并倒放回首帧，形成无重影往返循环；倒放只用于预览媒体，交互画面仍按原作时间向前运行。

Spiraled Layers by Tater — https://www.shadertoy.com/view/Ns3XWf

TSL adaptation and independent Chinese commentary: TSL Daily contributors, 2026. No endorsement by the original author is implied.
