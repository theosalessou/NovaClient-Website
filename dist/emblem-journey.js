// Shared camera and orbital typography composition. No browser dependencies.
export const PARTS = Object.freeze([
 { id:'model-feel', title:'13 input modes', subtitle:'Find your timing.', tone:0x8733bb, feature:0 },
 { id:'model-practice', title:'Fast Practice', subtitle:'One more try.', tone:0x7929b6, feature:1 },
 { id:'model-view', title:'Your perspective', subtitle:'Your view. Your rhythm.', tone:0x8839bf, feature:2 },
 { id:'model-connect', title:'Team connection', subtitle:'Better together.', tone:0x923bc2, feature:3 }
]);
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function cameraDistance(aspect, radius=3.65) {
 return radius/(Math.tan(Math.PI/10)*Math.min(1,Math.max(.1,aspect))*.88)+1.4;
}
export function orbitCard(index, progress, width, height) {
 const compact=width<800||height<560;
 const angle=(index-progress)*Math.PI/2;
 const radius=Math.min(width*(compact?.66:.32),620);
 const depth=compact?110:200;
 const z=Math.cos(angle)*depth;
 const scale=1100/(1100-z);
 const cardWidth=compact?Math.min(width-44,360):Math.min(400,Math.max(300,width*.25));
 const x=width/2+Math.sin(angle)*radius;
 const y=height*(compact?(height<560?.66:.74):.70)+Math.sin(angle*2)*height*.045;
 const facing=Math.cos(angle);
 return {x,y,z,scale,angle:angle*180/Math.PI,width:cardWidth,
   opacity:clamp((facing+.1)/.45),front:facing>0,interactive:facing>.72&&Math.abs(index-progress)<.55};
}
export function composeJourney({width,height,hero,story,scroll=0,still=false,reading=false}) {
 width=Math.max(1,width);height=Math.max(1,height);
 const travel=Math.max(1,story.height-height);
 const progress=clamp(-story.top/travel*3,-.85,3.85);
 const station=clamp(progress,0,3);
 const part=PARTS[Math.round(station)];
 // Continuous flight between four physical tips; no abrupt station teleport.
 const stops=[[0,1.65,.55],[-1.65,0,.55],[0,-1.65,.55],[1.65,0,.55]];
 const a=Math.floor(station),b=Math.min(3,a+1),t=station-a,u=t*t*(3-2*t);
 const entrance=clamp((height*.85-story.top)/(height*.55));
 const departure=clamp((story.top+story.height-height*.1)/(height*.4));
 const intensity=still||reading?0:entrance*departure;
 const focus=stops[a].map((v,i)=>(v+(stops[b][i]-v)*u)*intensity);
 const inStory=story.top<height*.65&&story.top+story.height>height*.3;
 return {x:0,y:0,size:width,width,height,opacity:reading?.16:1,inView:true,inStory,
 progress,part:part.id,pose:{x:.12+Math.sin(station*1.6)*.22,y:-.25+Math.sin(station*1.7)*.45,z:-.10+Math.sin(station*1.3)*.18,
 passive:!reading,reveal:intensity,zoom:1+intensity*(width<800?1.55:2.05),fx:focus[0],fy:focus[1],fz:focus[2],tone:part.tone,energy:inStory?.55:.25,feature:part.feature,
 phase:still?0:scroll/Math.max(1,height)*.28}};
}
export const OVERVIEW=Object.freeze({x:.08,y:-.25,z:-.10,zoom:1,fx:0,fy:0,fz:0,tone:0x8733bb,energy:.25,feature:0,phase:0});

// Authored drone route, in model-local units. Front -> aperture -> rear reveal.
export function cinematicFlight(t,distance){
 t=clamp(t);
 // Long front/rear explorations; only4% of scroll belongs to the aperture jump.
 const keys=[[0,0,.3,distance,0,0,0],[.10,0,2.1,6,0,2,0],[.20,2.1,0,6,2,0,0],[.30,0,-2.1,6,0,-2,0],[.40,-2.1,0,6,-2,0,0],[.44,0,0,5,0,0,-3],[.50,0,0,1.5,0,0,-4],[.56,0,0,-1.5,0,0,-5],[.62,0,0,-5,0,0,-8],[.68,0,0,-6,0,0,0],[.74,-2.1,0,-6,-2,0,0],[.83,0,-2.1,-6,0,-2,0],[.92,2.1,0,-6,2,0,0],[.975,0,2.1,-6,0,2,0],[1,0,.3,-12,0,0,0]];
 let k=0;while(k<keys.length-2&&t>keys[k+1][0])k++;
 const a=keys[k],b=keys[k+1],v=clamp((t-a[0])/(b[0]-a[0])),u=v*v*(3-2*v);
 const turn=clamp((t-.62)/.06),yaw=turn*turn*(3-2*turn)*Math.PI;
 return {position:a.slice(1,4).map((x,i)=>x+(b[i+1]-x)*u),look:a.slice(4).map((x,i)=>x+(b[i+4]-x)*u),yaw,roll:Math.sin(clamp((t-.44)/.24)*Math.PI)*.12,transit:t>.44&&t<.68};
}
