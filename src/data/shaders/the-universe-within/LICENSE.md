# 来源与许可证档案

- 原作：[The Universe Within — lscczl](https://www.shadertoy.com/view/lscczl)
- 作者：Martijn Steinrucken aka BigWings（2018）；镜像上传者字段为 `BigWIngs`。
- 用户批准：2026-09-08，本任务询问是否批准 **The Universe Within（lscczl）** 的纯视觉改编，用户回复“批准”。批准范围明确包括旧镜像证据、排除原作音乐、用教学参数替代音频亮度。一个独立案例 PR，合并仍为最终发布审批。
- 镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders)，固定提交 [f6d538adf936215ccf2d11ba9b4a6c79ccb448c5](https://github.com/GabeRundlett/shadertoy-api-shaders/commit/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5)。
- 源文件：[shaders/lscczl.json](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/lscczl.json)，最后提交于 **2025-05-29T06:43:53Z**。
- 获取及通读日期：**2026-09-08**。归档 `mirror.json` 保留解码后的 UTF-8 文件字节，SHA-256 为 `C8EF88DDD7D9DB97DABE94B4C95C6AEC3C5DC7D2306471A241A1E455C2749841`。
- README 记载最初备份于 **2024-10-05**；这与文件提交日期不同。历史指标 **779 likes / 150519 views**，准确采样日期无法独立确定，不能写作当前热度。
- 已检查全部源码和所有 pass 顶部：仅一个 Image pass，显式作者和许可声明；未发现冲突限制或二级代码署名。唯一输入为外部音乐流，见下方单独处理。

## 显式许可

```text
// The Universe Within - by Martijn Steinrucken aka BigWings 2018
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
```

采用 [CC BY-NC-SA 3.0 Unported](https://creativecommons.org/licenses/by-nc-sa/3.0/)（[完整条款](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode)），判断**基于旧镜像快照中的显式声明**，不是默认许可推断。保留署名、原作链接、许可链接和改编说明；非商业使用，衍生内容相同方式共享，不暗示原作者认可本站。

## 音乐边界

原始头部将音乐署名为 **Terrence McKenna Mashup — Jason Burruss Remixes**，链接为 <https://soundcloud.com/jason-burruss-remixes/terrence-mckenna-mashup>。这个外部音源的分发许可未核验，Shader 许可不能替代音乐授权。

本案例不下载、托管、复制或播放该音源。`mirror.json` 和 `original.glsl` 保留原始文本引用，作为完整历史证据；TSL 中删除 `texelFetch(iChannel0, ...)` 输入，改用手动背景辉光 uniform。预览视频不含音轨。原作者的参考视频与教程链接也仅保留在快照中，不转载视频内容。

## 文件和改编范围

- `mirror.json`：完整历史 JSON，保留元数据和唯一通道。
- `original.glsl`：从唯一 Image pass 原样提取；保留全部注释、署名及原始音频采样代码，用于对照阅读，不作为本站执行入口。
- `src/shaders/cases/the-universe-within.ts`：CC BY-NC-SA 3.0 授权改编。保留邻域节点、连线、脉冲辉光、四层缩放、视差和渐变色；以五个 uniform 暴露教学参数。用背景辉光替代 FFT，时间从原作第 30 秒开始，移除整场开场/结尾淡化；省略 SIMPLE 调试分支和未使用函数。规范 smoothstep 顺序、跳过中心到自身的边、增加除法极小值保护与颜色空间转换。拖动使用站点统一归一化指针，初始视点居中。
- `public/previews/the-universe-within.webp` 与 `.webm`：浏览器渲染本改编生成的衍生媒体，CC BY-NC-SA 3.0；循环预览首尾淡化仅用于媒体剪辑，不改变实时程序。
- 独立中文赏析 CC BY-NC-SA 4.0；框架 MIT。来源许可优先于通用原创内容许可，站点永久非商业。

## 当前核验的限制

2026-09-08 Shadertoy 原作页面抓取返回 HTTP 402，原作者源码所列 YouTube 视频也未能抓取；未取得当前源码或验证当前热度。历史 Cloudflare 限制未绕过，本轮也没有把 402 写作新观测到的 403。用户明确接受上述旧镜像证据；若未来取得冲突的许可信息，需重新核查后再继续分发。
