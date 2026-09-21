// Created by Stephane Cuillerdier - Aiekick/2017
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

float map(vec3 p)
{   
	//p += sin(p.zxy*3.36) * 0.44;
	//p += 0.5 * sin(p.zxy*3.36) * 0.44;
    
    p = mod(p,5.) - 2.5;
    
    //float t = sin(iTime * 0.5);
    
    float sp = length(p) - 2.;
    //float cu = max(abs(p.x), max(abs(p.y), abs(p.z))) - 2.;
    //float tr = max(abs(max(abs(p.x)+p.y,-p.y))+p.z,-p.z) - 2.;
    
    return sp;
}

void mainImage( out vec4 f, in vec2 g )
{
    vec2 si = iResolution.xy;
   	float t = iTime * .2;

    float cd = 6.;
    
   	vec3 ro = vec3(cos(t)*cd, 3., sin(t)*cd);
    vec3 rov = normalize(vec3(0,0,0)-ro);
    vec3 u =  normalize(cross(vec3(0,1,0), rov));
    vec3 v =  cross(rov, u);
    vec2 uv = (g+g-si)/min(si.x, si.y);
    vec3 rd = mat3(u,v,rov) * vec3(uv, 1);
    
    float accum = 0.0;

    float d = 0.;
    float s = 1.;
    for(int i=0;i<200;i++)
    {      
		if(s<0.01||d>80.) break;
        s = map(ro + rd * d);
        
        s = max(abs(s), 0.02);  // Phantom Mode
        
        d += s * 0.5;
        
       	accum += 0.005; // Phantom Mode
   	}

    f = vec4(0) + accum  * (1.0-exp(-0.001*d*d)); // Phantom Mode
}

