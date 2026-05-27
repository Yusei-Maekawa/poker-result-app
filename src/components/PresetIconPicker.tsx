import { buildPlayerIconOptions } from '../utils/presetPlayerIcons'

type PresetIconPickerProps = {
  label: string
  value: string
  onChange: (icon: string) => void
  disabled?: boolean
  /** 空欄 = 名前の頭文字を自動表示（登録・保存時のフォールバック） */
  showAutoOption?: boolean
}

export function PresetIconPicker({
  label,
  value,
  onChange,
  disabled = false,
  showAutoOption = true,
}: PresetIconPickerProps) {
  const options = buildPlayerIconOptions(value)
  const isAuto = !value.trim()

  return (
    <div>
      <div className="flex items-end justify-between gap-2 mb-1">
        <span className="label mb-0">{label}</span>
        <span className="text-white/35 text-xs">タップで選択</span>
      </div>

      {showAutoOption && (
        <div className="mb-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('')}
            aria-pressed={isAuto}
            className={`w-full min-h-[44px] rounded-lg border text-sm font-medium transition-colors ${
              isAuto
                ? 'border-gold-500/60 bg-gold-500/15 text-gold-200'
                : 'border-white/15 bg-white/[0.06] text-white/55 hover:bg-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            自動（名前の頭文字）
          </button>
        </div>
      )}

      <div
        className="grid grid-cols-5 sm:grid-cols-6 gap-2"
        role="group"
        aria-label={label}
      >
        {options.map((emoji) => {
          const selected = value === emoji
          return (
            <button
              key={emoji}
              type="button"
              disabled={disabled}
              title={emoji}
              aria-label={`アイコン ${emoji}`}
              aria-pressed={selected}
              onClick={() => onChange(emoji)}
              className={`min-h-[48px] rounded-xl border text-2xl flex items-center justify-center transition-all
                ${selected
                  ? 'border-gold-500/70 bg-gold-500/20 ring-1 ring-gold-500/40 scale-[1.02]'
                  : 'border-white/10 bg-white/[0.06] hover:bg-white/10 hover:border-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {emoji}
            </button>
          )
        })}
      </div>

      <p className="text-white/30 text-xs mt-2">
        未選択のときは名前の先頭から表示用の文字が使われます。
      </p>
    </div>
  )
}
