package com.meditalk.services;

import com.meditalk.dto.MedicineResponse;
import com.meditalk.dto.MedicineScheduleDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Patient-facing health answer engine used whenever the generative AI provider is
 * unavailable (network failure, quota, or a provider credential problem).
 *
 * <p>Without this, the chat would dead-end with "service unavailable". With it, every
 * message gets a real, safety-reviewed answer — including questions about the patient's
 * own confirmed medicines — so the feature always works.</p>
 */
@Service
public class HealthChatFallbackService {

    /** Phrases that mean the patient is asking about their own medication list. */
    private static final List<String> MY_MEDICINES_PHRASES = List.of(
            "my medicine", "my medicines", "my medication", "my medications", "what medicines am i taking",
            "which medicine am i taking", "list my medicine", "my tablets", "my prescriptions", "my drugs",
            "আমার ওষুধ", "আমি কি ওষুধ", "আমার ঔষধ", "আমার প্রেসক্রিপশন", "ওষুধের তালিকা", "আমি কোন ওষুধ"
    );

    /** Phrases that ask how to take medicines in general. */
    private static final List<String> USAGE_PHRASES = List.of(
            "how should i take", "how do i take", "how to take medicine", "before or after meal",
            "missed a dose", "missed my dose", "side effect", "overdose", "with food",
            "ওষুধ কীভাবে", "ওষুধ কিভাবে", "খাবারের আগে না পরে", "ডোজ বাদ", "পার্শ্বপ্রতিক্রিয়া"
    );

    public static class Answer {
        private final String text;
        private final String topic;
        private final boolean emergency;

        Answer(String text, String topic, boolean emergency) {
            this.text = text;
            this.topic = topic;
            this.emergency = emergency;
        }

        public String getText() { return text; }
        public String getTopic() { return topic; }
        public boolean isEmergency() { return emergency; }
    }

    /**
     * Builds the best available answer for the message.
     *
     * @param message    the patient's message
     * @param language   "en" or "bn"
     * @param medicines  the patient's confirmed medicines (may be empty)
     */
    public Answer answer(String message, String language, List<MedicineResponse> medicines) {
        boolean bengali = "bn".equalsIgnoreCase(language);
        String lower = message == null ? "" : message.toLowerCase(Locale.ROOT).trim();
        List<MedicineResponse> meds = medicines == null ? List.of() : medicines;

        if (lower.isEmpty()) {
            return new Answer(bengali
                    ? "আপনার লক্ষণ বা স্বাস্থ্য সংক্রান্ত প্রশ্ন লিখুন — আমি সাধারণ তথ্য দিয়ে সাহায্য করার চেষ্টা করব।"
                    : "Tell me your symptom or health question and I will try to help with general information.",
                    "empty", false);
        }

        // 1. Emergency triage always wins.
        if (HealthKnowledgeBase.isEmergency(lower)) {
            return new Answer(bengali
                    ? "⚠️ এটি জরুরি পরিস্থিতির লক্ষণ হতে পারে। অবিলম্বে ৯৯৯-এ কল করুন বা নিকটস্থ হাসপাতালের "
                    + "জরুরি বিভাগে যান। অপেক্ষা করবেন না।\n\nআমি সাধারণ স্বাস্থ্য তথ্য দিতে পারি, কিন্তু "
                    + "এই অবস্থায় দ্রুত জরুরি চিকিৎসা নেওয়া আবশ্যক।"
                    : "⚠️ These may be emergency symptoms. Call your local emergency number or go to the nearest "
                    + "hospital emergency department right away. Do not wait.\n\nI can share general health "
                    + "information, but this situation needs urgent medical care.",
                    "emergency", true);
        }

        // 2. How to take medicines / missed dose / side effects. Checked before the
        //    medicine-list intent because phrases like "how should I take my medicine"
        //    contain both.
        if (matchesAny(lower, USAGE_PHRASES)) {
            return new Answer(buildUsageAnswer(meds, bengali), "medicine-usage", false);
        }

        // 3. "What medicines am I taking?" — answered from the patient's own confirmed records.
        if (matchesAny(lower, MY_MEDICINES_PHRASES)) {
            return new Answer(buildMedicineListAnswer(meds, bengali), "my-medicines", false);
        }

        // 4. General health topic from the knowledge base.
        return HealthKnowledgeBase.find(lower)
                .map(entry -> new Answer(bengali ? entry.getBn() : entry.getEn(), entry.getTopic(), false))
                .orElseGet(() -> new Answer(buildClarifyingAnswer(bengali), "general", false));
    }

    private boolean matchesAny(String lower, List<String> phrases) {
        return phrases.stream().anyMatch(lower::contains);
    }

    private String buildMedicineListAnswer(List<MedicineResponse> medicines, boolean bengali) {
        if (medicines.isEmpty()) {
            return bengali
                    ? "আপনার নিশ্চিত করা ওষুধের তালিকায় এখনো কোনো সক্রিয় ওষুধ নেই। প্রেসক্রিপশন স্ক্যান করে "
                    + "যাচাই ও সংরক্ষণ করলে তালিকা এখানে দেখতে পাবেন।\n\nআমি কোনো ওষুধ নিজে থেকে যোগ করি না — "
                    + "শুধু আপনি যেগুলো নিশ্চিত করেছেন সেগুলোই দেখাই।\n\nচিকিৎসা সংক্রান্ত সিদ্ধান্তের জন্য "
                    + "সর্বদা আপনার ডাক্তারের পরামর্শ নিন।"
                    : "Your confirmed medication list has no active medicines yet. After you scan, review and "
                    + "save a prescription, it will appear here.\n\nI never add medicines on my own — this list "
                    + "shows only what you have confirmed.\n\nAlways follow your doctor's advice for medical "
                    + "decisions.";
        }

        StringBuilder sb = new StringBuilder(bengali
                ? "আপনার নিশ্চিত করা সক্রিয় ওষুধ:\n"
                : "Your confirmed active medicines:\n");

        int index = 1;
        for (MedicineResponse medicine : medicines.stream().limit(15).collect(Collectors.toList())) {
            sb.append(index++).append(". ").append(medicine.getName());
            if (medicine.getDose() != null && !medicine.getDose().isBlank()) {
                sb.append(" — ").append(medicine.getDose());
            }

            List<MedicineScheduleDto> schedules = medicine.getSchedules();
            if (schedules != null && !schedules.isEmpty()) {
                String times = schedules.stream()
                        .filter(s -> Boolean.TRUE.equals(s.getIsEnabled()))
                        .map(MedicineScheduleDto::getTime)
                        .filter(t -> t != null && !t.isBlank())
                        .collect(Collectors.joining(", "));
                if (!times.isBlank()) {
                    sb.append(bengali ? " | সময়: " : " | times: ").append(times);
                }
            }

            if (medicine.getFoodInstruction() != null && !medicine.getFoodInstruction().isBlank()) {
                sb.append(bengali ? " | " : " | ")
                        .append(medicine.getFoodInstruction().replace('_', ' ').toLowerCase(Locale.ROOT));
            }
            sb.append("\n");
        }

        sb.append(bengali
                ? "\nএই তালিকা আপনার নিজের নিশ্চিত করা রেকর্ড থেকে নেওয়া — আমি কোনো ওষুধ বা ডোজ পরিবর্তন করি না। "
                + "মাত্রা বা সময় নিয়ে সন্দেহ থাকলে আপনার ডাক্তার বা ফার্মাসিস্টের সাথে মিলিয়ে নিন।"
                : "\nThis list comes from the records you confirmed — I never change or add a medicine or dose. "
                + "If any strength or timing looks wrong, check it with your doctor or pharmacist.");
        return sb.toString();
    }

    private String buildUsageAnswer(List<MedicineResponse> medicines, boolean bengali) {
        String base = HealthKnowledgeBase.find("medicine")
                .map(entry -> bengali ? entry.getBn() : entry.getEn())
                .orElse("");

        if (medicines.isEmpty()) {
            return base;
        }

        StringBuilder sb = new StringBuilder(base);
        sb.append(bengali
                ? "\n\nআপনার বর্তমান ওষুধের নির্ধারিত সময়:\n"
                : "\n\nScheduled times from your own records:\n");
        medicines.stream()
                .filter(m -> m.getSchedules() != null && !m.getSchedules().isEmpty())
                .limit(10)
                .forEach(medicine -> {
                    String times = medicine.getSchedules().stream()
                            .filter(s -> Boolean.TRUE.equals(s.getIsEnabled()))
                            .map(MedicineScheduleDto::getTime)
                            .filter(t -> t != null && !t.isBlank())
                            .collect(Collectors.joining(", "));
                    if (!times.isBlank()) {
                        sb.append("- ").append(medicine.getName()).append(": ").append(times).append("\n");
                    }
                });
        sb.append(bengali
                ? "\nএই সময় আপনার প্রেসক্রিপশন থেকে নেওয়া; ওষুধের মোড়ক বা ডাক্তারের নির্দেশের সাথে মিলিয়ে নিন।"
                : "\nThese times come from your saved prescription — always confirm them against the medicine "
                + "label and your doctor's instructions.");
        return sb.toString();
    }

    private String buildClarifyingAnswer(boolean bengali) {
        return bengali
                ? "আপনার প্রশ্নটি আমি ঠিকভাবে বুঝতে চাই। অনুগ্রহ করে একটু বিস্তারিত লিখুন:\n"
                + "- কোন লক্ষণ বা সমস্যা, আর কত দিন ধরে?\n"
                + "- কতটা তীব্র, আর এর সাথে অন্য কিছু আছে কি?\n"
                + "- আপনার বয়স ও আগে থেকে কোনো রোগ থাকলে সেটিও লিখুন।\n\n"
                + "সাধারণ বিষয় যেমন জ্বর, মাথাব্যথা, কাশি, পেট ব্যথা, ডায়রিয়া, অ্যালার্জি, ডায়াবেটিস, "
                + "রক্তচাপ, হাঁপানি, ঘুম বা ওষুধ নিয়ে সরাসরি জিজ্ঞেস করতে পারেন।\n\n"
                + "মনে রাখবেন: আমি রোগ নির্ণয় করি না — গুরুতর বা দীর্ঘস্থায়ী সমস্যায় ডাক্তার দেখান।"
                : "I want to make sure I understand. Could you add a little more detail?\n"
                + "- Which symptom or problem, and for how many days?\n"
                + "- How severe is it, and is anything else happening with it?\n"
                + "- Your age, and any long-term condition you already have.\n\n"
                + "You can also ask me directly about common topics such as fever, headache, cough, stomach "
                + "pain, diarrhoea, allergy, diabetes, blood pressure, asthma, sleep, or medicines.\n\n"
                + "Please remember: I do not diagnose. For anything severe or long-lasting, see a doctor.";
    }
}
