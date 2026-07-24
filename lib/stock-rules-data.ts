/**
 * Store-wide stock behaviour defaults — Class C, no effect on financial
 * history, just how stock screens and the register behave going forward.
 */
export interface StockRulesSettings {
  defaultReorderPoint: number
  allowNegativeStock: boolean
  registerCanSellAtZeroStock: boolean
  lowStockAlertThreshold: number
  stocktakeBlindCountingDefault: boolean
  autoSplitAtRegister: boolean
}

export const DEFAULT_STOCK_RULES: StockRulesSettings = {
  defaultReorderPoint: 20,
  allowNegativeStock: false,
  registerCanSellAtZeroStock: false,
  lowStockAlertThreshold: 10,
  stocktakeBlindCountingDefault: true,
  autoSplitAtRegister: true,
}

let stockRulesStore: StockRulesSettings = { ...DEFAULT_STOCK_RULES }

export function getStockRulesSettings(): StockRulesSettings {
  return stockRulesStore
}

export function setStockRulesSettings(next: StockRulesSettings): void {
  stockRulesStore = next
}
