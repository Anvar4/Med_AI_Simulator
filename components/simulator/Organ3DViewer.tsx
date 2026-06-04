'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { RotateCcw } from 'lucide-react'
import { ORGAN_MODEL_COMPONENTS } from './OrganModels'

interface Organ3DViewerProps {
  organKey: string
  selectedPart: string | null
  onSelectPart: (partId: string | null) => void
  className?: string
}

/**
 * Self-contained Three.js viewer (replaces the BioDigital iframe). Renders the
 * procedural model for `organKey`, lets the user orbit/zoom, and reports the
 * clicked part id upward. Clicking empty space clears the selection.
 */
export default function Organ3DViewer({ organKey, selectedPart, onSelectPart, className = '' }: Organ3DViewerProps) {
  const Model = ORGAN_MODEL_COMPONENTS[organKey]

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.2], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onPointerMissed={() => onSelectPart(null)}
      >
        {/* Soft radial backdrop instead of a flat color */}
        <color attach='background' args={['#0c1626']} />
        <fog attach='fog' args={['#0c1626', 7, 14]} />

        {/* Studio 3-point lighting for soft, fleshy highlights */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 6, 5]} intensity={2.0} color='#fff4ec'
          castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002}
        />
        <directionalLight position={[-6, 1, -3]} intensity={0.6} color='#9db8ff' />
        {/* Rim light to separate the organ from the background */}
        <spotLight position={[0, 3, -6]} angle={0.6} penumbra={1} intensity={2.2} color='#ffd9d0' />
        {/* Warm fill from below (fleshy translucency feel) */}
        <pointLight position={[0, -3, 2]} intensity={0.8} color='#ff8a7a' distance={10} decay={2} />

        <Suspense fallback={null}>
          {Model ? <Model selectedPart={selectedPart} onSelect={onSelectPart} /> : null}
          <ContactShadows position={[0, -1.7, 0]} opacity={0.55} scale={9} blur={3} far={4.5} resolution={1024} color='#000000' />
          <Environment preset='studio' environmentIntensity={0.7} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={8}
          autoRotate={!selectedPart}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.08}
          makeDefault
        />
      </Canvas>

      {/* Hint */}
      <div className='absolute bottom-4 left-4 z-10 pointer-events-none'>
        <div className='px-3 py-1.5 rounded-lg bg-surface/70 backdrop-blur-sm border border-border text-[11px] text-text-secondary'>
          Sichqoncha bilan aylantiring · qismni bosing
        </div>
      </div>

      {/* Reset selection */}
      {selectedPart && (
        <button
          onClick={() => onSelectPart(null)}
          className='absolute bottom-4 right-4 z-10 p-2.5 rounded-xl bg-surface/80 backdrop-blur-sm border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all'
          title='Tanlovni bekor qilish'
        >
          <RotateCcw className='w-4 h-4' />
        </button>
      )}
    </div>
  )
}
