import { isPresetPlayerIcon } from './presetPlayerIcons'
import { PLAYER_LIMITS } from './validationLimits'

const MAX_NAME_LEN = PLAYER_LIMITS.name
const MAX_MEMO_LEN = PLAYER_LIMITS.memo

export function validatePlayerForm(
  params: {
    name: string
    icon: string
    memo: string
  },
  options?: {
    /** 既存プロフィールの移行用：プリセット外でもこの値と一致なら許可 */
    allowedNonPresetIcon?: string
  },
): string | null {
  const name = params.name.trim()
  const icon = params.icon.trim()
  const legacy = options?.allowedNonPresetIcon?.trim() ?? ''

  if (!name) return '名前を入力してください'
  if (name.length > MAX_NAME_LEN) {
    return `名前は${MAX_NAME_LEN}文字以内で入力してください`
  }
  if (
    icon !== '' &&
    !isPresetPlayerIcon(icon) &&
    icon !== legacy
  ) {
    return 'アイコンは一覧から選んでください'
  }
  if (params.memo.trim().length > MAX_MEMO_LEN) {
    return `メモは${MAX_MEMO_LEN}文字以内で入力してください`
  }

  return null
}
