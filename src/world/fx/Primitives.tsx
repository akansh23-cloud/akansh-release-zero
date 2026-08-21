import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { aspectOf, labelTexture, seeded } from '../../lib/utils'

export interface DataStreamProps {
  start: [number, number, number]
  end: [number, number, number]
  count?: number
  speed?: number
  flow?: number
  color?: string
  hotColor?: string
  radius?: number
  arc?: number
  seed?: number
}

const dummy = new THREE.Object3D()
const tmpColor = new THREE.Color()

export function DataStream({ start, end, count = 22, speed = 0.16, flow = 1, color = '#5ce1ff', hotColor = '#eaffff', radius = 0.05, arc = 0, seed = 3 }: DataStreamProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const offsets = useMemo(() => { const rng = seeded(seed); return Array.from({ length: count }, (_, i) => (i + rng() * 0.4) / count) }, [count, seed])
  const a = useMemo(() => new THREE.Vector3(...start), [start])
  const b = useMemo(() => new THREE.Vector3(...end), [end])
  const mid = useMemo(() => a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, arc, 0)), [a, b, arc])
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(a, mid, b), [a, mid, b])
  useEffect(() => { if (!mesh.current) return; for (let i=0;i<count;i++){ tmpColor.set(i%6===0?hotColor:color); mesh.current.setColorAt(i,tmpColor) } if(mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate=true }, [count,color,hotColor])
  useFrame((state) => { const m=mesh.current; if(!m)return; const t0=state.clock.elapsedTime*speed; for(let i=0;i<count;i++){ const t=(offsets[i]+t0)%1; curve.getPointAt(t,dummy.position); const pulse=.55+Math.sin((t+i*.37)*Math.PI*2)*.3; dummy.scale.setScalar(Math.max(.06,flow)*pulse); dummy.updateMatrix(); m.setMatrixAt(i,dummy.matrix)} m.instanceMatrix.needsUpdate=true })
  return <instancedMesh ref={mesh} args={[undefined,undefined,count]} frustumCulled={false}><sphereGeometry args={[radius,8,8]}/><meshBasicMaterial toneMapped={false} transparent opacity={.95}/></instancedMesh>
}

export function EnergyRing({ position=[0,0,0], scale=1, color='#5ce1ff', active=true, thickness=.04, spin=.4, rotation=[Math.PI/2,0,0] }: {position?:[number,number,number];scale?:number;color?:string;active?:boolean;thickness?:number;spin?:number;rotation?:[number,number,number]}) {
  const ref=useRef<THREE.Mesh>(null)
  useFrame((state,dt)=>{const m=ref.current;if(!m)return;const s=scale*(1+(active?Math.sin(state.clock.elapsedTime*2.4)*.028:0));m.scale.setScalar(s);m.rotation.z+=active?spin*dt:spin*dt*.15})
  return <mesh ref={ref} position={position} rotation={rotation}><torusGeometry args={[1,thickness,10,72]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={active?3.4:.5} metalness={.5} roughness={.2} toneMapped={false}/></mesh>
}

const holoVert=`varying vec2 vUv; varying vec3 vNormalW; varying vec3 vViewDir; void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vNormalW=normalize(mat3(modelMatrix)*normal);vViewDir=normalize(cameraPosition-world.xyz);gl_Position=projectionMatrix*viewMatrix*world;}`
const holoFrag=`precision mediump float; varying vec2 vUv; varying vec3 vNormalW; varying vec3 vViewDir; uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uScan; void main(){float fres=pow(1.0-abs(dot(normalize(vNormalW),normalize(vViewDir))),2.2);float scan=sin((vUv.y*90.0)-uTime*5.0)*0.5+0.5;float sweep=smoothstep(0.46,0.5,abs(fract(vUv.y-uTime*0.16)-0.5));float edge=smoothstep(0.49,0.5,abs(vUv.x-0.5))+smoothstep(0.49,0.5,abs(vUv.y-0.5));float a=(fres*0.85+scan*uScan*0.16+sweep*0.1+edge*0.5)*uOpacity;gl_FragColor=vec4(uColor*(0.7+fres*1.6+edge),clamp(a,0.0,1.0));}`
export function HoloPanel({position=[0,0,0],rotation=[0,0,0],size=[3,2],color='#5ce1ff',opacity=.55,scan=1}:{position?:[number,number,number];rotation?:[number,number,number];size?:[number,number];color?:string;opacity?:number;scan?:number}){
  const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader:holoVert,fragmentShader:holoFrag,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uColor:{value:new THREE.Color(color)},uTime:{value:0},uOpacity:{value:opacity},uScan:{value:scan}}}),[])
  useEffect(()=>{material.uniforms.uColor.value.set(color);material.uniforms.uOpacity.value=opacity;material.uniforms.uScan.value=scan},[material,color,opacity,scan]);useEffect(()=>()=>material.dispose(),[material]);useFrame(state=>{material.uniforms.uTime.value=state.clock.elapsedTime})
  return <mesh position={position} rotation={rotation} material={material}><planeGeometry args={[size[0],size[1],1,1]}/></mesh>
}

export function Label3D({text,position=[0,0,0],rotation=[0,0,0],height=.34,color='#dff4fa',opacity=1,billboard=false,weight=700}:{text:string;position?:[number,number,number];rotation?:[number,number,number];height?:number;color?:string;opacity?:number;billboard?:boolean;weight?:number}){
  const ref=useRef<THREE.Mesh>(null);const tex=useMemo(()=>labelTexture(text,{color,weight}),[text,color,weight]);const aspect=useMemo(()=>aspectOf(tex),[tex]);useFrame(({camera})=>{if(billboard&&ref.current)ref.current.quaternion.copy(camera.quaternion)})
  return <mesh ref={ref} position={position} rotation={rotation}><planeGeometry args={[height*aspect,height]}/><meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false}/></mesh>
}

const shaftFrag=`precision mediump float; varying vec2 vUv; uniform vec3 uColor; uniform float uTime; uniform float uIntensity; void main(){float fade=pow(1.0-vUv.y,1.8);float flicker=0.86+0.14*sin(uTime*3.1+vUv.y*8.0);float edge=smoothstep(0.0,0.32,vUv.x)*smoothstep(1.0,0.68,vUv.x);gl_FragColor=vec4(uColor,fade*edge*uIntensity*flicker*0.42);}`
const shaftVert=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
export function LightShaft({position=[0,0,0],radiusTop=.12,radiusBottom=2.2,height=7,color='#5ce1ff',intensity=1}:{position?:[number,number,number];radiusTop?:number;radiusBottom?:number;height?:number;color?:string;intensity?:number}){
  const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader:shaftVert,fragmentShader:shaftFrag,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uColor:{value:new THREE.Color(color)},uTime:{value:0},uIntensity:{value:intensity}}}),[]);useEffect(()=>{material.uniforms.uColor.value.set(color);material.uniforms.uIntensity.value=intensity},[material,color,intensity]);useEffect(()=>()=>material.dispose(),[material]);useFrame(state=>{material.uniforms.uTime.value=state.clock.elapsedTime});return <mesh position={position} material={material}><cylinderGeometry args={[radiusTop,radiusBottom,height,24,1,true]}/></mesh>
}

export function Shockwave({trigger,position=[0,0,0],color='#5ce1ff',max=8,speed=1.5,rotation=[-Math.PI/2,0,0]}:{trigger:number;position?:[number,number,number];color?:string;max?:number;speed?:number;rotation?:[number,number,number]}){
  const ref=useRef<THREE.Mesh>(null),progress=useRef(1),lastTrigger=useRef(trigger);useFrame((_,dt)=>{if(trigger!==lastTrigger.current){lastTrigger.current=trigger;progress.current=0}const m=ref.current;if(!m)return;progress.current=Math.min(1,progress.current+dt*speed);const t=progress.current;m.scale.setScalar(.2+t*max);(m.material as THREE.MeshBasicMaterial).opacity=(1-t)*.75;m.visible=t<1});return <mesh ref={ref} position={position} rotation={rotation} visible={false}><ringGeometry args={[.85,1,64]}/><meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} depthWrite={false}/></mesh>
}

export function MetalBox({position,scale,emissive='#081012',intensity=.18,color='#131a1e'}:{position:[number,number,number];scale:[number,number,number];emissive?:string;intensity?:number;color?:string}){return <mesh position={position} scale={scale}><boxGeometry/><meshStandardMaterial color={color} metalness={.9} roughness={.32} emissive={emissive} emissiveIntensity={intensity}/></mesh>}
