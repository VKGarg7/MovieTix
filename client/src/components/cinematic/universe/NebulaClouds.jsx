import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const makeCloudTexture = (colorA, colorB) => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, colorA)
  grad.addColorStop(0.4, colorB)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

const CloudBlob = ({ position, scale, color, opacity, speed }) => {
  const ref = useRef()
  const texture = useMemo(() => makeCloudTexture(color.a, color.b), [color])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.z = t * speed
    ref.current.position.y = position[1] + Math.sin(t * speed * 0.5) * 1.5
  })

  return (
    <sprite ref={ref} position={position} scale={scale}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}
const NebulaClouds = () => {
  const clouds = useMemo(
    () => [
      { position: [-18, 6, -35], scale: [42, 42, 1], color: { a: 'rgba(109,92,255,0.4)', b: 'rgba(109,92,255,0.12)' }, opacity: 0.35, speed: 0.006 },
      { position: [18, -10, -48], scale: [38, 38, 1], color: { a: 'rgba(63,216,224,0.3)', b: 'rgba(63,216,224,0.1)' }, opacity: 0.28, speed: -0.005 },
    ],
    []
  )

  return (
    <>
      {clouds.map((c, i) => (
        <CloudBlob key={i} {...c} />
      ))}
    </>
  )
}

export default NebulaClouds
