import { useAppContext } from '../context/AppProvider'

export function useActivities() {
  const { activities, activitiesLoading } = useAppContext()
  return { activities, loading: activitiesLoading }
}
