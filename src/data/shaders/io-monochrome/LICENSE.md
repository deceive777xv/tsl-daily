# I/O — 许可证与来源证据

- 原作：[I/O — movAX13h（XsfGDS）](https://www.shadertoy.com/view/XsfGDS)，源码头标注 August 2013。中文案例「墨光双流」。
- 许可判断：**CC BY-NC-SA 3.0，基于旧镜像的 Shadertoy 默认许可规则**。不是源码中的显式授权声明。用户已批准按该历史证据继续。
- 已检查唯一 Image pass 的全部代码及 metadata，未发现自定义许可、禁止改编/托管等限制或二级代码署名。没有额外 pass。
- [固定镜像](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/XsfGDS.json)：GabeRundlett/shadertoy-api-shaders；文件 commit f6d538adf936215ccf2d11ba9b4a6c79ccb448c5，2025-05-29T06:43:53Z。
- README 记载下载于 2024-10-05；不是精确热度采样日期。历史 224 likes / 27957 views；抓取并审核于 2026-09-15。
- mirror.json 保留下载字节，SHA256：D8298A8549DAB45D0A79A866832F337BF580B7991E1A3D3DD815548EEDD6F6CC；内部 ID 大小写与作者核对一致。
- original.glsl 保存完整、未修整的解码源码。JSON 中的原音频地址仅为来源记录，不由网站请求。
- 当前 Shadertoy 页面访问返回 HTTP 402；当前许可、源码及热度没有直接核验，不将其写为观察到的 Cloudflare 403。

## 批准与范围

2026-09-15 用户针对 **I/O — movAX13h（XsfGDS）无音乐候选**回复：“批准。现在是黑白风格的：”，并贴出 GLSL。该粘贴代码仍含粉蓝 baseColor 和 sampleMusic，因此以明确的黑白视觉要求为准，不宣称这是从当前官网获得的新版本。其核心计算与已存档原作一致。

批准黑白无音乐改编、一个独立 PR；不自动合并。分支 codex/io-monochrome 基于最新 main ef5c297dd461767fe35407585d40a41e58b2f758。Flame 的历史批准继续暂停，与本例无关。

唯一外部输入是音乐。其独立许可未核验，**不下载、复制、托管、请求或播放**。TSL 直接使用手动亮度脉冲 uniform，无音频 API 和音频资源。

## 改动与分发

- 原作左右粉蓝改为统一灰阶标量，保持双向运动、70 个默认方块、随机深度、实体与柔光分层。
- 手动脉冲替代 sampleMusic；柔光默认减弱，避免灰阶叠加吞掉轮廓。
- 原反向 smoothstep 改为递增边界的等价遮罩；可变边界亮边采用受保护的显式三次插值，消除无定义边界依赖。
- 竖屏构图缩放适配，方块不拉伸；增加速度、数量、柔光、脉冲和深度五参数，默认从第 2.5 秒开始。
- 保存原始 GLSL、镜像字节。用户粘贴的 Markdown 转义不作为源码快照，也未从未知来源补代码。
- GLSL、TSL 改编及派生海报/视频按 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) 分发。独立中文赏析 CC BY-NC-SA 4.0；框架 MIT。本站永久非商业。
- 保留署名：I/O by movAX13h, August 2013. Monochrome silent adaptation by TSL Daily contributors, 2026. 不暗示原作者背书。
- 随机函数使用 Three.js 自带整数 hash（库按 MIT 分发）替代原作 sin/fract 大常数公式；粒子具体位置与颗粒图案因此不同。原作证据不变。
