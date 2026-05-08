import { getActiveController } from './startActTrace'

export function stopActTrace(): void {
  getActiveController()?.stop()
}
