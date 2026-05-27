import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type BaseProps = {
  label: string
  value: string
  maxLength: number
  optional?: boolean
  hint?: string
  multiline?: boolean
}

type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseProps | 'maxLength'> & {
    multiline?: false
  }

type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseProps | 'maxLength'> & {
    multiline: true
  }

export type LimitedTextFieldProps = InputProps | TextareaProps

function CharCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max
  const color =
    ratio >= 1
      ? 'text-red-400 font-medium'
      : ratio >= 0.9
        ? 'text-amber-400/90'
        : 'text-white/35'

  return (
    <span className={`text-xs tabular-nums ${color}`} aria-live="polite">
      {current} / {max}
    </span>
  )
}

export function LimitedTextField(props: LimitedTextFieldProps) {
  const {
    label,
    value,
    maxLength,
    optional = false,
    hint,
    multiline = false,
    className = '',
    ...rest
  } = props

  const atLimit = value.length >= maxLength
  const fieldClassName = `${className} ${atLimit ? 'border-red-500/50 focus:border-red-500/60' : ''}`.trim()

  return (
    <div>
      <div className="flex items-end justify-between gap-2 mb-1">
        <label className="label mb-0">
          {label}
          {optional && (
            <span className="text-white/30 ml-1 font-normal">省略可</span>
          )}
          {!optional && <span className="text-gold-400/70 ml-0.5">*</span>}
        </label>
        <CharCounter current={value.length} max={maxLength} />
      </div>

      {multiline ? (
        <textarea
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={`input min-h-[88px] resize-y ${fieldClassName}`}
          value={value}
          maxLength={maxLength}
          rows={3}
        />
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          className={`input ${fieldClassName}`}
          value={value}
          maxLength={maxLength}
        />
      )}

      <p className="text-white/30 text-xs mt-1.5">
        {hint ?? `最大 ${maxLength} 文字`}
        {atLimit && (
          <span className="text-red-400/90 ml-2">上限に達しています</span>
        )}
      </p>
    </div>
  )
}
