export type CategoryId = 
  | 'length' | 'weight' | 'volume' | 'area' | 'temperature' 
  | 'time' | 'speed' | 'pressure' | 'energy' | 'power' 
  | 'frequency' | 'angle';

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  // Multiplier to convert from this unit TO the base unit
  toBase?: (val: number) => number;
  // Multiplier to convert from the base unit TO this unit
  fromBase?: (val: number) => number;
  // Shorthand for simple multiplier-based conversions
  multiplier?: number;
}

export interface UnitCategory {
  id: CategoryId;
  name: string;
  baseUnit: string;
  units: Unit[];
}

export const conversionData: Record<CategoryId, UnitCategory> = {
  length: {
    id: 'length',
    name: 'طول',
    baseUnit: 'm',
    units: [
      { id: 'm', name: 'متر', symbol: 'm', multiplier: 1 },
      { id: 'km', name: 'کیلومتر', symbol: 'km', multiplier: 1000 },
      { id: 'cm', name: 'سانتی‌متر', symbol: 'cm', multiplier: 0.01 },
      { id: 'mm', name: 'میلی‌متر', symbol: 'mm', multiplier: 0.001 },
      { id: 'in', name: 'اینچ', symbol: 'in', multiplier: 0.0254 },
      { id: 'ft', name: 'فوت', symbol: 'ft', multiplier: 0.3048 },
      { id: 'yd', name: 'یارد', symbol: 'yd', multiplier: 0.9144 },
      { id: 'mi', name: 'مایل', symbol: 'mi', multiplier: 1609.344 },
    ]
  },
  weight: {
    id: 'weight',
    name: 'وزن',
    baseUnit: 'kg',
    units: [
      { id: 'kg', name: 'کیلوگرم', symbol: 'kg', multiplier: 1 },
      { id: 'g', name: 'گرم', symbol: 'g', multiplier: 0.001 },
      { id: 'mg', name: 'میلی‌گرم', symbol: 'mg', multiplier: 0.000001 },
      { id: 't', name: 'تن', symbol: 't', multiplier: 1000 },
      { id: 'lb', name: 'پوند', symbol: 'lb', multiplier: 0.45359237 },
      { id: 'oz', name: 'اونس', symbol: 'oz', multiplier: 0.02834952 },
    ]
  },
  volume: {
    id: 'volume',
    name: 'حجم',
    baseUnit: 'l',
    units: [
      { id: 'l', name: 'لیتر', symbol: 'L', multiplier: 1 },
      { id: 'ml', name: 'میلی‌لیتر', symbol: 'mL', multiplier: 0.001 },
      { id: 'm3', name: 'متر مکعب', symbol: 'm³', multiplier: 1000 },
      { id: 'cm3', name: 'سانتی‌متر مکعب', symbol: 'cm³', multiplier: 0.001 },
      { id: 'gal_us', name: 'گالن (آمریکا)', symbol: 'gal', multiplier: 3.785411784 },
      { id: 'gal_uk', name: 'گالن (انگلیس)', symbol: 'gal', multiplier: 4.54609 },
    ]
  },
  area: {
    id: 'area',
    name: 'مساحت',
    baseUnit: 'm2',
    units: [
      { id: 'm2', name: 'متر مربع', symbol: 'm²', multiplier: 1 },
      { id: 'km2', name: 'کیلومتر مربع', symbol: 'km²', multiplier: 1000000 },
      { id: 'ha', name: 'هکتار', symbol: 'ha', multiplier: 10000 },
      { id: 'cm2', name: 'سانتی‌متر مربع', symbol: 'cm²', multiplier: 0.0001 },
      { id: 'sq_in', name: 'اینچ مربع', symbol: 'sq in', multiplier: 0.00064516 },
      { id: 'sq_ft', name: 'فوت مربع', symbol: 'sq ft', multiplier: 0.09290304 },
      { id: 'acre', name: 'جریب', symbol: 'ac', multiplier: 4046.8564224 },
    ]
  },
  temperature: {
    id: 'temperature',
    name: 'دما',
    baseUnit: 'c',
    units: [
      { 
        id: 'c', name: 'سلسیوس', symbol: '°C', 
        toBase: (v) => v, fromBase: (v) => v 
      },
      { 
        id: 'f', name: 'فارنهایت', symbol: '°F', 
        toBase: (v) => (v - 32) * 5/9, 
        fromBase: (v) => (v * 9/5) + 32 
      },
      { 
        id: 'k', name: 'کلوین', symbol: 'K', 
        toBase: (v) => v - 273.15, 
        fromBase: (v) => v + 273.15 
      },
    ]
  },
  time: {
    id: 'time',
    name: 'زمان',
    baseUnit: 's',
    units: [
      { id: 's', name: 'ثانیه', symbol: 's', multiplier: 1 },
      { id: 'min', name: 'دقیقه', symbol: 'min', multiplier: 60 },
      { id: 'h', name: 'ساعت', symbol: 'h', multiplier: 3600 },
      { id: 'd', name: 'روز', symbol: 'd', multiplier: 86400 },
      { id: 'wk', name: 'هفته', symbol: 'wk', multiplier: 604800 },
      { id: 'yr', name: 'سال (۳۶۵ روز)', symbol: 'yr', multiplier: 31536000 },
    ]
  },
  speed: {
    id: 'speed',
    name: 'سرعت',
    baseUnit: 'm_s',
    units: [
      { id: 'm_s', name: 'متر بر ثانیه', symbol: 'm/s', multiplier: 1 },
      { id: 'km_h', name: 'کیلومتر بر ساعت', symbol: 'km/h', multiplier: 1/3.6 },
      { id: 'mph', name: 'مایل بر ساعت', symbol: 'mph', multiplier: 0.44704 },
      { id: 'knot', name: 'گره دریایی', symbol: 'kn', multiplier: 0.514444 },
      { id: 'mach', name: 'ماخ', symbol: 'Ma', multiplier: 343 }, // Approx sea level
    ]
  },
  pressure: {
    id: 'pressure',
    name: 'فشار',
    baseUnit: 'pa',
    units: [
      { id: 'pa', name: 'پاسکال', symbol: 'Pa', multiplier: 1 },
      { id: 'kpa', name: 'کیلوپاسکال', symbol: 'kPa', multiplier: 1000 },
      { id: 'bar', name: 'بار', symbol: 'bar', multiplier: 100000 },
      { id: 'atm', name: 'اتمسفر استاندارد', symbol: 'atm', multiplier: 101325 },
      { id: 'psi', name: 'پوند بر اینچ مربع', symbol: 'psi', multiplier: 6894.757 },
      { id: 'torr', name: 'تور', symbol: 'Torr', multiplier: 133.322 },
    ]
  },
  energy: {
    id: 'energy',
    name: 'انرژی',
    baseUnit: 'j',
    units: [
      { id: 'j', name: 'ژول', symbol: 'J', multiplier: 1 },
      { id: 'kj', name: 'کیلوژول', symbol: 'kJ', multiplier: 1000 },
      { id: 'cal', name: 'کالری', symbol: 'cal', multiplier: 4.184 },
      { id: 'kcal', name: 'کیلوکالری', symbol: 'kcal', multiplier: 4184 },
      { id: 'wh', name: 'وات ساعت', symbol: 'Wh', multiplier: 3600 },
      { id: 'kwh', name: 'کیلووات ساعت', symbol: 'kWh', multiplier: 3600000 },
      { id: 'ev', name: 'الکترون‌ولت', symbol: 'eV', multiplier: 1.602176565e-19 },
    ]
  },
  power: {
    id: 'power',
    name: 'توان',
    baseUnit: 'w',
    units: [
      { id: 'w', name: 'وات', symbol: 'W', multiplier: 1 },
      { id: 'kw', name: 'کیلووات', symbol: 'kW', multiplier: 1000 },
      { id: 'mw', name: 'مگاوات', symbol: 'MW', multiplier: 1000000 },
      { id: 'hp', name: 'اسب بخار (مکانیکی)', symbol: 'hp', multiplier: 745.699872 },
      { id: 'hp_m', name: 'اسب بخار (متریک)', symbol: 'hp(M)', multiplier: 735.49875 },
    ]
  },
  frequency: {
    id: 'frequency',
    name: 'فرکانس',
    baseUnit: 'hz',
    units: [
      { id: 'hz', name: 'هرتز', symbol: 'Hz', multiplier: 1 },
      { id: 'khz', name: 'کیلوهرتز', symbol: 'kHz', multiplier: 1000 },
      { id: 'mhz', name: 'مگاهرتز', symbol: 'MHz', multiplier: 1000000 },
      { id: 'ghz', name: 'گیگاهرتز', symbol: 'GHz', multiplier: 1000000000 },
    ]
  },
  angle: {
    id: 'angle',
    name: 'زاویه',
    baseUnit: 'deg',
    units: [
      { id: 'deg', name: 'درجه', symbol: '°', multiplier: 1 },
      { id: 'rad', name: 'رادیان', symbol: 'rad', multiplier: 180 / Math.PI },
      { id: 'grad', name: 'گرادیان', symbol: 'grad', multiplier: 0.9 },
    ]
  }
};

export const convertUnit = (
  value: number, 
  categoryId: CategoryId, 
  fromId: string, 
  toId: string
): number => {
  if (isNaN(value)) return 0;
  if (fromId === toId) return value;

  const category = conversionData[categoryId];
  if (!category) return 0;

  const fromUnit = category.units.find(u => u.id === fromId);
  const toUnit = category.units.find(u => u.id === toId);

  if (!fromUnit || !toUnit) return 0;

  // Convert to Base
  let baseValue = 0;
  if (fromUnit.toBase) {
    baseValue = fromUnit.toBase(value);
  } else if (fromUnit.multiplier !== undefined) {
    baseValue = value * fromUnit.multiplier;
  }

  // Convert from Base
  let result = 0;
  if (toUnit.fromBase) {
    result = toUnit.fromBase(baseValue);
  } else if (toUnit.multiplier !== undefined) {
    result = baseValue / toUnit.multiplier;
  }

  // Clean up floating point errors (e.g. 0.30000000000000004)
  // Up to 8 decimal places for clean UI
  return Number(Math.round(result * 100000000) / 100000000);
};
