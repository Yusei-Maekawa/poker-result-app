import packageJson from '../../package.json'

/** package.json の semver（例: 0.3.0） */
export const APP_VERSION = packageJson.version

/** 画面表示用（例: v0.3.0） */
export const APP_VERSION_LABEL = `v${packageJson.version}`
