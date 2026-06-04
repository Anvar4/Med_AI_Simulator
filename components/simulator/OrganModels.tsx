'use client'

import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ThreeEvent } from '@react-three/fiber'

/**
 * Procedural, code-built organ models for the 3D simulator.
 * No external API / no GLB files — geometry is assembled from primitives with
 * anatomically-inspired proportions. Each clickable region is an <OrganPart>
 * tagged with `partId`, which the viewer maps to localized medical info.
 */

interface PartProps {
  partId: string
  color: string
  selectedPart: string | null
  onSelect: (partId: string) => void
  children?: React.ReactNode
}

/**
 * A selectable/hoverable group. Applies emphasis (emissive + slight scale) to
 * its meshes when hovered or selected. Children are plain meshes/geometry.
 */
export function OrganPart({ partId, color, selectedPart, onSelect, children }: PartProps & { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const isSelected = selectedPart === partId
  const emphasis = isSelected || hovered

  // Shared material so all child meshes in this part look consistent.
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.55,
    metalness: 0.05,
  }), [color])

  material.emissive = new THREE.Color(isSelected ? '#2f80ed' : hovered ? color : '#000000')
  material.emissiveIntensity = isSelected ? 0.5 : hovered ? 0.35 : 0

  return (
    <group
      ref={groupRef}
      scale={emphasis ? 1.04 : 1}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(partId) }}
    >
      {/* Inject the shared material into every child mesh */}
      {wrapWithMaterial(children, material)}
    </group>
  )
}

// Clone children meshes and assign the shared material.
function wrapWithMaterial(children: React.ReactNode, material: THREE.Material): React.ReactNode {
  return <PartMaterialContext.Provider value={material}>{children}</PartMaterialContext.Provider>
}
import { createContext, useContext } from 'react'
const PartMaterialContext = createContext<THREE.Material | null>(null)

/** A mesh that uses the material provided by its enclosing OrganPart. */
function M({ geometry, position, rotation, scale }: {
  geometry: THREE.BufferGeometry
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number] | number
}) {
  const material = useContext(PartMaterialContext)!
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} scale={scale} castShadow receiveShadow />
}

type ModelProps = { selectedPart: string | null; onSelect: (id: string) => void }

// Reusable geometries (memoized at module level via factory in components).
function sphere(r: number, seg = 32) { return new THREE.SphereGeometry(r, seg, seg) }
function capsule(r: number, len: number) { return new THREE.CapsuleGeometry(r, len, 8, 24) }
function cylinder(rt: number, rb: number, h: number) { return new THREE.CylinderGeometry(rt, rb, h, 24) }

// ─── HEART ─────────────────────────────────────────────────────
export function HeartModel({ selectedPart, onSelect }: ModelProps) {
  const g = useMemo(() => ({
    chamber: sphere(0.62),
    chamberSm: sphere(0.5),
    atrium: sphere(0.4),
    aorta: cylinder(0.16, 0.2, 1.1),
    aortaArch: new THREE.TorusGeometry(0.28, 0.13, 16, 24, Math.PI),
  }), [])
  return (
    <group scale={1.1}>
      <OrganPart partId='left-ventricle' color='#b3322f' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.chamber} position={[-0.25, -0.35, 0]} scale={[1, 1.25, 1]} />
      </OrganPart>
      <OrganPart partId='right-ventricle' color='#c25450' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.chamberSm} position={[0.35, -0.3, 0.1]} scale={[1, 1.15, 1]} />
      </OrganPart>
      <OrganPart partId='left-atrium' color='#9c4a6e' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.atrium} position={[-0.32, 0.45, -0.1]} />
      </OrganPart>
      <OrganPart partId='right-atrium' color='#a85d57' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.atrium} position={[0.4, 0.42, 0]} scale={0.95} />
      </OrganPart>
      <OrganPart partId='aorta' color='#d98880' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.aorta} position={[0, 0.85, -0.05]} />
        <M geometry={g.aortaArch} position={[-0.28, 1.25, -0.05]} rotation={[0, 0, -0.2]} />
      </OrganPart>
    </group>
  )
}

// ─── LUNGS ─────────────────────────────────────────────────────
export function LungsModel({ selectedPart, onSelect }: ModelProps) {
  const g = useMemo(() => ({
    lung: sphere(0.62),
    trachea: cylinder(0.1, 0.1, 0.7),
    bronchus: cylinder(0.06, 0.07, 0.45),
  }), [])
  return (
    <group scale={1.05}>
      <OrganPart partId='left-lung' color='#d98aa0' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.lung} position={[-0.55, -0.25, 0]} scale={[0.85, 1.5, 0.85]} />
      </OrganPart>
      <OrganPart partId='right-lung' color='#e0a0b4' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.lung} position={[0.6, -0.2, 0]} scale={[0.95, 1.55, 0.9]} />
      </OrganPart>
      <OrganPart partId='trachea' color='#cdd6dd' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.trachea} position={[0, 0.85, 0]} />
      </OrganPart>
      <OrganPart partId='bronchi' color='#b9c4cc' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.bronchus} position={[-0.28, 0.45, 0]} rotation={[0, 0, 0.6]} />
        <M geometry={g.bronchus} position={[0.3, 0.45, 0]} rotation={[0, 0, -0.6]} />
      </OrganPart>
    </group>
  )
}

// ─── LIVER ─────────────────────────────────────────────────────
export function LiverModel({ selectedPart, onSelect }: ModelProps) {
  const g = useMemo(() => ({
    rightLobe: sphere(0.8),
    leftLobe: sphere(0.55),
    gallbladder: capsule(0.13, 0.22),
  }), [])
  return (
    <group scale={1.05} rotation={[0, 0, -0.08]}>
      <OrganPart partId='right-lobe' color='#7b4b3a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.rightLobe} position={[-0.35, 0, 0]} scale={[1.35, 0.7, 0.9]} />
      </OrganPart>
      <OrganPart partId='left-lobe' color='#8a5544' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.leftLobe} position={[0.75, 0.05, 0.05]} scale={[1.2, 0.6, 0.85]} />
      </OrganPart>
      <OrganPart partId='gallbladder' color='#5f7d3a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.gallbladder} position={[-0.2, -0.35, 0.35]} rotation={[0.4, 0, 0.2]} />
      </OrganPart>
    </group>
  )
}

// ─── KIDNEY ────────────────────────────────────────────────────
export function KidneyModel({ selectedPart, onSelect }: ModelProps) {
  // bean shape from two overlapping ellipsoids minus indent (approximated)
  const g = useMemo(() => ({
    cortex: sphere(0.7),
    medulla: sphere(0.5),
    pelvis: capsule(0.1, 0.3),
  }), [])
  return (
    <group scale={1.1}>
      <OrganPart partId='cortex' color='#9b5a4a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.cortex} position={[0, 0.35, 0]} scale={[0.7, 0.85, 0.6]} />
        <M geometry={g.cortex} position={[0, -0.35, 0]} scale={[0.7, 0.85, 0.6]} />
      </OrganPart>
      <OrganPart partId='medulla' color='#b06b58' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.medulla} position={[0.05, 0, 0]} scale={[0.55, 1.1, 0.5]} />
      </OrganPart>
      <OrganPart partId='renal-pelvis' color='#caa07a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.pelvis} position={[-0.35, 0, 0]} rotation={[0, 0, 0.3]} />
      </OrganPart>
    </group>
  )
}

// ─── BRAIN ─────────────────────────────────────────────────────
export function BrainModel({ selectedPart, onSelect }: ModelProps) {
  const g = useMemo(() => ({
    hemi: sphere(0.62, 48),
    cerebellum: sphere(0.32),
    stem: cylinder(0.12, 0.16, 0.6),
  }), [])
  return (
    <group scale={1.15}>
      <OrganPart partId='cerebrum' color='#c79bb0' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.hemi} position={[-0.32, 0.25, 0]} scale={[1, 0.95, 1.15]} />
        <M geometry={g.hemi} position={[0.32, 0.25, 0]} scale={[1, 0.95, 1.15]} />
      </OrganPart>
      <OrganPart partId='cerebellum' color='#a87d92' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.cerebellum} position={[0, -0.25, -0.6]} scale={[1.3, 0.8, 1]} />
      </OrganPart>
      <OrganPart partId='brainstem' color='#d8b89a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.stem} position={[0, -0.55, -0.3]} rotation={[0.4, 0, 0]} />
      </OrganPart>
    </group>
  )
}

// ─── STOMACH ───────────────────────────────────────────────────
export function StomachModel({ selectedPart, onSelect }: ModelProps) {
  const g = useMemo(() => ({
    fundus: sphere(0.45),
    body: capsule(0.42, 0.5),
    pylorus: cylinder(0.12, 0.18, 0.4),
  }), [])
  return (
    <group scale={1.1} rotation={[0, 0, 0.3]}>
      <OrganPart partId='fundus' color='#c98a6a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.fundus} position={[-0.45, 0.55, 0]} scale={[1, 1.1, 1]} />
      </OrganPart>
      <OrganPart partId='body' color='#d89a78' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.body} position={[-0.1, 0, 0]} rotation={[0, 0, 0.5]} scale={[1.1, 1.2, 1]} />
      </OrganPart>
      <OrganPart partId='pylorus' color='#b87a5a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.pylorus} position={[0.5, -0.5, 0]} rotation={[0, 0, -0.9]} />
      </OrganPart>
    </group>
  )
}

// ─── THYROID ───────────────────────────────────────────────────
export function ThyroidModel({ selectedPart, onSelect }: ModelProps) {
  const g = useMemo(() => ({
    lobe: sphere(0.4),
    isthmus: capsule(0.12, 0.25),
  }), [])
  return (
    <group scale={1.3}>
      <OrganPart partId='right-lobe' color='#a8556a' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.lobe} position={[-0.4, 0.1, 0]} scale={[0.7, 1.4, 0.7]} rotation={[0, 0, 0.25]} />
      </OrganPart>
      <OrganPart partId='left-lobe' color='#b56676' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.lobe} position={[0.4, 0.1, 0]} scale={[0.7, 1.4, 0.7]} rotation={[0, 0, -0.25]} />
      </OrganPart>
      <OrganPart partId='isthmus' color='#c47788' selectedPart={selectedPart} onSelect={onSelect}>
        <M geometry={g.isthmus} position={[0, -0.05, 0.05]} rotation={[0, 0, Math.PI / 2]} />
      </OrganPart>
    </group>
  )
}

// ─── Model registry ────────────────────────────────────────────
export const ORGAN_MODEL_COMPONENTS: Record<string, React.FC<ModelProps>> = {
  heart: HeartModel,
  lungs: LungsModel,
  liver: LiverModel,
  kidney: KidneyModel,
  brain: BrainModel,
  stomach: StomachModel,
  thyroid: ThyroidModel,
}
