import { DeviceCategory, IrProfile } from './types';
import { projectorProfiles } from './projectors';
import { acProfiles } from './airConditioners';
import { tvProfiles } from './televisions';

export * from './types';
export * from './acGenerators';
export { projectorProfiles } from './projectors';
export { acProfiles } from './airConditioners';
export { tvProfiles } from './televisions';

export const allProfiles: IrProfile[] = [
  ...projectorProfiles,
  ...acProfiles,
  ...tvProfiles,
];

export interface CategoryInfo {
  id: DeviceCategory;
  titleFa: string;
  subtitleFa: string;
  iconName: string;
  color: string;
  priorityBrands: string[];
}

export const deviceCategories: CategoryInfo[] = [
  {
    id: 'projector',
    titleFa: 'ویدئو پروژکتور کلاس',
    subtitleFa: 'کنترل پروژکتورهای کلاسی اپسون، بنکیو، اپتوما و ...',
    iconName: 'Tv',
    color: '#6366f1',
    priorityBrands: [
      'Epson',
      'BenQ',
      'Optoma',
      'ViewSonic',
      'Sony',
      'Panasonic',
      'سایر / متفرقه',
    ],
  },
  {
    id: 'ac',
    titleFa: 'کولر گازی و اسپلیت',
    subtitleFa: 'تنظیم دما، باد و سرمایش/گرمایش کلاس و سالن',
    iconName: 'Wind',
    color: '#0284c7',
    priorityBrands: [
      'Gree',
      'General / O General',
      'LG',
      'Samsung',
      'Midea',
      'Iran Radiator',
      'GPlus',
      'Hisense',
      'Haier',
      'Daikin',
      'Panasonic',
      'سایر / متفرقه',
    ],
  },
  {
    id: 'tv',
    titleFa: 'تلویزیون و نمایشگر هوشمند',
    subtitleFa: 'سامسونگ، ال‌جی، سونی، اسنوا، ایکس‌ویژن و ...',
    iconName: 'Monitor',
    color: '#ec4899',
    priorityBrands: [
      'Samsung',
      'LG',
      'Sony',
      'Snowa',
      'X.Vision',
      'GPlus',
      'TCL',
      'Hisense',
      'Xiaomi',
      'Panasonic',
      'سایر / متفرقه',
    ],
  },
];

export function getProfilesByCategory(category: DeviceCategory): IrProfile[] {
  return allProfiles.filter((p) => p.category === category);
}

export function getProfileById(id: string): IrProfile | undefined {
  return allProfiles.find((p) => p.id === id);
}

export function getProfilesByBrand(category: DeviceCategory, brand: string): IrProfile[] {
  const normalized = brand.toLowerCase().trim();
  return allProfiles.filter(
    (p) =>
      p.category === category &&
      (p.brand.toLowerCase().includes(normalized) ||
        p.brandFa.includes(brand) ||
        normalized.includes(p.brand.toLowerCase()))
  );
}
