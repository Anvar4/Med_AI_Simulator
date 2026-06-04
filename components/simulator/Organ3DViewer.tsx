'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
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
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSelectPart(null)}
      >
        <color attach='background' args={['#0a1424']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 6, 5]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-5, 2, -4]} intensity={0.4} />

        <Suspense fallback={null}>
          {Model ? <Model selectedPart={selectedPart} onSelect={onSelectPart} /> : null}
          <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={8} blur={2.5} far={4} />
          <Environment preset='city' />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={8}
          autoRotate={!selectedPart}
          autoRotateSpeed={0.6}
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
