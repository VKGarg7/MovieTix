import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

const PosterMesh = ({ src, hovered }) => {
  const texture = useLoader(TextureLoader, src)
  const group = useRef()
  const mesh = useRef()
  const target = useRef({ rx: 0, ry: 0 })

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    if (!group.current) return

    group.current.rotation.y = Math.sin(t * 0.25) * 0.18 + (hovered ? target.current.ry : 0)

    const { pointer } = state
    target.current.ry += ((pointer.x * 0.35) - target.current.ry) * 0.08
    target.current.rx += ((-pointer.y * 0.2) - target.current.rx) * 0.08

    if (mesh.current) {
      mesh.current.rotation.x = target.current.rx * (hovered ? 1 : 0)
      const targetZ = hovered ? 0.9 : 0
      mesh.current.position.z += (targetZ - mesh.current.position.z) * 0.08
      const targetY = hovered ? 0.15 : 0
      mesh.current.position.y += (targetY - mesh.current.position.y) * 0.08
    }
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} castShadow>
        <planeGeometry args={[3.1, 4.5]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.35}
          metalness={0.15}
          emissive={hovered ? '#F84565' : '#000000'}
          emissiveIntensity={hovered ? 0.12 : 0}
        />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.3, 4.7]} />
        <meshBasicMaterial color="#F84565" transparent opacity={hovered ? 0.25 : 0.08} />
      </mesh>
    </group>
  )
}

const Lighting = ({ hovered }) => {
  const key = useRef()
  useFrame((state) => {
    if (!key.current) return
    const t = state.clock.getElapsedTime()
    key.current.intensity = (hovered ? 2.6 : 1.6) + Math.sin(t * 2) * 0.15
  })
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight ref={key} position={[3, 3, 4]} color="#F84565" intensity={1.6} />
      <pointLight position={[-3, -2, 3]} color="#6D5CFF" intensity={0.9} />
      <pointLight position={[0, 4, -2]} color="#3FD8E0" intensity={0.5} />
    </>
  )
}

const CameraZoom = ({ hovered }) => {
  useFrame((state) => {
    const targetZ = hovered ? 5.4 : 6
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.06
  })
  return null
}

const FloatingPoster = ({ src }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative w-full h-[420px] md:h-[560px] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ filter: hovered ? 'drop-shadow(0 40px 80px rgba(248,69,101,0.35))' : 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))', transition: 'filter 0.5s ease' }}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ alpha: true, antialias: true }}>
        <Lighting hovered={hovered} />
        <CameraZoom hovered={hovered} />
        <Suspense fallback={null}>
          <PosterMesh src={src} hovered={hovered} />
        </Suspense>
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 mix-blend-screen"
        style={{
          opacity: hovered ? 0.5 : 0.22,
          background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 48%, transparent 62%)",
          backgroundSize: "220% 220%",
          backgroundPosition: hovered ? "80% 20%" : "20% 80%",
          transition: "background-position 0.8s ease, opacity 0.5s ease",
        }}
      />
    </div>
  )
}

export default FloatingPoster
