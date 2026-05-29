import { useAppContext } from '../context/AppProvider'

export function useAnnouncements() {
  const {
    announcements,
    announcementsLoading,
    announcementsError,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAppContext()
  return {
    announcements,
    loading: announcementsLoading,
    error: announcementsError,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  }
}
