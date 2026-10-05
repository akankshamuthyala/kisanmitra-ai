import type {
  CropCategory,
  AdvisoryFocusArea,
  Season,
  SoilType,
  IrrigationSource,
  GrowthStage,
  RiskLevel,
  SupportedLanguage,
  DetailLevel,
  WeatherCondition,
  AdvisoryStatus,
  MessageRole,
  ConfidenceLevel,
  IssueCategory,
  ImageQuality,
} from './enums.js';

export interface User {
  id: string;
  email: string;
  full_name: string;
  preferred_language: SupportedLanguage;
  simple_mode: boolean;
  daily_ai_quota: number;
  created_at: string;
  updated_at: string;
}

export interface Crop {
  id: number;
  category: CropCategory;
  name_en: string;
  names_i18n: Record<SupportedLanguage, string>;
  typical_seasons: Season[];
  is_active: boolean;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  state: string;
  district: string;
  village?: string | null;
  total_area_acres: number;
  soil_type: SoilType;
  irrigation_source: IrrigationSource;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProbableIssue {
  name: string;
  category: IssueCategory;
  likelihood: ConfidenceLevel;
  evidence: string;
  explanation: string;
}

export interface DiagnosisSection {
  probable_issues: ProbableIssue[];
  healthy_indicators: string[];
}

export interface ImmediateAction {
  priority: number;
  action: string;
  why: string;
  timing: string;
}

export interface NutrientApplication {
  nutrient_or_product: string;
  dose_per_acre: string;
  total_for_area: string;
  method: string;
  timing: string;
}

export interface NutrientPlan {
  soil_test_recommended: boolean;
  applications: NutrientApplication[];
  notes: string;
}

export interface IrrigationPlan {
  method_recommendation: string;
  frequency: string;
  critical_stages: string[];
  water_saving_tips: string[];
}

export interface PestDiseaseWatchItem {
  name: string;
  type: 'pest' | 'disease';
  early_signs: string;
  prevention: string;
  control_options: {
    cultural: string;
    biological: string;
    chemical_if_needed: string;
  };
}

export interface WeatherRiskItem {
  risk: string;
  impact: string;
  precaution: string;
}

export interface HarvestGuidance {
  expected_harvest_window: string;
  maturity_signs: string[];
  post_harvest_tips: string[];
}

export interface AdvisoryResult {
  title: string;
  summary: string;
  risk_level: RiskLevel;
  confidence: ConfidenceLevel;
  assumptions: string[];
  diagnosis: DiagnosisSection;
  immediate_actions: ImmediateAction[];
  nutrient_plan: NutrientPlan;
  irrigation_plan: IrrigationPlan;
  pest_disease_watch: PestDiseaseWatchItem[];
  weather_risks: WeatherRiskItem[];
  organic_ipm_options: string[];
  cost_saving_tips: string[];
  harvest_guidance: HarvestGuidance;
  safety_precautions: string[];
  when_to_seek_expert_help: string;
  disclaimer: string;
}

export interface Advisory {
  id: string;
  user_id: string;
  farm_id: string;
  crop_id?: number | null;
  crop_name: string;
  crop_category: CropCategory;
  variety?: string | null;
  growth_stage: GrowthStage;
  season: Season;
  sowing_date?: string | null;
  area_acres: number;
  recent_weather: WeatherCondition | string;
  focus_areas: AdvisoryFocusArea[];
  symptoms?: string | null;
  last_fertilizer_applied?: string | null;
  last_pesticide_applied?: string | null;
  output_language: SupportedLanguage;
  detail_level: DetailLevel;
  has_photo: boolean;
  status: AdvisoryStatus;
  risk_level?: RiskLevel | null;
  title?: string | null;
  result?: AdvisoryResult | null;
  model_used?: string | null;
  is_saved: boolean;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  farm_name?: string;
  farm_state?: string;
  farm_district?: string;
}

export interface PhotoDiagnosisCause {
  name: string;
  category: IssueCategory;
  confidence: ConfidenceLevel;
  reasoning: string;
  recommended_actions: string[];
}

export interface DiagnosisResult {
  image_quality: ImageQuality;
  plant_identified: string;
  visible_observations: string[];
  possible_causes: PhotoDiagnosisCause[];
  next_steps: string[];
  needs_better_photo: boolean;
  better_photo_tips: string[];
  risk_level: RiskLevel;
  disclaimer: string;
}

export interface DiagnosisRecord {
  id: string;
  user_id: string;
  crop_hint?: string | null;
  notes?: string | null;
  output_language: SupportedLanguage;
  image_mime: string;
  image_sha256: string;
  result: DiagnosisResult;
  model_used: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  advisory_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ChatReply {
  answer: string;
  follow_up_suggestions: string[];
  needs_expert_referral: boolean;
}

export interface Feedback {
  id: string;
  advisory_id: string;
  user_id: string;
  rating: -1 | 1;
  comment?: string | null;
  created_at: string;
}

export interface DashboardStats {
  farms_count: number;
  advisories_count: number;
  saved_count: number;
  diagnoses_count: number;
  quota_limit: number;
  quota_used_today: number;
  quota_remaining_today: number;
  quota_resets_at: string;
  risk_distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  recent_advisories: Array<{
    id: string;
    crop_name: string;
    title: string | null;
    risk_level: RiskLevel | null;
    created_at: string;
    farm_name?: string;
    status: AdvisoryStatus;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
