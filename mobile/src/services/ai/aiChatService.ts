import { diseaseApi } from '../api/diseaseApi';
import { apiClient } from '../api/apiClient';
import { DiseaseSummary } from '../../types';

export type ChatRole = 'user' | 'ai';

export interface AiChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  related?: DiseaseSummary[];
  isEmergency?: boolean;
  /** Marks the initial greeting so it is never replayed as conversation history. */
  isGreeting?: boolean;
}

export interface AiChatReply {
  text: string;
  related: DiseaseSummary[];
  isEmergency: boolean;
  language: 'en' | 'bn';
}

const BENGALI_RANGE = /[\u0980-\u09FF]/;
// The API key lives only on the backend. POST /api/ai/chat proxies to Gemini and,
// when the AI provider is unreachable, answers from the server-side health engine
// (emergency triage + bilingual knowledge base). The client therefore keeps NO
// duplicate triage/knowledge logic — it only renders the answer and, for genuine
// emergencies, shows the 999 escalation banner produced by the backend.

const pickLanguage = (message: string, fallback: 'en' | 'bn'): 'en' | 'bn' =>
  BENGALI_RANGE.test(message) ? 'bn' : fallback;

/** Max turns of history replayed to the backend for conversation continuity. */
const MAX_HISTORY_TURNS = 12;

/**
 * AI Healthcare Assistant client. Every message goes to the backend, which answers
 * with Gemini when available and with its safety-reviewed offline engine otherwise.
 * Related conditions from the MediTalk disease directory are attached by the client
 * because that is a read-only directory search, not AI work.
 */
export const aiChatService = {
  /** Full conversation so far, minus the greeting, oldest first. */
  buildHistory(messages: AiChatMessage[]): Array<{ role: string; text: string }> {
    return messages
      .filter((m) => m.text?.trim() && (m.role === 'user' || m.role === 'ai'))
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, text: m.text }));
  },

  async reply(
    message: string,
    appLanguage: 'en' | 'bn',
    history: AiChatMessage[] = []
  ): Promise<AiChatReply> {
    const language = pickLanguage(message, appLanguage);
    const lower = message.toLowerCase().trim();

    if (!lower) {
      return {
        text:
          language === 'bn'
            ? 'আপনার লক্ষণ বা স্বাস্থ্য প্রশ্ন লিখুন — আমি সাহায্য করার চেষ্টা করব।'
            : 'Tell me your symptom or question and I will try to help.',
        related: [],
        isEmergency: false,
        language,
      };
    }

    // Related conditions from the MediTalk directory (parallel with the AI call).
    const relatedPromise = this.searchRelated(message);

    // Ask the backend — Gemini first, offline health engine as its fallback.
    const text = await this.callBackendAi(message, language, history);

    const related = await relatedPromise;

    // The backend flags true emergencies in the answer text (⚠️ marker); surface it.
    const isEmergency = text.startsWith('⚠️');

    return {
      text,
      related: related.slice(0, 3),
      isEmergency,
      language,
    };
  },

  /** Call the backend health-chat endpoint (Gemini with server-side fallback). */
  async callBackendAi(
    userMessage: string,
    language: 'en' | 'bn',
    history: AiChatMessage[]
  ): Promise<string> {
    try {
      const res = await apiClient.post('/api/ai/chat', {
        message: userMessage,
        language,
        history: this.buildHistory(history),
      });

      const data = res.data?.data;
      if (data?.text && data.text.trim()) {
        return data.text;
      }
    } catch (err) {
      console.warn('Backend AI chat call failed:', err);
    }

    // Network-level failure (backend unreachable): a clear, honest message.
    return language === 'bn'
      ? 'এই মুহূর্তে স্বাস্থ্য সহকারীর সার্ভারে পৌঁছাতে পারছি না। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন। জরুরি অবস্থায় ৯৯৯-এ কল করুন।'
      : 'I cannot reach the health assistant server right now. Please check your connection and try again. In an emergency, call 999.';
  },

  /** Searches the disease directory, falling back to keyword-by-keyword tries. */
  async searchRelated(message: string): Promise<DiseaseSummary[]> {
    const seen = new Map<number, DiseaseSummary>();

    const merge = (results: DiseaseSummary[]) => {
      results.forEach((d) => {
        if (!seen.has(d.id)) seen.set(d.id, d);
      });
    };

    const tryQuery = async (query: string) => {
      if (!query.trim()) return;
      try {
        const res = await diseaseApi.searchDiseases(query, 0, 8);
        merge(res?.content || []);
      } catch {
        // Directory offline
      }
    };

    await tryQuery(message);

    if (seen.size < 3) {
      const keywords = composeSymptomKeywords(message).slice(0, 4);
      for (const keyword of keywords) {
        if (seen.size >= 5) break;
        await tryQuery(keyword);
      }
    }

    return [...seen.values()];
  },
};

/** Words that carry no meaning when searching the disease directory. */
const STOP_WORDS = new Set([
  'i', 'am', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'my', 'me', 'you', 'your',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will',
  'and', 'or', 'but', 'for', 'with', 'from', 'that', 'this', 'these', 'those', 'it',
  'of', 'to', 'in', 'on', 'at', 'be', 'been', 'being', 'not', 'no', 'so', 'if', 'when',
  'what', 'why', 'how', 'which', 'who', 'there', 'here', 'get', 'got', 'feel', 'feeling',
  'very', 'much', 'some', 'any', 'about', 'মি', 'আমি', 'আমার', 'এবং',
  'কি', 'কী', 'হয়', 'হচ্ছে', 'আছে', 'একটি', 'টি', 'করে', 'জন্য', 'সঙ্গে', 'থেকে',
]);

const composeSymptomKeywords = (message: string): string[] => {
  const words = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const phrases = [message.toLowerCase().trim()];
  return [...new Set([...phrases, ...words.sort((a, b) => b.length - a.length)])];
};
