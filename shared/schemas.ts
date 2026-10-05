import { z } from 'zod';
import {
  CROP_CATEGORIES,
  ADVISORY_FOCUS_AREAS,
  SEASONS,
  SOIL_TYPES,
  IRRIGATION_SOURCES,
  GROWTH_STAGES,
  RISK_LEVELS,
  SUPPORTED_LANGUAGES,
  DETAIL_LEVELS,
  WEATHER_CONDITIONS,
  CONFIDENCE_LEVELS,
  ISSUE_CATEGORIES,
  IMAGE_QUALITIES,
} from './enums.js';

// --- Auth Schemas ---
export const signupSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name cannot exceed 80 characters'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    preferred_language: z.enum(SUPPORTED_LANGUAGES).default('en'),
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name cannot exceed 80 characters')
      .optional(),
    preferred_language: z.enum(SUPPORTED_LANGUAGES).optional(),
    simple_mode: z.boolean().optional(),
    current_password: z.string().optional(),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(72, 'New password cannot exceed 72 characters')
      .regex(/[A-Za-z]/, 'New password must contain at least one letter')
      .regex(/[0-9]/, 'New password must contain at least one number')
      .optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z
  .object({
    password: z.string().min(1, 'Password is required to confirm account deletion'),
  })
  .strict();

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// --- Farm Schemas ---
export const farmSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Farm name must be at least 2 characters')
      .max(80, 'Farm name cannot exceed 80 characters'),
    state: z
      .string()
      .trim()
      .min(2, 'State must be at least 2 characters')
      .max(60, 'State cannot exceed 60 characters'),
    district: z
      .string()
      .trim()
      .min(2, 'District must be at least 2 characters')
      .max(60, 'District cannot exceed 60 characters'),
    village: z
      .string()
      .trim()
      .max(80, 'Village cannot exceed 80 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    total_area_acres: z
      .coerce
      .number({ invalid_type_error: 'Total area must be a number' })
      .min(0.1, 'Area must be at least 0.1 acres')
      .max(10000, 'Area cannot exceed 10,000 acres'),
    soil_type: z.enum(SOIL_TYPES).default('unknown'),
    irrigation_source: z.enum(IRRIGATION_SOURCES).default('rainfed'),
    latitude: z
      .coerce
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional()
      .nullable()
      .transform(val => (isNaN(val as number) ? null : val)),
    longitude: z
      .coerce
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional()
      .nullable()
      .transform(val => (isNaN(val as number) ? null : val)),
  })
  .strict();

export type FarmInput = z.infer<typeof farmSchema>;

// --- Advisory Schemas ---
export const advisoryInputSchema = z
  .object({
    farm_id: z.string().uuid('Invalid farm selection'),
    crop_category: z.enum(CROP_CATEGORIES),
    crop_id: z
      .coerce
      .number()
      .int()
      .positive()
      .optional()
      .nullable()
      .transform(val => (isNaN(val as number) ? null : val)),
    custom_crop_name: z
      .string()
      .trim()
      .min(2, 'Crop name must be at least 2 characters')
      .max(60, 'Crop name cannot exceed 60 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    variety: z
      .string()
      .trim()
      .max(60, 'Variety name cannot exceed 60 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    growth_stage: z.enum(GROWTH_STAGES),
    season: z.enum(SEASONS),
    sowing_date: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        val => {
          if (!val) return true;
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          const maxFuture = new Date();
          maxFuture.setDate(maxFuture.getDate() + 30);
          return date <= maxFuture;
        },
        { message: 'Sowing date cannot be more than 30 days in the future' }
      )
      .transform(val => (val === '' ? null : val)),
    area_acres: z
      .coerce
      .number({ invalid_type_error: 'Area must be a number' })
      .min(0.1, 'Area must be at least 0.1 acres')
      .max(10000, 'Area cannot exceed 10,000 acres'),
    recent_weather: z.enum(WEATHER_CONDITIONS),
    focus_areas: z
      .array(z.enum(ADVISORY_FOCUS_AREAS))
      .min(1, 'Please select at least one focus area')
      .refine(items => new Set(items).size === items.length, {
        message: 'Focus areas must be unique',
      }),
    symptoms: z
      .string()
      .trim()
      .max(1000, 'Symptoms description cannot exceed 1000 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    last_fertilizer_applied: z
      .string()
      .trim()
      .max(200, 'Fertilizer information cannot exceed 200 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    last_pesticide_applied: z
      .string()
      .trim()
      .max(200, 'Pesticide information cannot exceed 200 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    output_language: z.enum(SUPPORTED_LANGUAGES).default('en'),
    detail_level: z.enum(DETAIL_LEVELS).default('simple'),
  })
  .refine(data => data.crop_id != null || (data.custom_crop_name != null && data.custom_crop_name.length >= 2), {
    message: 'Either select a recognized crop or provide a custom crop name',
    path: ['crop_id'],
  });

export type AdvisoryInput = z.infer<typeof advisoryInputSchema>;

export const listAdvisoriesQuerySchema = z.object({
  q: z.string().trim().optional(),
  crop: z.string().trim().optional(),
  risk: z.enum(RISK_LEVELS).optional(),
  farm_id: z.string().uuid().optional(),
  saved: z
    .string()
    .optional()
    .transform(val => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ListAdvisoriesQuery = z.infer<typeof listAdvisoriesQuerySchema>;

export const regenerateAdvisorySchema = z
  .object({
    output_language: z.enum(SUPPORTED_LANGUAGES),
    detail_level: z.enum(DETAIL_LEVELS),
  })
  .strict();

export type RegenerateAdvisoryInput = z.infer<typeof regenerateAdvisorySchema>;

// --- Chat Schemas ---
export const chatInputSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters'),
  })
  .strict();

export type ChatInput = z.infer<typeof chatInputSchema>;

// --- Feedback Schema ---
export const feedbackSchema = z
  .object({
    rating: z.union([z.literal(1), z.literal(-1)], {
      errorMap: () => ({ message: 'Rating must be 1 (helpful) or -1 (not helpful)' }),
    }),
    comment: z
      .string()
      .trim()
      .max(1000, 'Comment cannot exceed 1000 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
  })
  .strict();

export type FeedbackInput = z.infer<typeof feedbackSchema>;

// --- Photo Diagnosis Input Schema ---
export const diagnoseInputSchema = z
  .object({
    crop_hint: z
      .string()
      .trim()
      .max(80, 'Crop hint cannot exceed 80 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .nullable()
      .transform(val => (val === '' ? null : val)),
    output_language: z.enum(SUPPORTED_LANGUAGES).default('en'),
  })
  .strict();

export type DiagnoseInput = z.infer<typeof diagnoseInputSchema>;

// --- AI Output Schemas (Validated with Zod) ---

export const probableIssueSchema = z.object({
  name: z.string().min(1),
  category: z.enum(ISSUE_CATEGORIES),
  likelihood: z.enum(CONFIDENCE_LEVELS),
  evidence: z.string().min(1),
  explanation: z.string().min(1),
});

export const immediateActionSchema = z.object({
  priority: z.number().int(),
  action: z.string().min(1),
  why: z.string().min(1),
  timing: z.string().min(1),
});

export const nutrientApplicationSchema = z.object({
  nutrient_or_product: z.string().min(1),
  dose_per_acre: z.string().min(1),
  total_for_area: z.string().min(1),
  method: z.string().min(1),
  timing: z.string().min(1),
});

export const nutrientPlanSchema = z.object({
  soil_test_recommended: z.boolean(),
  applications: z.array(nutrientApplicationSchema),
  notes: z.string(),
});

export const irrigationPlanSchema = z.object({
  method_recommendation: z.string().min(1),
  frequency: z.string().min(1),
  critical_stages: z.array(z.string()),
  water_saving_tips: z.array(z.string()),
});

export const pestDiseaseWatchItemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pest', 'disease']),
  early_signs: z.string().min(1),
  prevention: z.string().min(1),
  control_options: z.object({
    cultural: z.string(),
    biological: z.string(),
    chemical_if_needed: z.string(),
  }),
});

export const weatherRiskItemSchema = z.object({
  risk: z.string().min(1),
  impact: z.string().min(1),
  precaution: z.string().min(1),
});

export const harvestGuidanceSchema = z.object({
  expected_harvest_window: z.string().min(1),
  maturity_signs: z.array(z.string()),
  post_harvest_tips: z.array(z.string()),
});

export const advisoryResultSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  risk_level: z.enum(RISK_LEVELS),
  confidence: z.enum(CONFIDENCE_LEVELS),
  assumptions: z.array(z.string()),
  diagnosis: z.object({
    probable_issues: z.array(probableIssueSchema),
    healthy_indicators: z.array(z.string()),
  }),
  immediate_actions: z.array(immediateActionSchema),
  nutrient_plan: nutrientPlanSchema,
  irrigation_plan: irrigationPlanSchema,
  pest_disease_watch: z.array(pestDiseaseWatchItemSchema),
  weather_risks: z.array(weatherRiskItemSchema),
  organic_ipm_options: z.array(z.string()),
  cost_saving_tips: z.array(z.string()),
  harvest_guidance: harvestGuidanceSchema,
  safety_precautions: z.array(z.string()),
  when_to_seek_expert_help: z.string().min(1),
  disclaimer: z.string().min(1),
});

export const photoDiagnosisCauseSchema = z.object({
  name: z.string().min(1),
  category: z.enum(ISSUE_CATEGORIES),
  confidence: z.enum(CONFIDENCE_LEVELS),
  reasoning: z.string().min(1),
  recommended_actions: z.array(z.string()),
});

export const diagnosisResultSchema = z.object({
  image_quality: z.enum(IMAGE_QUALITIES),
  plant_identified: z.string().min(1),
  visible_observations: z.array(z.string()),
  possible_causes: z.array(photoDiagnosisCauseSchema),
  next_steps: z.array(z.string()),
  needs_better_photo: z.boolean(),
  better_photo_tips: z.array(z.string()),
  risk_level: z.enum(RISK_LEVELS),
  disclaimer: z.string().min(1),
});

export const chatReplySchema = z.object({
  answer: z.string().min(1),
  follow_up_suggestions: z.array(z.string()),
  needs_expert_referral: z.boolean(),
});
