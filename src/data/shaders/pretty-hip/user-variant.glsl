#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 resolution;
uniform float time;
void main(void) {
vec2 uv = (gl_FragCoord.xy-0.5*resolution.xy) / resolution.x;
vec2 uv2=uv*80.0;
uv2 = abs(fract(uv2) -0.5);
vec4 bgColor = (uv2.x>0.4 || uv2.y>0.4)? vec4(0.1,0.15,0.25,1.0):vec4(0.1,0.2,0.35,1.0);
uv *= mat2(1,1,-1,1)/sqrt(2.);
vec2 pos = 16.0*uv;
vec2 rep = fract(pos+vec2(0.5));
float dist = 1.0-2.0*min(min(rep.x, 1.0-rep.x), min(rep.y, 1.0-rep.y));
dist = pow(dist, 2.0);
vec2 blockNum = floor(pos+vec2(0.5));
float squareDist = length(blockNum);
float edge = pow(sin(0.5*time-squareDist*1.5+ (blockNum.x-blockNum.y)*0.05 ),0.4);
float aSide = smoothstep(edge-0.4, edge-0.1, 1.2*dist)*2.0-1.0;
float bSide = smoothstep(edge-0.5, edge-0.3, 1.2*dist) *2.0- 1.0;
float value = clamp(aSide *bSide,0.0,1.0);
gl_FragColor = vec4(value);
vec4 spRingColor= (-blockNum.x+blockNum.y> 8.0)?vec4(0.,0.05,0.8,1.0):vec4(0.9,0.9,0.9,1.0);
vec4 ringColor =(mod(blockNum.x+blockNum.y,2.0)<0.01)? vec4(0.2,0.65,0.85,1.0): spRingColor;
gl_FragColor = mix(ringColor, bgColor, value);
}