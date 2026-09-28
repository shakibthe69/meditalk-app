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
}

export interface AiChatReply {
  text: string;
  related: DiseaseSummary[];
  isEmergency: boolean;
  language: 'en' | 'bn';
}

const BENGALI_RANGE = /[\u0980-\u09FF]/;
// Gemini API key is now stored securely on the backend server.
// The mobile app calls POST /api/ai/chat which proxies to Gemini.

/** Words that carry no meaning when searching the disease directory. */
const STOP_WORDS = new Set([
  'i', 'am', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'my', 'me', 'you', 'your',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will',
  'and', 'or', 'but', 'for', 'with', 'from', 'that', 'this', 'these', 'those', 'it',
  'of', 'to', 'in', 'on', 'at', 'be', 'been', 'being', 'not', 'no', 'so', 'if', 'when',
  'what', 'why', 'how', 'which', 'who', 'there', 'here', 'get', 'got', 'feel', 'feeling',
  ' feeling ', 'very', 'much', 'some', 'any', 'about', 'am', 'মি', 'আমি', 'আমার', 'এবং',
  'কি', 'কী', 'হয়', 'হচ্ছে', 'আছে', 'একটি', 'টি', 'করে', 'জন্য', 'সঙ্গে', 'থেকে',
]);

/**
 * Triage keywords: when any of these appear the answer must escalate to
 * emergency care instead of giving general guidance.
 */
const EMERGENCY_TERMS = [
  'chest pain', 'heart attack', 'cannot breathe', "can't breathe", 'trouble breathing',
  'shortness of breath', 'unconscious', 'fainted', 'seizure', 'stroke', 'bleeding heavily',
  'heavy bleeding', 'suicide', 'overdose', 'poison', 'anaphylaxis', 'blue lips',
  'severe burn', 'choking', 'paralysis',
  'বুকে ব্যথা', 'হার্ট অ্যাটাক', 'শ্বাস নিতে কষ্ট', 'শ্বাসকষ্ট', 'বেহোশ', 'খিঁচুনি',
  'স্ট্রোক', 'প্রচুর রক্তপাত', 'আত্মহত্যা', 'ওভারডোজ', 'বিষক্রিয়া',
];

/**
 * First-aid & primary care knowledge base used alongside Gemini AI
 * and as instant offline fallback.
 */
const KNOWLEDGE: Array<{
  keys: string[];
  en: string;
  bn: string;
}> = [
  {
    keys: ['fever', 'temperature', 'জ্বর', 'জ্বর আছে'],
    en: 'For a fever: rest, drink plenty of fluids, and take paracetamol as directed if needed. Monitor your temperature twice a day. See a doctor if it stays above 103°F (39.4°C), lasts more than 3 days, or comes with a stiff neck, rash or confusion.',
    bn: 'জ্বরের ক্ষেত্রে: বিশ্রাম নিন, প্রচুর পানি ও তরল খাবার খান, প্রয়োজনে নির্দেশ অনুযায়ী প্যারাসিটামল খান। দিনে দুইবার তাপমাত্রা মাপুন। ১০৩°F (৩৯.৪°C) এর বেশি থাকলে, ৩ দিনের বেশি থাকলে, অথবা ঘাড় জড়িয়ে যাওয়া, চুলকানি বা বিভ্রান্তি থাকলে ডাক্তার দেখান।',
  },
  {
    keys: ['headache', 'migraine', 'head pain', 'মাথাব্যথা', 'মাথা ব্যথা'],
    en: 'For a headache: rest in a quiet dark room, drink water, and avoid screens. Paracetamol usually helps. See a doctor urgently if it is the worst headache of your life, follows a head injury, or comes with fever, vomiting or vision changes.',
    bn: 'মাথাব্যথার ক্ষেত্রে: শান্ত ও অন্ধকার ঘরে বিশ্রাম নিন, পানি খান এবং স্ক্রিন এড়িয়ে চলুন। সাধারণত প্যারাসিটামল উপকারী। জীবনের সবচেয়ে তীব্র মাথাব্যথা হলে, মাথায় আঘাতের পর হলে, অথবা জ্বর, বমি বা দৃষ্টির সমস্যাসহ হলে তৎক্ষণাৎ ডাক্তার দেখান।',
  },
  {
    keys: ['cough', 'cold', 'sore throat', 'flu', 'কাশি', 'সর্দি', 'গলা ব্যথা'],
    en: 'For a cough or cold: rest, warm fluids, honey with warm water (not for children under 1), and salt-water gargles. Most colds settle in 7–10 days. See a doctor if you have high fever, breathlessness, chest pain, or symptoms beyond 10 days.',
    bn: 'কাশি বা সর্দির ক্ষেত্রে: বিশ্রাম নিন, উষ্ণ পানি ও তরল খাবার খান, গরম পানির সাথে মধু (১ বছরের কম শিশুর জন্য নয়) এবং লবণযুক্ত পানিতে গার্গল করুন। সাধারণ সর্দি ৭–১০ দিনে সেরি হয়। প্রবল জ্বর, শ্বাসকষ্ট, বুকে ব্যথা বা ১০ দিনের বেশি লক্ষণ থাকলে ডাক্তার দেখান।',
  },
  {
    keys: ['stomach', 'stomach pain', 'abdominal', 'gastric', 'acidity', 'পেট', 'পেট ব্যথা', 'গ্যাস্ট্রিক'],
    en: 'For stomach pain or acidity: eat small light meals, avoid spicy/fried food, tea and empty-stomach painkillers. Antacids often give relief. See a doctor if pain is severe or localized, there is blood in vomit/stool, or it lasts more than 2 days.',
    bn: 'পেট ব্যথা বা গ্যাস্ট্রিকের ক্ষেত্রে: হালকা ও ছোট খাবার খান, ঝাল-মসলাযুক্ত ও ভাজাপোড়া খাবার, চা এবং খালি পেটে ব্যথার ওষুধ এড়িয়ে চলুন। অ্যান্টাসিড সাধারণত উপকারী। তীব্র ব্যথা, বমি বা পায়খানায় রক্ত, অথবা ২ দিনের বেশি সমস্যা থাকলে ডাক্তার দেখান।',
  },
  {
    keys: ['diabetes', 'sugar', 'ডায়াবেটিস', 'রক্তের শর্করা'],
    en: 'Diabetes is managed with medicine, a low-sugar balanced diet, daily walking and regular sugar checks. Keep fasting sugar near 80–130 mg/dL as advised by your doctor, and never stop medicine on your own.',
    bn: 'ডায়াবেটিস নিয়ন্ত্রণ হয় ওষুধ, কম-চিনি সুষম খাবার, প্রতিদিন হাঁটা এবং নিয়মিত শর্করা পরীক্ষার মাধ্যমে। ডাক্তারের পরামর্শ অনুযায়ী ফাস্টিং শর্করা ৮০–১৩০ mg/dL এর কাছাকাছি রাখুন এবং নিজে থেকে ওষুধ বন্ধ করবেন না।',
  },
  {
    keys: ['medicine', 'pill', 'tablet', 'dose', 'reminder', 'ওষুধ', 'ডোজ', 'রিমাইন্ডার'],
    en: 'Take medicines exactly at the times written on your prescription — you can add those times as custom reminder times in Add Medicine, and control sound, vibration and voice readout under Reminder Notifications in your profile.',
    bn: 'ওষুধ প্রেসক্রিপশনে লেখা সময় অনুযায়ী খান — "ওষুধ যোগ" ফর্মে সেই সময়গুলো কাস্টম রিমাইন্ডার হিসেবে যোগ করতে পারেন, এবং প্রোফাইলের "রিমাইন্ডার নোটিফিকেশন" থেকে সাউন্ড, কম্পন ও ভয়েস নিয়ন্ত্রণ করতে পারেন।',
  },
  {
    keys: ['drug', 'capsule', 'antibiotic', 'অ্যান্টিবায়োটিক'],
    en: 'Never share or reuse prescribed antibiotics, and finish the full course your doctor gave. Check with a pharmacist before combining two medicines, and avoid taking painkillers on an empty stomach unless directed.',
    bn: 'ডাক্তারের প্রেসক্রিপশন ছাড়া অ্যান্টিবায়োটিক ভাগ করে খাবেন বা বাদ দেবেন না — পুরো কোর্স শেষ করুন। দুটি ওষুধ একসাথে খাওয়ার আগে ফার্মাসিস্টের পরামর্শ নিন, এবং খালি পেটে ব্যথার ওষুধ খাবেন না (নির্দেশ না থাকলে)।',
  },
];

const pickLanguage = (message: string, fallback: 'en' | 'bn'): 'en' | 'bn' =>
  BENGALI_RANGE.test(message) ? 'bn' : fallback;

const composeSymptomKeywords = (message: string): string[] => {
  const words = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const phrases = [message.toLowerCase().trim()];
  return [...new Set([...phrases, ...words.sort((a, b) => b.length - a.length)])];
};

/**
 * Complete AI Healthcare Assistant integrating Google Gemini AI
 * with Meditalk's disease directory and emergency triage safety.
 */
export const aiChatService = {
  async reply(message: string, appLanguage: 'en' | 'bn'): Promise<AiChatReply> {
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

    // 1. Immediate Emergency Escalation (999 Safety Triage)
    if (EMERGENCY_TERMS.some((term) => lower.includes(term))) {
      return {
        text:
          language === 'bn'
            ? '⚠️ এটি জরুরি পরিস্থিতির লক্ষণ হতে পারে। অবিলম্বে ৯৯৯-এ কল করুন বা জরুরি সেবা খুলুন। অপেক্ষা করবেন না — নিকটস্থ হাসপাতালে যান।\n\nআমি সাধারণ তথ্য দিতে পারি, কিন্তু এই অবস্থায় দ্রুত জরুরি চিকিৎসা নেওয়া আবশ্যক।'
            : '⚠️ These may be emergency symptoms. Call 999 or open Emergency Service right away, or go to the nearest hospital immediately. Do not wait.\n\nI can share general health information, but this is not a substitute for urgent medical care.',
        related: [],
        isEmergency: true,
        language,
      };
    }

    // 2. Fetch related diseases from Meditalk directory in parallel
    const relatedPromise = this.searchRelated(message);

    // 3. Try Google Gemini AI with the configured API key
    try {
      const geminiText = await this.callGeminiAi(message, language);
      const related = await relatedPromise;

      if (geminiText && geminiText.trim().length > 10) {
        return {
          text: geminiText.trim(),
          related: related.slice(0, 3),
          isEmergency: false,
          language,
        };
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back to expert knowledge base:', e);
    }

    // 4. Fallback to Local Knowledge Base + Disease Directory
    const related = await relatedPromise;
    return this.generateKnowledgeReply(message, language, related);
  },

  /** Call Gemini AI via secure backend proxy */
  async callGeminiAi(userMessage: string, language: 'en' | 'bn'): Promise<string | null> {
    try {
      const res = await apiClient.post('/api/ai/chat', {
        message: userMessage,
        language,
      });

      const data = res.data?.data;
      if (data?.text && data.text.trim().length > 10) {
        return data.text;
      }
    } catch (err) {
      console.warn('Backend AI chat call failed:', err);
    }
    return null;
  },

  /** Knowledge-base response generator when remote API is offline */
  generateKnowledgeReply(
    message: string,
    language: 'en' | 'bn',
    related: DiseaseSummary[]
  ): AiChatReply {
    const lower = message.toLowerCase().trim();

    // App how-to questions
    const appHelp = KNOWLEDGE.find(
      (entry) =>
        entry.keys.includes('reminder') &&
        (lower.includes('reminder') ||
          lower.includes('notification') ||
          lower.includes('how to') ||
          lower.includes('কীভাবে') ||
          lower.includes('কিভাবে') ||
          lower.includes('রিমাইন্ডার'))
    );
    if (appHelp) {
      return { text: language === 'bn' ? appHelp.bn : appHelp.en, related: [], isEmergency: false, language };
    }

    const knowledge = KNOWLEDGE.find((entry) =>
      entry.keys.some((key) => lower.includes(key))
    );
    const advice = knowledge ? (language === 'bn' ? knowledge.bn : knowledge.en) : '';

    if (related.length === 0) {
      if (advice) {
        return {
          text: `${advice}\n\n${
            language === 'bn'
              ? 'আরও নির্দিষ্ট করে লিখলে (যেমন: কত দিন ধরে, কত তীব্র) ভালো ফল পাবেন। সন্দেহ হলে ডাক্তার দেখান।'
              : 'Add more detail (how many days, how severe) for a sharper answer, and see a doctor if you are unsure.'
          }`,
          related: [],
          isEmergency: false,
          language,
        };
      }

      return {
        text:
          language === 'bn'
            ? `আপনার লক্ষণটির জন্য আরও সুনির্দিষ্ট পরামর্শ পেতে বিস্তারিত লিখুন (যেমন: কত দিন ধরে সমস্যা, তাপমাত্রা ইত্যাদি)। প্রয়োজনবোধে অভিজ্ঞ ডাক্তারের সাথে যোগাযোগ করুন।`
            : `For more tailored guidance, please share more context (such as how many days, severity). Consult a doctor for any persistent symptoms.`,
        related: [],
        isEmergency: false,
        language,
      };
    }

    const top = related[0];
    const topOverview =
      language === 'bn'
        ? top.shortOverviewBn || top.shortOverviewEn || ''
        : top.shortOverviewEn || top.shortOverviewBn || '';

    const list = related
      .slice(0, 3)
      .map((d, index) => {
        const name = language === 'bn' ? d.nameBn || d.nameEn : d.nameEn || d.nameBn;
        return `${index + 1}. ${name}`;
      })
      .join('\n');

    const header =
      language === 'bn'
        ? `আপনার বর্ণনা অনুযায়ী সম্ভাব্য সম্পর্কিত অবস্থা:\n\n${list}`
        : `Based on what you described, these conditions may be related:\n\n${list}`;

    const body = topOverview ? `\n\n${topOverview}` : '';
    const fallback = advice ? `\n\n${advice}` : '';

    const footer =
      language === 'bn'
        ? '\n\nশুধুমাত্র সাধারণ তথ্য — এটি নিশ্চিত রোগ নির্ণয় নয়। চিকিৎসা সংক্রান্ত সিদ্ধান্তের জন্য অভিজ্ঞ চিকিৎসকের পরামর্শ নিন।'
        : '\n\nGeneral health guidance only — this is not a medical diagnosis. Please consult a qualified doctor for medical decisions.';

    return {
      text: `${header}${body}${fallback}${footer}`,
      related: related.slice(0, 3),
      isEmergency: false,
      language,
    };
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
