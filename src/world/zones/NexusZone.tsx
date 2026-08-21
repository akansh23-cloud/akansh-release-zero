import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PIPELINE_ORDER, useMission } from '../../state/mission'
import HoloGrid from '../fx/HoloGrid'
import ParticleField from '../fx/Particles'
import { DataStream, EnergyRing, Label3D, LightShaft, Shockwave } from '../fx/Primitives'

const palette = ['#5ce1ff', '#ffb545', '#4dffa0', '#ff5a3c', '#a682ff', '#e9f1f4', '#6fd8c9']

export default function NexusZone() {
  const stage=useMission(s=>s.stage), seq=useMission(s=>s.pipelineSequence), refs=useRef<THREE.Group[]>([]), knot=useRef<THREE.Mesh>(null)
  const active=stage.startsWith('nexus')||stage==='reveal', reveal=stage==='reveal'
  const orbits=useMemo(()=>PIPELINE_ORDER.map((_,i)=>{const a=(i/PIPELINE_ORDER.length)*Math.PI*2;return [Math.cos(a)*5.4,Math.sin(a*.7)*1.3+1.3,Math.sin(a)*5.4] as [number,number,number]}),[])
  useFrame((state,dt)=>{const t=state.clock.elapsedTime;refs.current.forEach((g,i)=>{if(!g)return;const locked=seq.includes(PIPELINE_ORDER[i])||reveal,orbit=orbits[i];const target=locked?new THREE.Vector3(0,(i-3)*.4,0):new THREE.Vector3(orbit[0]*(1+Math.sin(t*.4+i)*.04),orbit[1]+Math.sin(t*.9+i)*.18,orbit[2]*(1+Math.cos(t*.4+i)*.04));g.position.lerp(target,1-Math.exp(-dt*(locked?4.2:1.6)));if(locked){g.rotation.y=THREE.MathUtils.damp(g.rotation.y,0,4,dt);g.rotation.z=THREE.MathUtils.damp(g.rotation.z,0,4,dt)}else{g.rotation.y+=dt*.55;g.rotation.z=Math.sin(t*.7+i)*.12}});if(knot.current){knot.current.rotation.y+=dt*.18;knot.current.rotation.x+=dt*.07;const mat=knot.current.material as THREE.MeshStandardMaterial;mat.emissiveIntensity=THREE.MathUtils.damp(mat.emissiveIntensity,reveal?3.4:1.6+seq.length*.24,3,dt)}})
  if(!active)return null
  const progress=reveal?1:seq.length/PIPELINE_ORDER.length
  return <group position={[0,0,-198]}>
    <ambientLight intensity={.14}/><pointLight position={[0,5.5,2]} intensity={14} distance={28} color={reveal?'#eaf6fa':'#5ce1ff'}/><pointLight position={[-7,2,5]} intensity={6} distance={16} color="#a682ff"/><pointLight position={[7,2,5]} intensity={6} distance={16} color="#ff5a3c"/>
    <HoloGrid position={[0,-2.48,0]} size={90} color="#0a2b3a" accent={reveal?'#eaf6fa':'#5ce1ff'} scale={30} pulse={progress*.6} wave={.45}/><mesh position={[0,-2.52,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[38,34]}/><meshStandardMaterial color="#05080a" metalness={.88} roughness={.4}/></mesh>
    <ParticleField count={340} spread={30} colorA="#5ce1ff" colorB={reveal?'#ffffff':'#a682ff'} rise={.34} size={2.6} opacity={.8} position={[0,1.5,0]} seed={83}/>
    <EnergyRing position={[0,1.3,0]} scale={3.8} color={reveal?'#eaf6fa':'#5ce1ff'} spin={.16} thickness={.03}/><EnergyRing position={[0,1.3,0]} scale={4.6} color="#a682ff" rotation={[Math.PI/2,.4,0]} spin={-.1} thickness={.018}/>
    <mesh ref={knot} position={[0,1.3,0]}><torusKnotGeometry args={[1.4,.26,160,20]}/><meshStandardMaterial color="#1d272c" metalness={.96} roughness={.16} emissive={reveal?'#2a7d92':'#0a1f27'} emissiveIntensity={1.6}/></mesh>
    {PIPELINE_ORDER.map((name,i)=>{const locked=seq.includes(name)||reveal;return <group key={name} ref={el=>{if(el)refs.current[i]=el}} position={orbits[i]}><mesh scale={[1.15,.34,.78]}><boxGeometry/><meshStandardMaterial color="#131b1f" metalness={.92} roughness={.24} emissive={palette[i]} emissiveIntensity={locked?2.6:.4}/></mesh><mesh position={[0,-.28,0]} scale={[.5,.05,.5]}><cylinderGeometry args={[1,1,1,20]}/><meshBasicMaterial color={palette[i]} toneMapped={false} transparent opacity={locked?1:.4}/></mesh><Label3D text={name} position={[0,.42,0]} height={.2} color={locked?palette[i]:'#5c6a71'} billboard/></group>})}
    <Shockwave trigger={reveal?1:0} position={[0,-2.4,0]} color="#eaf6fa" max={18} speed={.9}/>
    {reveal&&<group position={[0,1.6,-6]}><LightShaft position={[0,1.5,0]} height={11} radiusTop={.4} radiusBottom={5} color="#eaf6fa" intensity={.5}/><Label3D text="AKANSH MOWAR" position={[0,1.5,0]} height={.95} color="#f2fbff"/><Label3D text="DEVOPS · PLATFORM · CLOUD" position={[0,.6,0]} height={.3} color="#8fb3bf"/><DataStream start={[-7,-.6,0]} end={[7,-.6,0]} count={26} speed={.12} color="#5ce1ff" hotColor="#ffffff" arc={.8}/></group>}
    {!reveal&&<Label3D text={`GOLDEN PATH  ${seq.length}/${PIPELINE_ORDER.length}`} position={[0,5.6,-5]} height={.42} color={progress===1?'#4dffa0':'#7d8f97'} billboard/>}
  </group>
}
