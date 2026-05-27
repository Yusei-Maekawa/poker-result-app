export const bootstrapAdminUids = (import.meta.env.VITE_ADMIN_UIDS ?? '')
  .split(',')
  .map((uid) => uid.trim())
  .filter(Boolean)

export function isBootstrapAdminUid(uid?: string | null) {
  return !!uid && bootstrapAdminUids.includes(uid)
}
