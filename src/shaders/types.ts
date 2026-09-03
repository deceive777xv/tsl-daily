import type { Color, Material, Vector2 } from 'three/webgpu';

export type MutableUniform<T> = {
  value: T;
};

export type ShaderContext = {
  time: MutableUniform<number> & Record<string, unknown>;
  resolution: MutableUniform<Vector2> & Record<string, unknown>;
  pointer: MutableUniform<Vector2> & Record<string, unknown>;
};

type BaseControl = {
  id: string;
  label: string;
  description: string;
};

export type NumberControl = BaseControl & {
  kind: 'number';
  min: number;
  max: number;
  step: number;
  initial: number;
  uniform: MutableUniform<number>;
};

export type ColorControl = BaseControl & {
  kind: 'color';
  initial: string;
  uniform: MutableUniform<Color>;
};

export type ShaderControl = NumberControl | ColorControl;

export type ShaderProgram = {
  material: Material;
  controls: ShaderControl[];
};

export type ShaderFactory = (context: ShaderContext) => ShaderProgram;
