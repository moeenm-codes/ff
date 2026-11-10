import { CartItem, MenuItem, RawMaterial, StockLedgerEntry } from './types';

export interface MaterialUsage {
  materialId: string;
  amount: number;
}

export interface DeductionReportRow {
  materialId: string;
  name: string;
  unit: string;
  location: string;
  required: number;
  currentStock: number;
  afterStock: number;
  status: 'OK' | 'WARNING_LOW' | 'DEFICIT';
  statusMessage: string;
}

/**
 * محاسبه کل مصرف مواد اولیه توسط تمام اقلام موجود در سبد خرید
 * کلید: شناسه ماده اولیه (materialId)، مقدار: جمع گرم/عدد/میلی‌لیتر مصرفی
 */
export function calculateTotalMaterialConsumption(cart: CartItem[]): Map<string, number> {
  const consumption = new Map<string, number>();

  for (const item of cart) {
    if (item.quantity <= 0) continue;
    for (const ingredient of item.menuItem.recipe) {
      const current = consumption.get(ingredient.materialId) || 0;
      consumption.set(ingredient.materialId, current + ingredient.amount * item.quantity);
    }
  }

  return consumption;
}

/**
 * محاسبه موجودی قابل سفارش یک آیتم با احتساب مصرف جاری کل سبد
 * (حل ریشه‌ای باگ شماره ۱ مگاپرامپت: فروش بیش از موجودی به دلیل مواد مشترک)
 *
 * @param item آیتم منو مورد نظر
 * @param materials لیست موجودی مواد اولیه
 * @param cart سبد خرید فعلی
 * @returns حداکثر تعداد این آیتم که هنوز می‌توان به سبد اضافه کرد
 */
export function calculateAvailableToAdd(
  item: MenuItem,
  materials: RawMaterial[],
  cart: CartItem[]
): number {
  if (!item.recipe || item.recipe.length === 0) return 999;

  const currentCartUsage = calculateTotalMaterialConsumption(cart);
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  let minAllowed = Infinity;

  for (const ingredient of item.recipe) {
    const mat = materialMap.get(ingredient.materialId);
    if (!mat) {
      minAllowed = 0;
      break;
    }

    const alreadyUsed = currentCartUsage.get(ingredient.materialId) || 0;
    const remainingStock = Math.max(0, mat.stock - alreadyUsed);
    const possibleCount = Math.floor(remainingStock / ingredient.amount);

    if (possibleCount < minAllowed) {
      minAllowed = possibleCount;
    }
  }

  return minAllowed === Infinity ? 0 : Math.max(0, minAllowed);
}

/**
 * محاسبه حداکثر تعداد قابل پخت یک آیتم صرفاً بر اساس موجودی کل انبار
 */
export function calculateMaxCapacity(item: MenuItem, materials: RawMaterial[]): number {
  if (!item.recipe || item.recipe.length === 0) return 999;
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  let minAllowed = Infinity;
  for (const ingredient of item.recipe) {
    const mat = materialMap.get(ingredient.materialId);
    if (!mat) return 0;
    const count = Math.floor(mat.stock / ingredient.amount);
    if (count < minAllowed) minAllowed = count;
  }
  return minAllowed === Infinity ? 0 : Math.max(0, minAllowed);
}

/**
 * انفجار کامل رسپی سفارش و تولید جدول مقایسه‌ای:
 * «لازم / موجودی / پس از کسر» به همراه تعیین وضعیت هشدار
 * مطابق صفحه ۳ پروتوتایپ و قاعده Δ-05 و BR-INV-02
 */
export function explodeRecipeForOrder(
  cart: CartItem[],
  materials: RawMaterial[]
): { rows: DeductionReportRow[]; hasDeficit: boolean; hasWarning: boolean } {
  const consumption = calculateTotalMaterialConsumption(cart);
  const materialMap = new Map(materials.map((m) => [m.id, m]));
  const rows: DeductionReportRow[] = [];

  let hasDeficit = false;
  let hasWarning = false;

  for (const [matId, requiredAmount] of consumption.entries()) {
    const mat = materialMap.get(matId);
    if (!mat) continue;

    const afterStock = mat.stock - requiredAmount;
    let status: 'OK' | 'WARNING_LOW' | 'DEFICIT' = 'OK';
    let statusMessage = 'موجودی کافی است';

    if (afterStock < 0) {
      status = 'DEFICIT';
      statusMessage = `کسری موجودی: ${Math.abs(afterStock)} ${mat.unit}`;
      hasDeficit = true;
    } else if (afterStock <= mat.minThreshold) {
      status = 'WARNING_LOW';
      statusMessage = `کمتر از نقطه سفارش (${mat.minThreshold} ${mat.unit})`;
      hasWarning = true;
    }

    const locationName =
      mat.location === 'KITCHEN_STOCK'
        ? 'موجودی دم‌دست آشپزخانه'
        : mat.location === 'PREP'
        ? 'میز آماده‌سازی'
        : 'انبار مرکزی';

    rows.push({
      materialId: mat.id,
      name: mat.name,
      unit: mat.unit,
      location: locationName,
      required: requiredAmount,
      currentStock: mat.stock,
      afterStock,
      status,
      statusMessage,
    });
  }

  // مرتب‌سازی: موارد دارای کسری یا هشدار ابتدا بیایند
  rows.sort((a, b) => {
    const weight = { DEFICIT: 3, WARNING_LOW: 2, OK: 1 };
    return weight[b.status] - weight[a.status];
  });

  return { rows, hasDeficit, hasWarning };
}

/**
 * کسر اتمی مواد اولیه در لحظه تأیید سفارش (قاعده Δ-01)
 * به همراه ثبت در کاردکس غیرقابل ویرایش (قاعده BR-INV-02 و Stock Ledger)
 */
export function deductMaterialsAtomically(
  cart: CartItem[],
  currentMaterials: RawMaterial[],
  orderSequence: number,
  operatorName: string
): { updatedMaterials: RawMaterial[]; ledgerEntries: StockLedgerEntry[] } {
  const consumption = calculateTotalMaterialConsumption(cart);
  const now = new Date().toISOString();
  const ledgerEntries: StockLedgerEntry[] = [];

  const updatedMaterials = currentMaterials.map((mat) => {
    const used = consumption.get(mat.id);
    if (!used || used === 0) return mat;

    const newStock = mat.stock - used;

    // ثبت ردیف کاردکس (Append-Only)
    ledgerEntries.push({
      id: `LEDGER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      materialId: mat.id,
      materialName: mat.name,
      changeAmount: -used,
      balanceAfter: newStock,
      reason: 'ORDER_CONSUMPTION',
      referenceId: `سفارش #${orderSequence}`,
      operatorName,
    });

    return {
      ...mat,
      stock: newStock,
    };
  });

  return { updatedMaterials, ledgerEntries };
}
