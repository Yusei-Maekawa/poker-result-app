export function getFirebaseErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  switch (code) {
    case 'permission-denied':
      return '権限がありません。.env の VITE_ADMIN_UIDS と Firestore ルールを確認してください。'
    case 'unavailable':
      return 'Firebase に接続できません。通信環境を確認して再試行してください。'
    default:
      return fallbackMessage
  }
}
