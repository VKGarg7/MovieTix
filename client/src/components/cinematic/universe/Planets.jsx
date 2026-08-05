import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../../lib/scrollStore'
import { prefersReducedMotion } from '../../../lib/prefersReducedMotion'

const Planet = ({ basePosition, radius, color, emissive, ring, orbitSpeed, orbitRadius, spinSpeed, scrollDrift }) => {
  const group = useRef()
  const mesh = useRef()
  const smoothedScroll = useRef(0)
  const reduced = useRef(prefersReducedMotion())

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    if (reduced.current) {
      if (group.current) group.current.position.set(...basePosition)
      if (mesh.current) mesh.current.rotation.y = t * spinSpeed * 0.25
      return
    }

    smoothedScroll.current += (scrollState.progress - smoothedScroll.current) * 0.04

    if (group.current) {
      group.current.position.x = basePosition[0] + Math.cos(t * orbitSpeed) * orbitRadius + smoothedScroll.current * scrollDrift[0]
      group.current.position.y = basePosition[1] + Math.sin(t * orbitSpeed * 0.7) * (orbitRadius * 0.4) + smoothedScroll.current * scrollDrift[1]
      group.current.position.z = basePosition[2] + smoothedScroll.current * scrollDrift[2]
    }
    if (mesh.current) {
      mesh.current.rotation.y = t * spinSpeed + smoothedScroll.current * Math.PI
      mesh.current.rotation.x = smoothedScroll.current * 0.6
    }
  })

  return (
    <group ref={group} position={basePosition}>
      <mesh ref={mesh}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.35}
          roughness={0.65}
          metalness={0.25}
        />
      </mesh>
      {ring && (
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[radius * 1.5, radius * 2.1, 64]} />
          <meshBasicMaterial color={ring} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[radius * 1.15, 32, 32]} />
        <meshBasicMaterial color={emissive} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

const HERO_PLANET = {
  basePosition: [13, -4, -30],
  radius: 3.6,
  color: '#6D5CFF',
  emissive: '#6D5CFF',
  ring: '#9d8fff',
  orbitSpeed: 0.015,
  orbitRadius: 0.8,
  spinSpeed: 0.06,
  scrollDrift: [-3, 3, -6],
}

const Planets = () => <Planet {...HERO_PLANET} />

export default Planets
