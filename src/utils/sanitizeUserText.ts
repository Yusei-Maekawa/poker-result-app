/**
 * ユーザー入力テキストの簡易サニタイズ。
 * React は表示時にエスケープするが、保存データに HTML/スクリプト断片を残さないための防御層。
 */
export function sanitizeUserText(value: string): string {
  return value
    .replace(/\0/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/javascript:/gi, '')
}
