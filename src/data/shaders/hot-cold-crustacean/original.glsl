#define M_PI 3.1415926535897932384626433832795
#define rot(a)  mat2( cos(a), sin(a),  -sin(a), cos(a) )

void mainImage( out vec4 fragColor, in vec2 u )
{
    // set my uv
    vec2 uv = iResolution.xy;
    uv = (u+u - vec2(uv.x, 0) ) / uv.y;
    
    float T = iTime;
    
    // rotate the uv
    float l = length(uv);
    uv *= rot( l * 0.5);
    uv *= uv/l * 4.0;		// detail resolution
        
    // set some colors
    vec3 color;
    for( int i = 0; i < 3; i++){
        float v = length( mod(uv, 0.5) - uv.x * 0.25 );
        uv.y *= ((sin( v * 5.0) ) * 0.5) * ((sin(T - length(uv) * 0.5 ) + M_PI) * 0.4);
        color[i] = cos(T + pow(length(uv), float(i) * 0.25));
    }

    vec3 color2 = vec3(pow(uv.y, 1.0) * 0.5);
    fragColor = vec4( mix(color, color2, length(uv) * 0.5), 1.0);
}