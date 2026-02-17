'use client'

import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, type ThreeEvent, useThree } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { COMPONENT_TO_MESH_MAP } from '@/lib/services/diagnostics-3d-component-map'
import type { DiagnosticComponentId } from '@/lib/services/diagnostics-3d-locator-service'

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(5.2, 3.1, 5.8)
const DEFAULT_TARGET = new THREE.Vector3(0, 1, 0)

const MESH_TO_COMPONENT = Object.fromEntries(
  Object.entries(COMPONENT_TO_MESH_MAP).map(([componentId, meshName]) => [meshName, componentId])
) as Record<string, DiagnosticComponentId>

function CameraController({
  scene,
  selectedMeshName,
  resetSignal,
  controlsRef,
}: {
  scene: THREE.Object3D
  selectedMeshName?: string
  resetSignal: number
  controlsRef: RefObject<OrbitControlsImpl | null>
}) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.copy(DEFAULT_CAMERA_POSITION)
    controlsRef.current?.target.copy(DEFAULT_TARGET)
    controlsRef.current?.update()
  }, [camera, controlsRef, resetSignal])

  useEffect(() => {
    if (!selectedMeshName) return
    const targetObject = scene.getObjectByName(selectedMeshName)
    if (!targetObject) return

    const targetBounds = new THREE.Box3().setFromObject(targetObject)
    const center = targetBounds.getCenter(new THREE.Vector3())
    const size = targetBounds.getSize(new THREE.Vector3())
    const distance = Math.max(2.7, size.length() * 2.5)
    const offsetDirection = new THREE.Vector3(1, 0.8, 1).normalize()
    const nextCameraPosition = center.clone().add(offsetDirection.multiplyScalar(distance))

    camera.position.copy(nextCameraPosition)
    controlsRef.current?.target.copy(center)
    controlsRef.current?.update()
  }, [camera, controlsRef, scene, selectedMeshName])

  return null
}

function DiagnosticsModel({
  selectedComponent,
  resetSignal,
  onComponentClick,
}: {
  selectedComponent?: DiagnosticComponentId
  resetSignal: number
  onComponentClick: (componentId: DiagnosticComponentId) => void
}) {
  const { scene } = useGLTF('/models/diagnostics-demo-car.glb')
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const selectedMeshName = selectedComponent ? COMPONENT_TO_MESH_MAP[selectedComponent] : undefined

  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    clonedScene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return

      const material = new THREE.MeshStandardMaterial({
        color: '#6b7280',
        metalness: 0.15,
        roughness: 0.75,
      })

      const isMappedZone = Object.values(COMPONENT_TO_MESH_MAP).includes(node.name)
      if (isMappedZone) {
        material.transparent = true
        material.opacity = node.name === selectedMeshName ? 0.95 : 0.32
        material.color = new THREE.Color(node.name === selectedMeshName ? '#ef4444' : '#22c55e')
        material.emissive = new THREE.Color(node.name === selectedMeshName ? '#7f1d1d' : '#14532d')
        material.emissiveIntensity = node.name === selectedMeshName ? 0.8 : 0.25
      } else if (node.name.startsWith('mesh_wheel')) {
        material.color = new THREE.Color('#0f172a')
      } else if (node.name === 'mesh_body' || node.name === 'mesh_cabin') {
        material.color = new THREE.Color('#4f46e5')
      }

      node.material = material
    })
  }, [clonedScene, selectedMeshName])

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    let current: THREE.Object3D | null = event.object

    while (current) {
      const maybeComponent = MESH_TO_COMPONENT[current.name]
      if (maybeComponent) {
        onComponentClick(maybeComponent)
        return
      }
      current = current.parent
    }
  }

  const selectedObject = selectedMeshName ? clonedScene.getObjectByName(selectedMeshName) : null
  const selectedPosition = selectedObject
    ? new THREE.Box3().setFromObject(selectedObject).getCenter(new THREE.Vector3())
    : null

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight intensity={1.2} position={[4, 5, 2]} />
      <directionalLight intensity={0.45} position={[-2, 3, -3]} />

      <primitive object={clonedScene} onPointerDown={onPointerDown} />

      {selectedPosition && (
        <Html position={selectedPosition.toArray() as [number, number, number]} center distanceFactor={8}>
          <div className="rounded-md border border-red-500/60 bg-black/80 px-2 py-1 text-xs text-white">
            {selectedComponent?.replace('_', ' ')}
          </div>
        </Html>
      )}

      <OrbitControls ref={controlsRef} enablePan={false} minDistance={2} maxDistance={12} />
      <CameraController
        scene={clonedScene}
        selectedMeshName={selectedMeshName}
        controlsRef={controlsRef}
        resetSignal={resetSignal}
      />
    </>
  )
}

export function VehicleDiagnosticsViewer({
  selectedComponent,
  resetSignal,
  onComponentClick,
}: {
  selectedComponent?: DiagnosticComponentId
  resetSignal: number
  onComponentClick: (componentId: DiagnosticComponentId) => void
}) {
  return (
    <div className="h-[380px] w-full overflow-hidden rounded-lg border border-border bg-slate-950">
      <Canvas camera={{ position: DEFAULT_CAMERA_POSITION.toArray() as [number, number, number], fov: 45 }}>
        <Suspense fallback={null}>
          <DiagnosticsModel
            selectedComponent={selectedComponent}
            resetSignal={resetSignal}
            onComponentClick={onComponentClick}
          />
        </Suspense>
      </Canvas>
      {!selectedComponent && (
        <div className="pointer-events-none -mt-10 px-3 text-xs text-slate-300">
          Submit a symptom to auto-highlight a part.
        </div>
      )}
    </div>
  )
}

useGLTF.preload('/models/diagnostics-demo-car.glb')
