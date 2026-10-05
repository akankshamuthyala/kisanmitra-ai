import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Printer,
  AlertTriangle,
  Shield,
  Droplets,
  Bug,
  CloudRain,
  Leaf,
  DollarSign,
  Scissors,
  Stethoscope,
  ThumbsUp,
  ThumbsDown,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import {
  useAdvisory,
  useToggleSaveAdvisory,
  useAdvisoryChat,
  useSendChatMessage,
  useAdvisoryFeedback,
} from '../hooks/useAdvisories.js';
import { RiskBadge } from '../components/ui/RiskBadge.js';
import { ConfidenceBadge } from '../components/ui/ConfidenceBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { formatDate, formatEnumLabel } from '../lib/format.js';
import type { AdvisoryResult } from '@shared/types.js';

/* ─── Collapsible Section ─── */
const Section: React.FC<{
  icon: React.ElementType;
  title: string;
  color: string;
  bg: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, title, color, bg, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <h3 className="text-sm font-bold text-stone-900">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-stone-50">{children}</div>}
    </div>
  );
};

/* ─── Chat Panel ─── */
const ChatPanel: React.FC<{ advisoryId: string }> = ({ advisoryId }) => {
  const { t } = useTranslation();
  const { data: messages, isLoading } = useAdvisoryChat(advisoryId);
  const sendMessage = useSendChatMessage(advisoryId);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput('');
    await sendMessage.mutateAsync(msg);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-sm font-bold text-stone-900">{t('advisory.chat_title', 'Ask Follow-up Questions')}</h3>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-3 px-1">
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map(m => (
            <div
              key={m.id}
              className={`p-3 rounded-xl text-sm ${
                m.role === 'user'
                  ? 'bg-emerald-50 text-emerald-900 ml-8'
                  : 'bg-stone-50 text-stone-800 mr-8'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className="text-[10px] text-stone-400 mt-1">{formatDate(m.created_at)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-400 text-center py-4">
            {t('advisory.chat_empty', 'Ask questions about this advisory...')}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={t('advisory.chat_placeholder', 'Type your question...')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
          disabled={sendMessage.isPending}
        />
        <button
          onClick={handleSend}
          disabled={sendMessage.isPending || !input.trim()}
          className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {sendMessage.isPending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const AdvisoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: advisory, isLoading, error, refetch } = useAdvisory(id);
  const toggleSave = useToggleSaveAdvisory();
  const submitFeedback = useAdvisoryFeedback(id || '');
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>;
  }

  if (error || !advisory) {
    return <ErrorState message={t('errors.load_advisory', 'Failed to load advisory')} onRetry={refetch} />;
  }

  const result: AdvisoryResult | null = advisory.result || null;

  const handleFeedback = async (rating: -1 | 1) => {
    try {
      await submitFeedback.mutateAsync({ rating });
      setFeedbackGiven(true);
    } catch { /* handled */ }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back', 'Back')}
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-stone-900">
              {result?.title || advisory.crop_name}
            </h1>
            <p className="text-sm text-stone-500">
              {advisory.farm_name && `${advisory.farm_name} • `}
              {formatEnumLabel(advisory.growth_stage)} • {formatEnumLabel(advisory.season)}
            </p>
            <p className="text-xs text-stone-400">{formatDate(advisory.created_at)}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {advisory.risk_level && <RiskBadge level={advisory.risk_level} />}
            <button
              onClick={() => toggleSave.mutateAsync(advisory.id)}
              className={`p-2 rounded-xl transition ${
                advisory.is_saved ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
              }`}
              aria-label={advisory.is_saved ? 'Unsave' : 'Save'}
            >
              {advisory.is_saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status */}
        {advisory.status === 'pending' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <Spinner size="sm" />
            <p className="text-sm font-medium text-amber-800">
              {t('advisory.generating', 'Generating advisory... This may take a moment.')}
            </p>
            <button onClick={() => refetch()} className="ml-auto p-1 text-amber-600 hover:text-amber-800">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {advisory.status === 'failed' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">
              {advisory.error_message || t('advisory.failed', 'Advisory generation failed.')}
            </p>
          </div>
        )}

        {/* Summary */}
        {result && (
          <div className="space-y-3">
            <p className="text-sm text-stone-700 leading-relaxed">{result.summary}</p>
            {result.confidence && <ConfidenceBadge level={result.confidence} />}
          </div>
        )}
      </div>

      {/* Advisory Sections */}
      {result && (
        <>
          {/* Immediate Actions */}
          {result.immediate_actions.length > 0 && (
            <Section icon={AlertTriangle} title={t('advisory.immediate_actions', 'Immediate Actions')} color="text-rose-600" bg="bg-rose-50" defaultOpen>
              <ol className="space-y-3">
                {result.immediate_actions.map((action, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl bg-stone-50">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {action.priority}
                    </span>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-stone-900">{action.action}</p>
                      <p className="text-stone-600">{action.why}</p>
                      <p className="text-xs text-stone-500">⏱ {action.timing}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Diagnosis */}
          {(result.diagnosis.probable_issues.length > 0 || result.diagnosis.healthy_indicators.length > 0) && (
            <Section icon={Stethoscope} title={t('advisory.diagnosis', 'Diagnosis')} color="text-orange-600" bg="bg-orange-50" defaultOpen>
              {result.diagnosis.probable_issues.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('advisory.probable_issues', 'Probable Issues')}</h4>
                  {result.diagnosis.probable_issues.map((issue, i) => (
                    <div key={i} className="p-3 rounded-xl bg-stone-50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">{issue.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold uppercase">{issue.category}</span>
                      </div>
                      <p className="text-xs text-stone-600">{issue.explanation}</p>
                      <p className="text-xs text-stone-500 italic">Evidence: {issue.evidence}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.diagnosis.healthy_indicators.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('advisory.healthy_signs', 'Healthy Signs')}</h4>
                  <ul className="space-y-1">
                    {result.diagnosis.healthy_indicators.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {/* Nutrient Plan */}
          {result.nutrient_plan.applications.length > 0 && (
            <Section icon={Leaf} title={t('advisory.nutrient_plan', 'Nutrient Plan')} color="text-emerald-600" bg="bg-emerald-50">
              <div className="space-y-3">
                {result.nutrient_plan.applications.map((app, i) => (
                  <div key={i} className="p-3 rounded-xl bg-stone-50 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="col-span-2 font-semibold text-stone-900 mb-1">{app.nutrient_or_product}</div>
                    <div><span className="text-stone-500">Dose:</span> {app.dose_per_acre}</div>
                    <div><span className="text-stone-500">Total:</span> {app.total_for_area}</div>
                    <div><span className="text-stone-500">Method:</span> {app.method}</div>
                    <div><span className="text-stone-500">Timing:</span> {app.timing}</div>
                  </div>
                ))}
                {result.nutrient_plan.notes && (
                  <p className="text-sm text-stone-600 italic">{result.nutrient_plan.notes}</p>
                )}
              </div>
            </Section>
          )}

          {/* Irrigation */}
          <Section icon={Droplets} title={t('advisory.irrigation', 'Irrigation Plan')} color="text-blue-600" bg="bg-blue-50">
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-stone-700">Method:</span> {result.irrigation_plan.method_recommendation}</p>
              <p><span className="font-semibold text-stone-700">Frequency:</span> {result.irrigation_plan.frequency}</p>
              {result.irrigation_plan.critical_stages.length > 0 && (
                <div>
                  <span className="font-semibold text-stone-700">Critical Stages:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {result.irrigation_plan.critical_stages.map((s, i) => (
                      <li key={i} className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.irrigation_plan.water_saving_tips.length > 0 && (
                <div>
                  <span className="font-semibold text-stone-700">Water Saving Tips:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {result.irrigation_plan.water_saving_tips.map((tip, i) => (
                      <li key={i} className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          {/* Pest & Disease Watch */}
          {result.pest_disease_watch.length > 0 && (
            <Section icon={Bug} title={t('advisory.pest_watch', 'Pest & Disease Watch')} color="text-amber-600" bg="bg-amber-50">
              <div className="space-y-3">
                {result.pest_disease_watch.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-stone-50 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{item.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        item.type === 'pest' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>{item.type}</span>
                    </div>
                    <p className="text-stone-600"><span className="font-medium">Signs:</span> {item.early_signs}</p>
                    <p className="text-stone-600"><span className="font-medium">Prevention:</span> {item.prevention}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      <div className="p-2 rounded-lg bg-emerald-50 text-xs">
                        <span className="block font-semibold text-emerald-700">Cultural</span>
                        <span className="text-emerald-600">{item.control_options.cultural}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 text-xs">
                        <span className="block font-semibold text-blue-700">Biological</span>
                        <span className="text-blue-600">{item.control_options.biological}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-orange-50 text-xs">
                        <span className="block font-semibold text-orange-700">Chemical</span>
                        <span className="text-orange-600">{item.control_options.chemical_if_needed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Weather Risks */}
          {result.weather_risks.length > 0 && (
            <Section icon={CloudRain} title={t('advisory.weather_risks', 'Weather Risks')} color="text-sky-600" bg="bg-sky-50">
              <div className="space-y-2">
                {result.weather_risks.map((wr, i) => (
                  <div key={i} className="p-3 rounded-xl bg-stone-50 text-sm space-y-1">
                    <p className="font-semibold text-stone-900">{wr.risk}</p>
                    <p className="text-stone-600">Impact: {wr.impact}</p>
                    <p className="text-stone-600">Precaution: {wr.precaution}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Organic / IPM */}
          {result.organic_ipm_options.length > 0 && (
            <Section icon={Leaf} title={t('advisory.organic_ipm', 'Organic & IPM Options')} color="text-teal-600" bg="bg-teal-50">
              <ul className="space-y-1.5">
                {result.organic_ipm_options.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />{o}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Cost Saving Tips */}
          {result.cost_saving_tips.length > 0 && (
            <Section icon={DollarSign} title={t('advisory.cost_tips', 'Cost Saving Tips')} color="text-green-600" bg="bg-green-50">
              <ul className="space-y-1.5">
                {result.cost_saving_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Harvest Guidance */}
          <Section icon={Scissors} title={t('advisory.harvest', 'Harvest Guidance')} color="text-purple-600" bg="bg-purple-50">
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-stone-700">Expected Window:</span> {result.harvest_guidance.expected_harvest_window}</p>
              {result.harvest_guidance.maturity_signs.length > 0 && (
                <div>
                  <span className="font-semibold text-stone-700">Maturity Signs:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {result.harvest_guidance.maturity_signs.map((s, i) => (
                      <li key={i} className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.harvest_guidance.post_harvest_tips.length > 0 && (
                <div>
                  <span className="font-semibold text-stone-700">Post-Harvest Tips:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {result.harvest_guidance.post_harvest_tips.map((tip, i) => (
                      <li key={i} className="text-stone-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>

          {/* Safety */}
          {result.safety_precautions.length > 0 && (
            <Section icon={Shield} title={t('advisory.safety', 'Safety Precautions')} color="text-rose-600" bg="bg-rose-50">
              <ul className="space-y-1.5">
                {result.safety_precautions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <Shield className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Expert Help */}
          {result.when_to_seek_expert_help && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-sm text-amber-800">
              <p className="font-bold mb-1">{t('advisory.seek_expert', '⚠ When to Seek Expert Help')}</p>
              <p>{result.when_to_seek_expert_help}</p>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="bg-stone-100 rounded-2xl p-4 text-xs text-stone-500 italic">
              {result.disclaimer}
            </div>
          )}

          {/* Feedback */}
          {!feedbackGiven && !advisory.feedback && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-700">{t('advisory.feedback_q', 'Was this advisory helpful?')}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFeedback(1)}
                  disabled={submitFeedback.isPending}
                  className="p-2.5 rounded-xl text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleFeedback(-1)}
                  disabled={submitFeedback.isPending}
                  className="p-2.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <ThumbsDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Chat */}
          <ChatPanel advisoryId={advisory.id} />
        </>
      )}
    </div>
  );
};

export default AdvisoryDetailPage;
