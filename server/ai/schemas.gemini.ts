import { Type } from '@google/genai';

export const advisoryResponseSchema = {
  type: Type.OBJECT,
  required: [
    'title',
    'summary',
    'risk_level',
    'confidence',
    'assumptions',
    'diagnosis',
    'immediate_actions',
    'nutrient_plan',
    'irrigation_plan',
    'pest_disease_watch',
    'weather_risks',
    'organic_ipm_options',
    'cost_saving_tips',
    'harvest_guidance',
    'safety_precautions',
    'when_to_seek_expert_help',
    'disclaimer',
  ],
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    risk_level: { type: Type.STRING, enum: ['low', 'moderate', 'high', 'critical'] },
    confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
    assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
    diagnosis: {
      type: Type.OBJECT,
      required: ['probable_issues', 'healthy_indicators'],
      properties: {
        probable_issues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['name', 'category', 'likelihood', 'evidence', 'explanation'],
            properties: {
              name: { type: Type.STRING },
              category: {
                type: Type.STRING,
                enum: ['pest', 'disease', 'nutrient_deficiency', 'water_stress', 'weed', 'abiotic_stress', 'other'],
              },
              likelihood: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              evidence: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
          },
        },
        healthy_indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    immediate_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['priority', 'action', 'why', 'timing'],
        properties: {
          priority: { type: Type.INTEGER },
          action: { type: Type.STRING },
          why: { type: Type.STRING },
          timing: { type: Type.STRING },
        },
      },
    },
    nutrient_plan: {
      type: Type.OBJECT,
      required: ['soil_test_recommended', 'applications', 'notes'],
      properties: {
        soil_test_recommended: { type: Type.BOOLEAN },
        applications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ['nutrient_or_product', 'dose_per_acre', 'total_for_area', 'method', 'timing'],
            properties: {
              nutrient_or_product: { type: Type.STRING },
              dose_per_acre: { type: Type.STRING },
              total_for_area: { type: Type.STRING },
              method: { type: Type.STRING },
              timing: { type: Type.STRING },
            },
          },
        },
        notes: { type: Type.STRING },
      },
    },
    irrigation_plan: {
      type: Type.OBJECT,
      required: ['method_recommendation', 'frequency', 'critical_stages', 'water_saving_tips'],
      properties: {
        method_recommendation: { type: Type.STRING },
        frequency: { type: Type.STRING },
        critical_stages: { type: Type.ARRAY, items: { type: Type.STRING } },
        water_saving_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    pest_disease_watch: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'type', 'early_signs', 'prevention', 'control_options'],
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['pest', 'disease'] },
          early_signs: { type: Type.STRING },
          prevention: { type: Type.STRING },
          control_options: {
            type: Type.OBJECT,
            required: ['cultural', 'biological', 'chemical_if_needed'],
            properties: {
              cultural: { type: Type.STRING },
              biological: { type: Type.STRING },
              chemical_if_needed: { type: Type.STRING },
            },
          },
        },
      },
    },
    weather_risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['risk', 'impact', 'precaution'],
        properties: {
          risk: { type: Type.STRING },
          impact: { type: Type.STRING },
          precaution: { type: Type.STRING },
        },
      },
    },
    organic_ipm_options: { type: Type.ARRAY, items: { type: Type.STRING } },
    cost_saving_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    harvest_guidance: {
      type: Type.OBJECT,
      required: ['expected_harvest_window', 'maturity_signs', 'post_harvest_tips'],
      properties: {
        expected_harvest_window: { type: Type.STRING },
        maturity_signs: { type: Type.ARRAY, items: { type: Type.STRING } },
        post_harvest_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    safety_precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
    when_to_seek_expert_help: { type: Type.STRING },
    disclaimer: { type: Type.STRING },
  },
} as const;

export const diagnosisResponseSchema = {
  type: Type.OBJECT,
  required: [
    'image_quality',
    'plant_identified',
    'visible_observations',
    'possible_causes',
    'next_steps',
    'needs_better_photo',
    'better_photo_tips',
    'risk_level',
    'disclaimer',
  ],
  properties: {
    image_quality: { type: Type.STRING, enum: ['good', 'fair', 'poor', 'not_a_plant'] },
    plant_identified: { type: Type.STRING },
    visible_observations: { type: Type.ARRAY, items: { type: Type.STRING } },
    possible_causes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'category', 'confidence', 'reasoning', 'recommended_actions'],
        properties: {
          name: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['pest', 'disease', 'nutrient_deficiency', 'water_stress', 'weed', 'abiotic_stress', 'other'],
          },
          confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          reasoning: { type: Type.STRING },
          recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    needs_better_photo: { type: Type.BOOLEAN },
    better_photo_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
    risk_level: { type: Type.STRING, enum: ['low', 'moderate', 'high', 'critical'] },
    disclaimer: { type: Type.STRING },
  },
} as const;

export const chatResponseSchema = {
  type: Type.OBJECT,
  required: ['answer', 'follow_up_suggestions', 'needs_expert_referral'],
  properties: {
    answer: { type: Type.STRING },
    follow_up_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    needs_expert_referral: { type: Type.BOOLEAN },
  },
} as const;
