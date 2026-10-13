# 来源与许可证档案

- 原作：**Voronoi - distances — iq / Inigo Quilez（ldl3W8）**，https://www.shadertoy.com/view/ldl3W8。
- 镜像：GabeRundlett/shadertoy-api-shaders，固定提交 `f6d538adf936215ccf2d11ba9b4a6c79ccb448c5`，`shaders/ldl3W8.json`。
- README 记载初次下载于 **2024-10-05**；文件历史 API 确认提交于 **2025-05-29T06:43:53Z**；本次读取、完整审阅、批准日期 **2026-10-13**。
- 历史 **575 likes / 122212 views**，精确采样日期未知；元数据 `date` 是作品发布时间，不能当作热度采样日期。
- 全部元数据、唯一 Image pass 共 102 行（含注释、备用哈希与结尾）已审阅。源码顶部为完整 **MIT / Copyright © 2013 Inigo Quilez**，未发现额外限制或第三方复制代码署名。作者自有文章、视频、同系列作品链接为参考，不是移植所需的上游源程序。
- 2026-10-13 当前 Shadertoy 页面读取返回 HTTP 402；没有绕过访问控制，未核验当前版本或作者现行授权。这里的判断基于固定旧镜像中的显式 MIT，不适用于其他 iq 作品。
- 用户在同一候选通知后明确回复「批准」，接受完全相同的标题与大小写敏感 ID，以及下面的输入替代范围。只授权这一案例的一个独立 PR；合并仍由用户审批。

## 原始证据与输入替代

`mirror.json` 是镜像原始字节；`original.glsl` 是唯一 Image pass 解码后的原始 UTF-8 字节，未改动贴图调用或注释。Git 属性关闭文本转换与 GLSL 空白修正。

| 证据            | SHA-256                                                            |
| --------------- | ------------------------------------------------------------------ |
| `mirror.json`   | `7895DFE680D08FC7CC40DB0B250147EB1EED6F207524FB72C05CB8E13E42820C` |
| `original.glsl` | `ADB9C02FA372EFBE267C8CA4B7652AA64A30C228B0D723B54AEA02B36B80A67E` |

原作 `iChannel0` 是 nearest/repeat 噪声图片，路径 `/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png`；**该图片的独立来源与授权未核验，不纳入本案例，不下载、复制或托管**。

原源码的 `hash2` 函数已经在注释中提供程序白噪声的替代实现。本例 TSL 使用该实现；浏览器 GLSL 对照仅将纹理 `return` 替换成这个原有程序 `return`，其余源码与默认参数不变。参考版本 SHA-256 为 `601F9F4342DEB9D23081E3A083E131F10C682F8A0DAB150260DAB53E4FC9BB84`。这改变具体点位布局，不改变边界距离构造，不能称为与原始贴图版本逐像素一致。

## MIT 原文

Copyright © 2013 Inigo Quilez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 本站内容

原始 GLSL、源码自带程序哈希和本例 TSL 改编均遵循上述 MIT。原创中文赏析、海报及短循环采用 CC BY-NC-SA 4.0；框架 MIT；站点永久非商业。
