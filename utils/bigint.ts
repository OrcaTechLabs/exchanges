export function isBigInt(value: string) {
  try {
    return BigInt(parseInt(value, 10)) !== BigInt(value);
  } catch {
    return false;
  }
}

export function parsePossibleLargeNumber(value: string) {
  return isBigInt(value) ? BigInt(value) : parseFloat(value);
}
