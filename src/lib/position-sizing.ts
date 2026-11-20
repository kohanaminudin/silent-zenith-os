import { PositionSizingInput, PositionSizingResult } from "@/types/trading-system";

export function roundToLotStep(rawLot: number, minLot: number, lotStep: number): number {
  if (!Number.isFinite(rawLot) || rawLot <= 0) return 0;
  const safeStep = lotStep > 0 ? lotStep : 0.01;
  const safeMin = minLot > 0 ? minLot : 0.01;
  const floored = Math.floor(rawLot / safeStep) * safeStep;
  const decimals = (safeStep.toString().split(".")[1] || "").length;
  const rounded = Number(floored.toFixed(Math.max(2, decimals)));
  return rounded < safeMin ? 0 : rounded;
}

export function calculatePositionSizing(input: PositionSizingInput): PositionSizingResult {
  const errors: string[] = [];

  if (!input.instrument.trim()) {
    errors.push("Masukkan nama instrumen / pair terlebih dahulu.");
  }
  if (input.accountEquity <= 0) {
    errors.push("Ekuitas akun harus lebih besar dari 0.");
  }
  if (input.riskPct <= 0 || input.riskPct > 100) {
    errors.push("Persentase risiko harus antara 0.01% hingga 100%.");
  }
  if (input.contractSize <= 0 || input.pipSize <= 0 || input.pipValuePerLot <= 0) {
    errors.push(
      "Spesifikasi instrumen (Contract Size, Pip Size, dan Pip Value per Lot) wajib diisi."
    );
  }
  if (input.minLot <= 0 || input.lotStep <= 0) {
    errors.push("Spesifikasi broker (Minimum Lot & Lot Step) wajib lebih besar dari 0.");
  }

  const upper = Math.max(input.zoneUpper, input.zoneLower);
  const lower = Math.min(input.zoneUpper, input.zoneLower);
  const zoneSpan = upper - lower;
  const ratio = Math.min(100, Math.max(0, input.entryLevelPct)) / 100;

  let zoneEntry = 0;
  let formulaNote = "";

  if (input.direction === "BUY") {
    // BUY: Retracement ke dalam zona demand/discount dari batas atas menuju batas bawah
    // 75% kedalaman zona = Upper - 0.75 * (Upper - Lower)
    zoneEntry = upper - ratio * zoneSpan;
    formulaNote = `BUY Retracement (${input.entryLevelPct}% kedalaman zona): Upper (${upper}) - ${ratio.toFixed(
      2
    )} × (${upper} - ${lower}) = ${zoneEntry.toFixed(5)}`;
  } else {
    // SELL: Retracement naik ke dalam zona supply/premium dari batas bawah menuju batas atas
    // 75% kedalaman zona = Lower + 0.75 * (Upper - Lower)
    zoneEntry = lower + ratio * zoneSpan;
    formulaNote = `SELL Retracement (${input.entryLevelPct}% kedalaman zona): Lower (${lower}) + ${ratio.toFixed(
      2
    )} × (${upper} - ${lower}) = ${zoneEntry.toFixed(5)}`;
  }

  const recommendedEntry = input.useCustomEntry ? input.customEntryPrice : zoneEntry;

  if (recommendedEntry <= 0) {
    errors.push("Harga Entry harus lebih besar dari 0.");
  }
  if (input.stopLossPrice <= 0) {
    errors.push("Harga Stop Loss harus lebih besar dari 0.");
  }

  if (recommendedEntry > 0 && input.stopLossPrice > 0) {
    if (input.direction === "BUY" && input.stopLossPrice >= recommendedEntry) {
      errors.push("Untuk posisi BUY, Stop Loss harus berada di BAWAH harga Entry.");
    }
    if (input.direction === "SELL" && input.stopLossPrice <= recommendedEntry) {
      errors.push("Untuk posisi SELL, Stop Loss harus berada di ATAS harga Entry.");
    }
  }

  const slDistancePrice = Math.abs(recommendedEntry - input.stopLossPrice);
  const slDistancePips = input.pipSize > 0 ? slDistancePrice / input.pipSize : 0;
  const riskAmountTarget = input.accountEquity * (input.riskPct / 100);

  // Risiko moneter per 1.00 lot = (Jarak SL dalam pip × Nilai per pip) + Komisi per lot
  const monetaryRiskPerLot =
    slDistancePips * input.pipValuePerLot + Math.max(0, input.commissionPerLot);

  const rawLotSize = monetaryRiskPerLot > 0 ? riskAmountTarget / monetaryRiskPerLot : 0;
  const recommendedLot = roundToLotStep(rawLotSize, input.minLot, input.lotStep);

  if (errors.length === 0 && recommendedLot === 0 && rawLotSize > 0) {
    errors.push(
      `Lot terhitung (${rawLotSize.toFixed(4)}) di bawah Minimum Lot broker (${input.minLot}). Perkecil jarak SL atau naikkan ekuitas/risiko.`
    );
  }

  const estimatedLossAtSl = recommendedLot * monetaryRiskPerLot;
  const actualRiskPct =
    input.accountEquity > 0 ? (estimatedLossAtSl / input.accountEquity) * 100 : 0;

  const estimatedMargin =
    input.leverage > 0 && recommendedEntry > 0 && input.contractSize > 0
      ? (recommendedLot * input.contractSize * recommendedEntry) / input.leverage
      : undefined;

  let riskRewardRatio: number | undefined;
  let potentialProfitAtTp: number | undefined;

  if (
    input.takeProfitPrice &&
    input.takeProfitPrice > 0 &&
    slDistancePrice > 0 &&
    ((input.direction === "BUY" && input.takeProfitPrice > recommendedEntry) ||
      (input.direction === "SELL" && input.takeProfitPrice < recommendedEntry))
  ) {
    const tpDistancePrice = Math.abs(input.takeProfitPrice - recommendedEntry);
    const tpDistancePips = tpDistancePrice / input.pipSize;
    riskRewardRatio = tpDistancePrice / slDistancePrice;
    potentialProfitAtTp =
      recommendedLot * (tpDistancePips * input.pipValuePerLot - Math.max(0, input.commissionPerLot));
  }

  return {
    isValid: errors.length === 0,
    validationErrors: errors,
    recommendedEntry,
    entryZoneHigh: upper,
    entryZoneLow: lower,
    entryFormulaExplanation: formulaNote,
    entryDistanceFromRef:
      input.referencePrice > 0 ? Math.abs(recommendedEntry - input.referencePrice) : 0,
    stopLossPrice: input.stopLossPrice,
    slDistancePrice,
    slDistancePips,
    riskAmountTarget,
    monetaryRiskPerLot,
    rawLotSize,
    recommendedLot,
    estimatedLossAtSl,
    actualRiskPct,
    estimatedMargin,
    riskRewardRatio,
    potentialProfitAtTp,
  };
}