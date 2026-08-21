import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useMission } from '../../state/mission'
import ParticleField from '../fx/Particles'
import { Label3D } from '../fx/Primitives'

const STAGE_GATES = ['BUILD', 'VERIFY', 'APPROVE', 'PACKAGE', 'DEPLOY']

function SpeedLines({ speed }: { speed: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null), dummy = useMemo(()=>new THREE.Object3D(),[]), count=90
  const lanes=useMemo(()=>Array.from({length:count},(_,i)=>({angle:(i/count)*Math.PI*2+Math.random()*.4,radius:1.6+Math.random()*3.2,z:-20+Math.random()*44,speed:.7+Math.random()*.8})),[])
  useFrame((_,dt)=>{const m=mesh.current;if(!m)return;lanes.forEach((l,i)=>{l.z+=dt*44*l.speed*speed;if(l.z>24)l.z=-22;dummy.position.set(Math.cos(l.angle)*l.radius,Math.sin(l.angle)*l.radius,l.z);dummy.scale.set(.02,.02,.4+speed*3.4*l.speed);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});m.instanceMatrix.needsUpdate=true})
  return <instancedMesh ref={mesh} args={[undefined,undefined,count]} frustumCulled={false}><boxGeometry/><meshBasicMaterial color="#bfefff" transparent opacity={.5} toneMapped={false}/></instancedMesh>
}

export default function RailZone(){
  const stage=useMission(s=>s.stage),active=stage==='rail-intro'||stage==='rail-run',running=stage==='rail-run';const capsule=useRef<THREE.Group>(null),ribs=useRef<THREE.Mesh[]>([]),gates=useRef<THREE.Group[]>([]),velocity=useRef(0),ribCount=30
  useFrame((state,dt)=>{const t=state.clock.elapsedTime;velocity.current=THREE.MathUtils.damp(velocity.current,running?1:.08,2.2,dt);const v=velocity.current;if(capsule.current){capsule.current.position.z=running?-6-((t*26)%34):6;capsule.current.rotation.z=Math.sin(t*9)*(running?.05:.006);capsule.current.position.x=Math.sin(t*1.6)*(running?.22:.02);capsule.current.position.y=.4+Math.sin(t*2.3)*(running?.1:.02)}ribs.current.forEach((m,i)=>{if(!m)return;const base=-22+i*1.55;m.position.z=running?((base+t*26+22)%46)-22:base;m.rotation.z+=dt*(.2+v*1.6)*(i%2?1:-1);(m.material as THREE.MeshBasicMaterial).opacity=(i%5===0?.85:.2)*(.4+v*.7)});gates.current.forEach((g,i)=>{if(!g)return;const base=-18+i*8;g.position.z=running?((base+t*26+22)%46)-22:base;const near=1-Math.min(1,Math.abs(g.position.z+4)/8);g.scale.setScalar(.9+near*.25)})})
  if(!active)return null
  return <group position={[0,0,-84]}><ambientLight intensity={.08}/><pointLight position={[0,2,4]} intensity={12} distance={22} color="#5ce1ff"/><pointLight position={[0,0,-14]} intensity={running?18:4} distance={26} color="#ff5a3c"/><ParticleField count={running?420:180} spread={34} colorA="#5ce1ff" colorB="#ffffff" rise={running?3.4:.6} size={2.2} turbulence={.3} opacity={.8} seed={41}/><SpeedLines speed={running?1:.12}/>
    {Array.from({length:ribCount},(_,i)=><mesh key={i} ref={el=>{if(el)ribs.current[i]=el}} position={[0,0,-22+i*1.55]} rotation={[0,0,i*.11]}><torusGeometry args={[4.8,.07,6,56]}/><meshBasicMaterial color={i%5===0?'#ff5a3c':'#5ce1ff'} transparent opacity={.3} toneMapped={false}/></mesh>)}
    {STAGE_GATES.map((label,i)=><group key={label} ref={el=>{if(el)gates.current[i]=el}} position={[0,0,-18+i*8]}><mesh><torusGeometry args={[4.2,.18,8,6]}/><meshStandardMaterial color="#1b262b" metalness={.9} roughness={.3} emissive="#0d4757" emissiveIntensity={1.6}/></mesh><Label3D text={label} position={[0,3.1,0]} height={.36} color="#bfeaf7" billboard/></group>)}
    <mesh position={[0,-5.4,-2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[16,56]}/><meshStandardMaterial color="#060a0c" metalness={.88} roughness={.32}/></mesh><group ref={capsule} position={[0,.4,6]}><mesh rotation={[Math.PI/2,0,0]}><capsuleGeometry args={[.86,1.8,8,24]}/><meshPhysicalMaterial color="#141b1f" metalness={.96} roughness={.14} clearcoat={1} emissive="#0d3d4c" emissiveIntensity={.8}/></mesh><mesh position={[0,0,1.7]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.86,1.1,24]}/><meshStandardMaterial color="#20292e" metalness={.95} roughness={.2}/></mesh><mesh position={[0,0,-1.9]}><sphereGeometry args={[.5,16,16]}/><meshBasicMaterial color="#ffd8a8" toneMapped={false} transparent opacity={running?.95:.35}/></mesh><pointLight color="#ff8a5c" intensity={running?16:5} distance={8} position={[0,0,-2]}/></group>
  </group>
}
