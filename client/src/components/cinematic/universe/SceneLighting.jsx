import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../../lib/scrollStore'

const ACTS = [
  { fog: '#0a0a14', key: '#F84565', fill: '#6D5CFF', rim: '#3FD8E0' },
  { fog: '#140a12', key: '#FFB86B', fill: '#F84565', rim: '#6D5CFF' },
  { fog: '#0a1416', key: '#3FD8E0', fill: '#6D5CFF', rim: '#FFB86B' },
]

const c1 = new THREE.Color()
const c2 = new THREE.Color()

const lerpHex = (a, b, t) => {
  c1.set(a)
  c2.set(b)
  return c1.lerp(c2, t).getStyle()
}

const SceneLighting = () => {
  const fogRef = useRef()
  const keyRef = useRef()
  const fillRef = useRef()
  const rimRef = useRef()
  const smoothed = useRef(0)

  useFrame(() => {
    smoothed.current += (scrollState.progress - smoothed.current) * 0.05

    const scaled = smoothed.current * (ACTS.length - 1)
    const i = Math.min(ACTS.length - 2, Math.floor(scaled))
    const t = scaled - i
    const a = ACTS[i]
    const b = ACTS[i + 1]

    if (fogRef.current) fogRef.current.color.set(lerpHex(a.fog, b.fog, t))
    if (keyRef.current) keyRef.current.color.set(lerpHex(a.key, b.key, t))
    if (fillRef.current) fillRef.current.color.set(lerpHex(a.fill, b.fill, t))
    if (rimRef.current) rimRef.current.color.set(lerpHex(a.rim, b.rim, t))
  })

  return (
    <>
      <fog ref={fogRef} attach="fog" args={['#0a0a14', 18, 70]} />
      <ambientLight intensity={0.25} />
      <pointLight ref={keyRef} position={[10, 10, 10]} intensity={1.2} color="#F84565" distance={60} />
      <pointLight ref={fillRef} position={[-15, -8, -10]} intensity={0.9} color="#6D5CFF" distance={60} />
      <pointLight ref={rimRef} position={[0, 15, -30]} intensity={0.6} color="#3FD8E0" distance={80} />
    </>
  )
}

export default SceneLighting
