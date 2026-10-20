"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { createAtelierGarment } from "./atelier-garment-mesh";
import styles from "./atelier-garment-3d.module.css";
export type RealisticMannequin3DProps = { shirtTone:string; shirtInk:string; artMark:string; productName:string; productImage?:string; onProductOpen:()=>void };
export function RealisticMannequin3D({shirtTone,shirtInk,artMark,productName,productImage,onProductOpen}:RealisticMannequin3DProps){
 const mount=useRef<HTMLDivElement>(null), garment=useRef<ReturnType<typeof createAtelierGarment>|null>(null), open=useRef(onProductOpen);
 const appearance=useRef({shirtTone,shirtInk,artMark});
 const controls=useRef<{rotate:(n:number)=>void;zoom:(n:number)=>void;reset:()=>void}|null>(null);
 const [fallback,setFallback]=useState(false);
 useEffect(()=>{open.current=onProductOpen},[onProductOpen]);
 useEffect(()=>{appearance.current={shirtTone,shirtInk,artMark};garment.current?.update(shirtTone,shirtInk,artMark)},[shirtTone,shirtInk,artMark]);
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"low-power"})}catch{setFallback(true);return}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText="display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#eeece6");
  const camera=new THREE.PerspectiveCamera(32,1,.1,50);camera.position.set(0,.06,6.8);
  const pivot=new THREE.Group();scene.add(pivot);
  const a=appearance.current,g=createAtelierGarment(a.shirtTone,a.shirtInk,a.artMark);garment.current=g;pivot.add(g.group);
  scene.add(new THREE.HemisphereLight("#ffffff","#aaa298",2.3));
  const key=new THREE.DirectionalLight("#fffdf7",3.2);key.position.set(-2.8,4.6,5.2);scene.add(key);
  const fill=new THREE.DirectionalLight("#f2f4f8",1.6);fill.position.set(3.5,1.4,3.6);scene.add(fill);
  const rim=new THREE.DirectionalLight("#ffffff",2.2);rim.position.set(.7,3.2,-4.4);scene.add(rim);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let ry=-.16,rx=.015,zoom=6.8,velocity=0,drag:number|null=null,moved=false,px=0,py=0;
  let running=false,shown=true,disposed=false,frame=0,last=0,userRotated=false;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render=()=>renderer.render(scene,camera);
  const resize=()=>{if(disposed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<560?43:32;camera.updateProjectionMatrix();render()};
  const hits=(ev:PointerEvent)=>{const r=renderer.domElement.getBoundingClientRect();if(!r.width||!r.height)return false;pointer.set(((ev.clientX-r.left)/r.width)*2-1,-((ev.clientY-r.top)/r.height)*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(g.hitTargets,false).length>0};
  const down=(ev:PointerEvent)=>{if(ev.button!==0||drag!==null)return;drag=ev.pointerId;moved=false;px=ev.clientX;py=ev.clientY;renderer.domElement.setPointerCapture(ev.pointerId);renderer.domElement.style.cursor="grabbing"};
  const move=(ev:PointerEvent)=>{if(drag!==ev.pointerId){if(ev.pointerType==="mouse")renderer.domElement.style.cursor=hits(ev)?"pointer":"grab";return}const dx=ev.clientX-px,dy=ev.clientY-py;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;px=ev.clientX;py=ev.clientY;ry+=dx*.009;rx=THREE.MathUtils.clamp(rx+dy*.0028,-.19,.19);velocity=THREE.MathUtils.clamp(dx*.0012,-.035,.035);userRotated=true};
  const up=(ev:PointerEvent)=>{if(drag!==ev.pointerId)return;const shouldOpen=!moved&&ev.type==="pointerup"&&hits(ev);drag=null;if(renderer.domElement.hasPointerCapture(ev.pointerId))renderer.domElement.releasePointerCapture(ev.pointerId);renderer.domElement.style.cursor="grab";if(shouldOpen)open.current()};
  const wheel=(ev:WheelEvent)=>{if(!ev.ctrlKey&&!ev.metaKey)return;ev.preventDefault();zoom=THREE.MathUtils.clamp(zoom+ev.deltaY*.006,5.1,9.1)};
  const contextLost=(ev:Event)=>{ev.preventDefault();shown=false;pause();setFallback(true)};
  const tick=(time:number)=>{frame=0;if(!running||disposed||document.hidden)return;const dt=Math.min((time-(last||time))/16.667,3);last=time;if(!userRotated&&!reduced)ry=-.16+Math.sin(time*.00028)*.18;if(drag===null){ry+=velocity*dt;velocity*=Math.pow(.91,dt)}pivot.rotation.y=THREE.MathUtils.lerp(pivot.rotation.y,ry,.09*dt);pivot.rotation.x=THREE.MathUtils.lerp(pivot.rotation.x,rx,.09*dt);camera.position.z=THREE.MathUtils.lerp(camera.position.z,zoom,.09*dt);camera.lookAt(0,.02,0);render();frame=requestAnimationFrame(tick)};
  function pause(){running=false;cancelAnimationFrame(frame);frame=0}
  const start=()=>{if(running||disposed||document.hidden||!shown)return;running=true;last=0;frame=requestAnimationFrame(tick)};
  const visibility=()=>document.hidden?pause():start();
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(([e])=>{shown=e.isIntersecting;if(shown)start();else pause()},{threshold:.04});intersection.observe(host);
  const canvas=renderer.domElement;
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);canvas.addEventListener("wheel",wheel,{passive:false});canvas.addEventListener("webglcontextlost",contextLost);
  document.addEventListener("visibilitychange",visibility);
  controls.current={rotate:n=>{userRotated=true;ry+=n*Math.PI/4;velocity=0},zoom:n=>{zoom=THREE.MathUtils.clamp(zoom+n*.6,5.1,9.1)},reset:()=>{ry=-.16;rx=.015;zoom=6.8;velocity=0;userRotated=false}};
  resize();start();
  return ()=>{disposed=true;pause();observer.disconnect();intersection.disconnect();document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);canvas.removeEventListener("wheel",wheel);canvas.removeEventListener("webglcontextlost",contextLost);controls.current=null;garment.current=null;g.dispose();renderer.dispose();if(canvas.parentNode===host)host.removeChild(canvas)};
 },[]);
 return <div className={styles.stage} aria-label={`Interactive 3D garment study of ${productName}`}>
  {fallback?<div className={styles.fallback}>{productImage?<Image src={productImage} alt={productName} fill sizes="(max-width:720px) 100vw,70vw" style={{objectFit:"contain"}}/>:<p>MAISON AMIRAL <span>{productName}</span></p>}<span className={styles.fallbackNotice}>Product study / 3D unavailable on this device</span></div>:<div ref={mount} className={styles.canvas}/>}
  <div className={styles.stageCaption} aria-hidden="true">MA / OBJECT STUDY <span>001</span></div>
  {!fallback&&<div className={styles.controls} role="group" aria-label="3D garment controls">
   <button type="button" aria-label="Rotate left" onClick={()=>controls.current?.rotate(-1)}>←</button>
   <button type="button" aria-label="Rotate right" onClick={()=>controls.current?.rotate(1)}>→</button>
   <span className={styles.separator} aria-hidden="true"/>
   <button type="button" aria-label="Zoom out" onClick={()=>controls.current?.zoom(1)}>−</button>
   <button type="button" aria-label="Zoom in" onClick={()=>controls.current?.zoom(-1)}>+</button>
   <button type="button" className={styles.reset} onClick={()=>controls.current?.reset()}>Reset</button>
  </div>}
 </div>;
}