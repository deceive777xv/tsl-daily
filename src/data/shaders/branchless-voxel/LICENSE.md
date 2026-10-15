# Branchless Voxel Raycasting — 许可证与来源证据

- 原作：**Branchless Voxel Raycasting — fb39ca4（4dX3zl）**，[原作链接](https://www.shadertoy.com/view/4dX3zl)。保留原作对 **kzy** 的推进轴比较掩码建议致谢。
- 固定镜像：[GabeRundlett/shadertoy-api-shaders](https://github.com/GabeRundlett/shadertoy-api-shaders/blob/f6d538adf936215ccf2d11ba9b4a6c79ccb448c5/shaders/4dX3zl.json)。README 声明初次下载于 **2024-10-05**。
- 文件路径提交历史确认：`f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，**2025-05-29T06:43:53Z**。内部 ID、标题、作者已按大小写逐一核验，避免镜像在 Windows 上的文件名碰撞。
- 本次取回、完整审阅、用户批准：**2026-10-15**。
- 历史热度：**191 likes / 39540 views**；精确指标采样日期未知。初抓日和文件提交日不等于指标采样日，也不代表当前热度。
- `mirror.json` 原始 **4544 bytes**，SHA-256：`2B2357D35C943F84E47D5CAE7DECBAFE58BA5960775670EFCF428A1EB9556A8A`；Git blob `6d228e95e732eb0c56b167d061168d5a3e140dd9`。
- `original.glsl` 为完整唯一 Image pass 解码字符串，**3004 UTF-8 bytes / 108 行**，SHA-256：`0D02774DECBFB9DB08A8F462241FC196A6E1BCFD2549823F546154220213C71A`。完整保留头尾、空白、原始注释和未启用的另一种 DDA 分支；没有插入本站许可头或格式化源码。
- 当前 Shadertoy 页面通过浏览工具打开失败，返回 Internal Error，没有具体 HTTP 状态；不推定 402/403，不绕过访问控制，不声称当前页面、源码或作者许可已复核。

## 全通道审阅与原作许可

完整阅读 JSON 元数据与唯一 Image / image pass 的全部 108 行，包括顶部教程来源、kzy 致谢、两种推进实现和结尾。`inputs` 为空，没有 Common、Buffer、Sound、反馈、贴图或音频依赖。源码和元数据未发现原作自定义许可或额外的托管、展示、分发、改编限制。

按用户明确批准的旧镜像流程，原作和 TSL 改编采用 **Shadertoy 默认 CC BY-NC-SA 3.0（基于旧镜像快照）** 判断。这不是源码顶部的显式授予，也不是当前作者许可的核验。分发时保留标题、fb39ca4、原作链接、许可链接、改编说明、非商业及相同方式共享要求。署名不表示作者为本站背书。

原作明确指出 raycasting 代码部分基于 Lode Vandevenne 的二维教程。上游示例代码另有 BSD 两条款许可，必须保留；父作品的默认 CC 许可不能替代这份声明。

## 上游代码来源及 BSD 声明

逐层核验到以下一级来源，均于 **2026-10-15** 访问并保存证据：

1. 原作顶部链接：[Lode's Computer Graphics Tutorial — Raycasting](https://lodev.org/cgtutor/raycasting.html)。
2. 该教程直接提供的 [raycaster_flat.cpp](https://lodev.org/cgtutor/files/raycaster_flat.cpp)，顶部完整 BSD 两条款声明，Copyright (c) 2004-2021, Lode Vandevenne。UTF-8 文本快照保存在 `upstream/raycaster_flat.cpp`，SHA-256：`594B82B243319C4E1410CD3D72940B048A30214BB2596B09BC1FB0C50506EDFF`。
3. 教程的 [Legal Stuff](https://lodev.org/cgtutor/legal.html) 明确把 QuickCG 和所有文章示例源码置于同样的两条款许可，版权年份为 2004-2007。该页完整 HTML 仅作为本机证据保存，不在本站分发。

完整代码许可与两个来源年份说明另存 `upstream/LICENSE-Lode.txt`。示例代码的主要声明如下：

```text
Copyright (c) 2004-2021, Lode Vandevenne

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

Legal Stuff 对代码使用的同一声明应按 **Copyright (c) 2004-2007, Lode Vandevenne** 一并保留。教程正文与插图另有禁止未经许可复制或翻译的规定；本案例中文讲解为本站独立撰写，不复制、翻译或托管这些正文和插图。示例代码的明确许可与教程文字的限制适用于不同内容，不把整篇教程声称为 BSD。

原作的 `Thanks kzy for the suggestion!` 描述优化建议，没有进一步指认复制的独立源码或链接。保留其致谢；完整原作未发现其他二级代码署名。

## 用户批准记录

2026-10-15 先推荐完全相同的 **Branchless Voxel Raycasting — fb39ca4（4dX3zl）**，披露技术、历史热度与未知采样日期、镜像日期、默认 CC 判断、已核实的上游 BSD 示例代码，以及与 Menger Sponge 的遍历方法差异，提供原始 GLSL 的真实浏览器筛选画面。用户随后在本对话明确回复 **“批准”**。

批准接受按该镜像和上游证据制作一个案例及一个独立 PR。实现从最新 main `ece63146e23e221df9537241e1f315f425ace3f4` 的 `codex/branchless-voxel` 分支开始。这个批准只使用一次；PR 合并仍是用户的最终发布审批，不自行合并。

## 改编说明与分发范围

- 保留默认方盒半边长 6、挖空球半径 7.5、外围球半径 25、相机半径 12、上下摆动及 xz 旋转、64 次遍历预算、并列推进规则和三档灰度。
- `step(side, min(side.yzx, side.zxy))` 是原作 `lessThanEqual` 布尔掩码的数值表达，保留逐分量小于等于的含义。原作注释中的 largest 与代码不符；讲解明确为最小边界路程。
- 默认从原作时间 2 秒开始；五个教学参数为环绕速度、体素边长、挖空半径、透视焦距、朝向对比，默认 1 / 1 / 7.5 / 0.8 / 1。
- 新增有限分母保护和确定性掩码初始化。把命中后重复同一状态的 `continue` 改为提前 `Break`；不是新增几何。有限预算仍可能未命中，不声称所有参数下都得到精确交点。
- 保留 x/y/z 面灰度 0.5 / 1 / 0.75，以及 y 覆盖 x、z 覆盖两者的顺序；显示灰度先解码，再交给共用 sRGB 输出。不新增纹理、照明或物理反射。
- 海报和无声循环来自真实浏览器的 TSL 画布，具体媒体闭环方式和验证结果记入 `VALIDATION.md`。原作 GLSL、原作镜像和上游示例文本按快照原样保留。

原作与 TSL 授权改编遵循 [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/)，相关 Lode 示例代码保留 BSD 两条款许可。框架 MIT；原创中文赏析和本站生成媒体 CC BY-NC-SA 4.0；站点永久非商业。

Attribution: Branchless Voxel Raycasting by fb39ca4, Shadertoy 4dX3zl. Historical source and 2026 TSL adaptation: CC BY-NC-SA 3.0 under the explicitly approved historical-mirror workflow. Raycasting code lineage: Lode Vandevenne, BSD-2-Clause, with the notices above. Thanks to kzy for the axis-mask suggestion. Changes are listed above. No endorsement is implied.
