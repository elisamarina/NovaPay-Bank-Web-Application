export const NOVAUSD_DECIMALS = 18;
export const SNOVAUSD_DECIMALS = 24;

const ZERO = BigInt(0);
const TEN = BigInt(10);

const stripTrailingZeros = (value: string) =>
  value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");

export const parseTokenAmount = (value: string, decimals: number) => {
  const normalized = value.trim();

  if (!/^\d*(\.\d*)?$/.test(normalized) || normalized === "" || normalized === ".") {
    return null;
  }

  const [wholePart = "0", fractionPart = ""] = normalized.split(".");
  const whole = BigInt(wholePart || "0");
  const fraction = fractionPart.padEnd(decimals, "0").slice(0, decimals);

  return whole * TEN ** BigInt(decimals) + BigInt(fraction || "0");
};

export const formatTokenAmount = (
  value: bigint | undefined,
  decimals: number,
  maxFractionDigits = 4,
) => {
  if (value === undefined) return "-";

  const scale = TEN ** BigInt(decimals);
  const whole = value / scale;
  const fraction = value % scale;

  if (fraction === ZERO || maxFractionDigits === 0) {
    return whole.toLocaleString("en-US");
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFractionDigits);

  return `${whole.toLocaleString("en-US")}.${stripTrailingZeros(fractionText)}`;
};

export const formatScaledAmount = (
  value: bigint | undefined,
  decimals: number | undefined,
  maxFractionDigits = 4,
) => {
  if (decimals === undefined) return "-";

  return formatTokenAmount(value, decimals, maxFractionDigits);
};

export const formatBps = (bps: bigint | undefined) => {
  if (bps === undefined) return "-";

  return `${Number(bps) / 100}%`;
};

export const compactAddress = (address: string | undefined) => {
  if (!address) return "-";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
