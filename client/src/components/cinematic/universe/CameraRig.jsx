import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { scrollState } from '../../../lib/scrollStore'
import { prefersReducedMotion } from '../../../lib/prefersReducedMotion'

const CameraRig = () => {
  const { camera, pointer } = useThree()
  const target = useRef({ x: 0, y: 0 })
  const scroll = useRef(0)
  const reduced = useRef(prefersReducedMotion())

  useFrame(() => {
    if (reduced.current) {
      camera.position.x += (0 - camera.position.x) * 0.05
      camera.position.y += (0 - camera.position.y) * 0.05
      camera.position.z += (10 - camera.position.z) * 0.05
      camera.lookAt(0, 0, -30)
      return
    }

    target.current.x += (pointer.x - target.current.x) * 0.02
    target.current.y += (pointer.y - target.current.y) * 0.02

    scroll.current += (scrollState.progress - scroll.current) * 0.04

    const dollyZ = 12 - scroll.current * 6 
    const driftX = target.current.x * 1.4 + Math.sin(scroll.current * Math.PI) * 1.5
    const driftY = -target.current.y * 1.0 + scroll.current * 2.2

    camera.position.x += (driftX - camera.position.x) * 0.05
    camera.position.y += (driftY - camera.position.y) * 0.05
    camera.position.z += (dollyZ - camera.position.z) * 0.03
    camera.rotation.z += (scroll.current * 0.03 - camera.rotation.z) * 0.05

    camera.lookAt(0, 0, -30)
  })

  return null
}

export default CameraRig
