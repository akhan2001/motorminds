'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { COMPONENT_TO_MESH_MAP } from '@/lib/services/diagnostics-3d-component-map'
import type { DiagnosticComponentId } from '@/lib/services/diagnostics-3d-locator-service'

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(5.2, 3.1, 5.8)
const DEFAULT_TARGET = new THREE.Vector3(0, 1, 0)

const MESH_TO_COMPONENT = Object.fromEntries(
	Object.entries(COMPONENT_TO_MESH_MAP).map(([componentId, meshName]) => [meshName, componentId])
) as Record<string, DiagnosticComponentId>

export function VehicleDiagnosticsViewer({
	selectedComponent,
	resetSignal,
	onComponentClick,
}: {
	selectedComponent?: DiagnosticComponentId
	resetSignal: number
	onComponentClick: (componentId: DiagnosticComponentId) => void
}) {
	const mountRef = useRef<HTMLDivElement>(null)
	const sceneRef = useRef<THREE.Scene | null>(null)
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
	const controlsRef = useRef<OrbitControls | null>(null)
	const modelRef = useRef<THREE.Object3D | null>(null)

	useEffect(() => {
		if (!mountRef.current) return

		const mount = mountRef.current
		const width = mount.clientWidth || 1
		const height = mount.clientHeight || 1

		const scene = new THREE.Scene()
		scene.background = new THREE.Color('#020617')
		sceneRef.current = scene

		const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
		camera.position.copy(DEFAULT_CAMERA_POSITION)
		cameraRef.current = camera

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
		renderer.setSize(width, height)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		rendererRef.current = renderer
		mount.appendChild(renderer.domElement)

		const controls = new OrbitControls(camera, renderer.domElement)
		controls.enablePan = false
		controls.minDistance = 2
		controls.maxDistance = 12
		controls.target.copy(DEFAULT_TARGET)
		controls.update()
		controlsRef.current = controls

		scene.add(new THREE.AmbientLight(0xffffff, 0.75))
		const lightA = new THREE.DirectionalLight(0xffffff, 1.2)
		lightA.position.set(4, 5, 2)
		scene.add(lightA)
		const lightB = new THREE.DirectionalLight(0xffffff, 0.45)
		lightB.position.set(-2, 3, -3)
		scene.add(lightB)

		const loader = new GLTFLoader()
		loader.load('/models/diagnostics-demo-car.glb', (gltf) => {
			modelRef.current = gltf.scene
			scene.add(gltf.scene)
		})

		const raycaster = new THREE.Raycaster()
		const pointer = new THREE.Vector2()
		const onPointerDown = (event: PointerEvent) => {
			const rect = renderer.domElement.getBoundingClientRect()
			pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
			pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
			raycaster.setFromCamera(pointer, camera)
			const intersects = modelRef.current ? raycaster.intersectObject(modelRef.current, true) : []
			if (intersects.length === 0) return
			let current: THREE.Object3D | null = intersects[0].object
			while (current) {
				const maybeComponent = MESH_TO_COMPONENT[current.name]
				if (maybeComponent) {
					onComponentClick(maybeComponent)
					return
				}
				current = current.parent
			}
		}
		renderer.domElement.addEventListener('pointerdown', onPointerDown)

		const onResize = () => {
			if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
			const w = mountRef.current.clientWidth || 1
			const h = mountRef.current.clientHeight || 1
			cameraRef.current.aspect = w / h
			cameraRef.current.updateProjectionMatrix()
			rendererRef.current.setSize(w, h)
		}
		window.addEventListener('resize', onResize)

		let raf = 0
		const animate = () => {
			raf = requestAnimationFrame(animate)
			controls.update()
			renderer.render(scene, camera)
		}
		animate()

		return () => {
			cancelAnimationFrame(raf)
			window.removeEventListener('resize', onResize)
			renderer.domElement.removeEventListener('pointerdown', onPointerDown)
			controls.dispose()
			renderer.dispose()
			if (renderer.domElement.parentElement === mount) {
				mount.removeChild(renderer.domElement)
			}
		}
	}, [onComponentClick])

	useEffect(() => {
		const model = modelRef.current
		if (!model) return
		const selectedMeshName = selectedComponent ? COMPONENT_TO_MESH_MAP[selectedComponent] : undefined

		model.traverse((node) => {
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

		if (!selectedMeshName || !cameraRef.current || !controlsRef.current) return
		const targetObject = model.getObjectByName(selectedMeshName)
		if (!targetObject) return

		const bounds = new THREE.Box3().setFromObject(targetObject)
		const center = bounds.getCenter(new THREE.Vector3())
		const size = bounds.getSize(new THREE.Vector3())
		const distance = Math.max(2.7, size.length() * 2.5)
		const offset = new THREE.Vector3(1, 0.8, 1).normalize().multiplyScalar(distance)
		cameraRef.current.position.copy(center.clone().add(offset))
		controlsRef.current.target.copy(center)
		controlsRef.current.update()
	}, [selectedComponent])

	useEffect(() => {
		if (!cameraRef.current || !controlsRef.current) return
		cameraRef.current.position.copy(DEFAULT_CAMERA_POSITION)
		controlsRef.current.target.copy(DEFAULT_TARGET)
		controlsRef.current.update()
	}, [resetSignal])

	return (
		<div className="h-[380px] w-full overflow-hidden rounded-lg border border-border bg-slate-950">
			<div ref={mountRef} className="h-full w-full" />
			{!selectedComponent && (
				<div className="pointer-events-none -mt-10 px-3 text-xs text-slate-300">
					Submit a symptom to auto-highlight a part.
				</div>
			)}
		</div>
	)
}
