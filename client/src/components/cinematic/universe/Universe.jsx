import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import StarField from './StarField'
import NebulaClouds from './NebulaClouds'
import Planets from './Planets'
import ReactiveDust from './ReactiveDust'
import CameraRig from './CameraRig'
import SceneLighting from './SceneLighting'

const Universe = () => {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none bg-void">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 200 }}
      >
        <color attach="background" args={['#060608']} />
        <SceneLighting />

        <Suspense fallback={null}>
          <StarField />
          <NebulaClouds />
          <Planets />
          <ReactiveDust />
        </Suspense>

        <CameraRig />

        <EffectComposer multisampling={0}>
          <DepthOfField focusDistance={0.01} focalLength={0.05} bokehScale={3} height={480} />
          <Bloom intensity={0.75} luminanceThreshold={0.18} luminanceSmoothing={0.9} mipmapBlur radius={0.75} />
          <Vignette eskil={false} offset={0.18} darkness={0.92} />
        </EffectComposer>
      </Canvas>

      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 40%, transparent 35%, rgba(6,6,8,0.65) 100%)' }}
      />
    </div>
  )
}

export default Universe
