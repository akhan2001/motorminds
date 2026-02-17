import type { DiagnosticComponentId } from './diagnostics-3d-locator-service'

export const COMPONENT_TO_MESH_MAP: Record<DiagnosticComponentId, string> = {
  battery: 'mesh_battery_zone',
  starter: 'mesh_starter_zone',
  alternator: 'mesh_alternator_zone',
  fuse_box: 'mesh_fuse_box_zone',
}

export const COMPONENT_LABELS: Record<DiagnosticComponentId, string> = {
  battery: 'Battery',
  starter: 'Starter Motor',
  alternator: 'Alternator',
  fuse_box: 'Fuse Box',
}

export const COMPONENT_TOOLTIPS: Record<DiagnosticComponentId, string> = {
  battery: 'Provides base electrical power for starting and low-voltage systems.',
  starter: 'Converts battery current into crank motion to start the engine.',
  alternator: 'Recharges the battery and supports system voltage while running.',
  fuse_box: 'Distributes protected power through fuses and relays.',
}
