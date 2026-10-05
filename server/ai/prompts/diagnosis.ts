import { sanitizeUserInput } from '../../utils/sanitize.js';

export function buildDiagnosisPrompt(params: {
  cropHint?: string | null;
  notes?: string | null;
}): string {
  const cropHint = sanitizeUserInput(params.cropHint || 'Unknown / Not specified', 80);
  const notes = sanitizeUserInput(params.notes || 'None provided', 1000);

  return `Analyze the attached crop photo.
<user_input>
Crop (if known): ${cropHint}
Farmer notes: ${notes}
</user_input>
First decide whether the image shows a plant at all and whether it is clear enough to analyze. Describe only what is visible. Give up to 3 ranked possible causes with confidence, and practical next steps.`;
}
