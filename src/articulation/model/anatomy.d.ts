import type { Group, Scene } from 'three'
import type { ArticulationPose } from '../letterPoses'

/** Typed boundary around the adapted procedural source. */
export const anatomy: {
  build(scene: Scene, options: { resolusi: number; aniso: number; mutu: 'hemat' }): {
    model: Group
    setPose(pose: ArticulationPose, immediate?: boolean): void
    update(dt: number): number
  }
}
