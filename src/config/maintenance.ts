/** ビルド時に VITE_MAINTENANCE_MODE=true のときメンテ画面のみを配信 */
export function isMaintenanceMode(): boolean {
  return import.meta.env.VITE_MAINTENANCE_MODE === 'true'
}
