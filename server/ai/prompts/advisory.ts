import { sanitizeUserInput } from '../../utils/sanitize.js';
import type { Farm } from '../../../shared/types.js';
import type { AdvisoryInput } from '../../../shared/schemas.js';

export function buildAdvisoryPrompt(params: {
  farm: Farm;
  input: AdvisoryInput;
  cropName: string;
  hasPhoto: boolean;
}): string {
  const { farm, input, cropName, hasPhoto } = params;
  const todayIso = new Date().toISOString().split('T')[0];

  const district = sanitizeUserInput(farm.district, 60);
  const state = sanitizeUserInput(farm.state, 60);
  const variety = sanitizeUserInput(input.variety || 'Unknown / Traditional', 60);
  const sowingDate = sanitizeUserInput(input.sowing_date || 'Unknown', 20);
  const fertilizer = sanitizeUserInput(input.last_fertilizer_applied || 'None reported', 200);
  const pesticide = sanitizeUserInput(input.last_pesticide_applied || 'None reported', 200);
  const focusAreas = input.focus_areas.join(', ');
  const symptoms = sanitizeUserInput(input.symptoms || 'None reported', 1000);

  let prompt = `Create a crop advisory for the following farm situation.

<user_input>
Farm location: ${district}, ${state}, India
Soil type: ${farm.soil_type}
Irrigation source: ${farm.irrigation_source}
Crop category: ${input.crop_category}
Crop: ${cropName}   Variety: ${variety}
Season: ${input.season}
Growth stage: ${input.growth_stage}
Sowing date: ${sowingDate} (today is ${todayIso})
Area: ${input.area_acres} acres
Recent weather: ${input.recent_weather}
Last fertilizer applied: ${fertilizer}
Last pesticide applied: ${pesticide}
Focus areas requested: ${focusAreas}
Farmer's described symptoms: ${symptoms}
Photo attached: ${hasPhoto ? 'Yes' : 'No'}
</user_input>

Cover every requested focus area in depth and give brief coverage of the others. Compute quantities for the stated area where useful.`;

  if (hasPhoto) {
    prompt += `\nUse the photo as evidence in the diagnosis. Describe what you can and cannot see.`;
  }

  return prompt;
}
