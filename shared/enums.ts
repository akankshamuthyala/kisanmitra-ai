export const CROP_CATEGORIES = [
  'cereals',
  'pulses',
  'oilseeds',
  'vegetables',
  'fruits',
  'cash_crops',
  'plantation_spices',
  'floriculture',
] as const;
export type CropCategory = (typeof CROP_CATEGORIES)[number];

export const ADVISORY_FOCUS_AREAS = [
  'general_health',
  'pest_disease',
  'nutrient_management',
  'irrigation',
  'weed_management',
  'weather_risk',
  'harvest_postharvest',
  'organic_ipm',
  'cost_optimization',
] as const;
export type AdvisoryFocusArea = (typeof ADVISORY_FOCUS_AREAS)[number];

export const SEASONS = ['kharif', 'rabi', 'zaid', 'perennial'] as const;
export type Season = (typeof SEASONS)[number];

export const SOIL_TYPES = [
  'red',
  'black',
  'alluvial',
  'laterite',
  'sandy',
  'loamy',
  'clayey',
  'saline_alkaline',
  'unknown',
] as const;
export type SoilType = (typeof SOIL_TYPES)[number];

export const IRRIGATION_SOURCES = [
  'rainfed',
  'canal',
  'borewell',
  'drip',
  'sprinkler',
  'farm_pond',
  'mixed',
] as const;
export type IrrigationSource = (typeof IRRIGATION_SOURCES)[number];

export const GROWTH_STAGES = [
  'land_preparation',
  'sowing',
  'germination',
  'vegetative',
  'flowering',
  'fruiting_grain_fill',
  'maturity',
  'harvest',
  'post_harvest',
] as const;
export type GrowthStage = (typeof GROWTH_STAGES)[number];

export const RISK_LEVELS = ['low', 'moderate', 'high', 'critical'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'te', 'ta', 'mr', 'kn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; native: string }> = {
  en: { label: 'English', native: 'English' },
  hi: { label: 'Hindi', native: 'हिन्दी' },
  te: { label: 'Telugu', native: 'తెలుగు' },
  ta: { label: 'Tamil', native: 'தமிழ்' },
  mr: { label: 'Marathi', native: 'मराठी' },
  kn: { label: 'Kannada', native: 'ಕನ್ನಡ' },
};

export const DETAIL_LEVELS = ['simple', 'detailed'] as const;
export type DetailLevel = (typeof DETAIL_LEVELS)[number];

export const WEATHER_CONDITIONS = [
  'normal',
  'heavy_rain',
  'drought',
  'heatwave',
  'cold_wave',
  'hailstorm',
  'flood',
] as const;
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

export const ADVISORY_STATUSES = ['pending', 'completed', 'failed'] as const;
export type AdvisoryStatus = (typeof ADVISORY_STATUSES)[number];

export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const ISSUE_CATEGORIES = [
  'pest',
  'disease',
  'nutrient_deficiency',
  'water_stress',
  'weed',
  'abiotic_stress',
  'other',
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const IMAGE_QUALITIES = ['good', 'fair', 'poor', 'not_a_plant'] as const;
export type ImageQuality = (typeof IMAGE_QUALITIES)[number];
