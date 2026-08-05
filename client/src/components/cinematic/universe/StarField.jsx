import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Layer = ({ count, radius, size, speed, color }) => {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = radius * (0.4 + Math.random() * 0.6)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count, radius])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * speed
    ref.current.rotation.x += delta * speed * 0.3
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  )
}
const StarField = () => {
  return (
    <>
      <Layer count={325} radius={60} size={0.13} speed={0.0022} color="#ffffff" />
      <Layer count={110} radius={36} size={0.2} speed={0.005} color="#bcd4ff" />
    </>
  )
}

export default StarField
