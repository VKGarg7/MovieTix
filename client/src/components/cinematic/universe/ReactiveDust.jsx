import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const ReactiveDust = ({ count = 130 }) => {
  const ref = useRef()
  const { pointer, viewport } = useThree()

  const { positions, base } = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18
      arr[i * 3 + 2] = -5 - Math.random() * 10
    }
    return { positions: arr, base: arr.slice() }
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    const mx = pointer.x * viewport.width * 0.5
    const my = pointer.y * viewport.height * 0.5

    const posAttr = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const bx = base[ix] + Math.sin(t * 0.06 + i) * 0.4
      const by = base[ix + 1] + Math.cos(t * 0.05 + i) * 0.4
      const dx = bx - mx
      const dy = by - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      const push = dist < 6 ? (6 - dist) * 0.15 : 0
      const nx = dist > 0.001 ? dx / dist : 0
      const ny = dist > 0.001 ? dy / dist : 0

      posAttr.array[ix] = bx + nx * push
      posAttr.array[ix + 1] = by + ny * push
      posAttr.array[ix + 2] = base[ix + 2]
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cfd8ff" size={0.06} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  )
}

export default ReactiveDust
