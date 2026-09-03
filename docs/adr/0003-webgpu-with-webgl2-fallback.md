# 使用统一 TSL 实现覆盖 WebGPU 与 WebGL2

所有案例只维护一份 Three.js TSL 实现，运行时优先使用 WebGPU，并通过 Three.js 的渲染后端能力回退到 WebGL2；首版不要求 WebGPU 独占能力，也不维护平行的 GLSL 版本。相比仅支持 WebGPU，这扩大了可访问设备范围；相比手写两套 Shader，则保留了 TSL 教学内容与实际运行代码的一致性，但每个案例必须在两种后端上验证。
