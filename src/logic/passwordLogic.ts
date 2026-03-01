/** パスワード関連のロジック */

/** このゲームの隠しパスワード */
export const GAME_PASSWORD = "ORGAMON-KISO-2026";

/** 他3ゲームの有効パスワード一覧（将来拡張用） */
export const VALID_EXTERNAL_PASSWORDS = [
  "PHYSIO-QUEST-2026",
  "ANATOMY-HERO-2026",
  "MEDICAL-STAR-2026",
];

/** 全4パスワード（このゲーム含む） */
export const ALL_PASSWORDS = [GAME_PASSWORD, ...VALID_EXTERNAL_PASSWORDS];

/** パスワードの形式チェック */
export function isValidPasswordFormat(password: string): boolean {
  const trimmed = password.trim().toUpperCase();
  return /^[A-Z]+-[A-Z]+-\d{4}$/.test(trimmed);
}

/** パスワードが有効な外部パスワードかチェック */
export function isValidExternalPassword(password: string): boolean {
  const trimmed = password.trim().toUpperCase();
  return VALID_EXTERNAL_PASSWORDS.includes(trimmed);
}

/** スペシャルゲーム解放条件チェック（4パスワード全て入力済み） */
export function canUnlockSpecialGame(
  ownPassword: string | undefined,
  externalPasswords: string[]
): boolean {
  const hasOwnPassword = ownPassword === GAME_PASSWORD;
  const hasAllExternal = VALID_EXTERNAL_PASSWORDS.every((p) =>
    externalPasswords.includes(p)
  );
  return hasOwnPassword && hasAllExternal;
}

/** パスワードをマスク表示用に変換 */
export function maskPassword(password: string): string {
  if (password.length <= 4) return "****";
  return password.slice(0, 4) + "*".repeat(password.length - 4);
}
