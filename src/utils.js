export function buildKey(email) {
  return email.toLowerCase().replaceAll(/[@.]/g, '_');
}
