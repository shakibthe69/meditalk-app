package com.meditalk.services;

import com.meditalk.entities.*;
import com.meditalk.repositories.DiseaseCategoryRepository;
import com.meditalk.repositories.DiseaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Component
@Order(10)
public class DiseaseDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DiseaseDataInitializer.class);

    private final DiseaseCategoryRepository categoryRepository;
    private final DiseaseRepository diseaseRepository;

    public DiseaseDataInitializer(DiseaseCategoryRepository categoryRepository, DiseaseRepository diseaseRepository) {
        this.categoryRepository = categoryRepository;
        this.diseaseRepository = diseaseRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0 && diseaseRepository.count() > 0) {
            log.info("Disease database already populated with {} categories and {} diseases.",
                    categoryRepository.count(), diseaseRepository.count());
            return;
        }

        log.info("Initializing comprehensive Disease & Health Information Guide database...");

        // 1. Categories
        DiseaseCategory catResp = createCategory("Respiratory Diseases", "শ্বাসতন্ত্রের রোগ", "respiratory-diseases", "wind",
                "Conditions affecting lungs, bronchial tubes, and airways.", "ফুসফুস, শ্বাসনালী ও শ্বাসপ্রশ্বাস সম্পর্কিত রোগ।", 1);
        DiseaseCategory catCardio = createCategory("Cardiovascular Diseases", "হৃদরোগ ও রক্ত সংবহনতন্ত্র", "cardiovascular-diseases", "heart",
                "Conditions affecting the heart and circulatory blood vessels.", "হৃদপিণ্ড ও রক্তনালী সম্পর্কিত বিভিন্ন জটিলতা।", 2);
        DiseaseCategory catEndo = createCategory("Endocrine & Metabolic", "হরমোন ও বিপাকীয় রোগ", "endocrine-metabolic", "activity",
                "Hormonal imbalances, diabetes, and metabolic system conditions.", "ডায়াবেটিস, থাইরয়েড ও বিপাকীয় স্বাস্থ্য সমস্যা।", 3);
        DiseaseCategory catInf = createCategory("Infectious & Tropical", "সংক্রামক ও গ্রীষ্মমন্ডলীয় রোগ", "infectious-diseases", "shield-alert",
                "Bacterial, viral, and mosquito-borne communicable infections.", "জীবাণু, ভাইরাস ও মশাবাহিত সংক্রামক ব্যাধি।", 4);
        DiseaseCategory catDigest = createCategory("Digestive & Gastrointestinal", "পরিপাকতন্ত্র ও গ্যাস্ট্রিক", "digestive-system", "utensils",
                "Disorders of the stomach, intestines, liver, and esophagus.", "পাকস্থলী, অন্ত্র, লিভার ও খাদ্যনালীর সমস্যা।", 5);
        DiseaseCategory catNeuro = createCategory("Neurological Disorders", "স্নায়ুতন্ত্র ও মস্তিষ্কের রোগ", "neurological-diseases", "brain",
                "Conditions impacting the brain, nerves, and spinal pathways.", "মস্তিষ্ক, স্নায়ু ও মেরুদণ্ডের স্বাস্থ্য জটিলতা।", 6);
        DiseaseCategory catKidney = createCategory("Kidney & Urinary System", "কিডনি ও মূত্রনালীর রোগ", "kidney-urinary", "droplet",
                "Kidney function, filtration, and urinary health disorders.", "কিডনি ও রেচনতন্ত্রের বিভিন্ন রোগ।", 7);
        DiseaseCategory catJoint = createCategory("Musculoskeletal & Joint", "হাড়, পেশী ও জয়েন্টের রোগ", "musculoskeletal-joints", "bone",
                "Arthritis, bone density loss, and joint inflammation.", "বাত ব্যথা, হাড়ের ক্ষয় ও জয়েন্টের প্রদাহ।", 8);
        DiseaseCategory catSkin = createCategory("Skin & Allergic Conditions", "চর্মরোগ ও অ্যালার্জি", "dermatological-skin", "sparkles",
                "Dermatological infections, eczema, and allergy responses.", "ত্বকের প্রদাহ, সংক্রমণ ও অ্যালার্জিজনিত সমস্যা।", 9);
        DiseaseCategory catBlood = createCategory("Blood & Hematology", "রক্তের রোগ", "blood-disorders", "droplets",
                "Anemia, clotting disorders, and blood health abnormalities.", "রক্তস্বল্পতা ও রক্তের উপাদান সম্পর্কিত ব্যাধি।", 10);
        DiseaseCategory catMental = createCategory("Mental & Emotional Health", "মানসিক স্বাস্থ্য ও উদ্বেগ", "mental-behavioral", "smile",
                "Depression, anxiety disorders, and psychological wellbeing.", "হতাশা, অতিরিক্ত দুশ্চিন্তা ও মানসিক সুস্থতা।", 11);
        DiseaseCategory catEnt = createCategory("ENT & Oral Health", "নাক, কান, গলা ও মুখগহ্বর", "ent-oral", "stethoscope",
                "Sinus, throat, tonsil, and dental health conditions.", "সাইনাস, টনসিল, কান ও গলার সংক্রমণ।", 12);
        DiseaseCategory catEmerg = createCategory("Emergency Conditions", "জরুরি চিকিৎসা পরিস্থিতি", "emergency-conditions", "alert-triangle",
                "Life-threatening situations requiring immediate hospital care.", "জীবনঘাতী পরিস্থিতি যাতে তাৎক্ষণিক জরুরি চিকিৎসা প্রয়োজন।", 13);

        categoryRepository.saveAll(List.of(catResp, catCardio, catEndo, catInf, catDigest, catNeuro, catKidney, catJoint, catSkin, catBlood, catMental, catEnt, catEmerg));

        // 2. Diseases
        List<Disease> diseases = new ArrayList<>();

        // --- DIABETES MELLITUS ---
        Disease diabetes = Disease.builder()
                .nameEn("Diabetes Mellitus (Type 2)")
                .nameBn("টাইপ ২ ডায়াবেটিস")
                .slug("diabetes-mellitus-type-2")
                .category(catEndo)
                .subcategoryEn("Metabolic Endocrine Disorder")
                .subcategoryBn("বিপাকীয় হরমোন ব্যাধি")
                .alternativeNamesEn("Type 2 Diabetes, High Blood Sugar, T2D, Adult-onset diabetes")
                .alternativeNamesBn("ডায়াবেটিস, বহুমূত্র রোগ, রক্তে উচ্চ শর্করা, সুগার")
                .overviewEn("Type 2 Diabetes is a chronic metabolic condition characterized by high levels of blood glucose (blood sugar) due to insulin resistance and inadequate insulin secretion. Over time, uncontrolled diabetes can affect the heart, blood vessels, eyes, kidneys, and nerves.")
                .overviewBn("টাইপ ২ ডায়াবেটিস একটি দীর্ঘমেয়াদী বিপাকীয় রোগ যেখানে শরীরে ইনসুলিন সঠিকভাবে কাজ না করায় বা অপর্যাপ্ত তৈরি হওয়ায় রক্তে গ্লুকোজ বা চিনির মাত্রা অতিরিক্ত বেড়ে যায়। দীর্ঘদিন অনিয়ন্ত্রিত থাকলে এটি হার্ট, কিডনি, চোখ এবং স্নায়ুর ক্ষতি করতে পারে।")
                .diagnosisEn("Diagnosed through laboratory blood tests: Fasting Blood Sugar (FBS >= 7.0 mmol/L or 126 mg/dL), 2-hour Post-prandial Glucose (>= 11.1 mmol/L or 200 mg/dL), and Glycated Hemoglobin (HbA1c >= 6.5%). Repeated testing is often required to confirm.")
                .diagnosisBn("রক্ত পরীক্ষার মাধ্যমে নির্ণয় করা হয়: খালি পেটে রক্তের শর্করা (FBS >= ৭.০ mmol/L), খাবার ২ ঘণ্টা পর শর্করা (২-hour OGTT >= ১১.১ mmol/L), এবং ৩ মাসের গড় শর্করার পরীক্ষা (HbA1c >= ৬.৫%)।")
                .treatmentOverviewEn("Management focuses on keeping blood sugar within target ranges through dietary modification, regular aerobic physical activity, weight management, and physician-prescribed oral anti-diabetic medications or insulin therapy when necessary.")
                .treatmentOverviewBn("সুষম খাদ্যাভ্যাস, ওজন নিয়ন্ত্রণ, নিয়মিত শারীরিক ব্যায়াম এবং চিকিৎসকের নির্দেশ অনুযায়ী মুখে খাবার ওষুধ বা ইনসুলিন গ্রহণের মাধ্যমে রক্তে শর্করার মাত্রা কাঙ্ক্ষিত সীমার মধ্যে রাখা হয়।")
                .homeCareEn("Regular blood glucose self-monitoring with a glucometer, maintaining a logbook, daily foot inspections for minor cuts or blisters, and adhering strictly to scheduled medication timing.")
                .homeCareBn("গ্লুকোমিটার দিয়ে নিয়মিত রক্তের সুগার পরীক্ষা ও লিখে রাখা, প্রতিদিন পায়ের যত্ন নেওয়া ও কোনো ক্ষত আছে কিনা দেখা এবং সঠিক সময়ে ওষুধ খাওয়া।")
                .dietLifestyleEn("Emphasize high-fiber vegetables, whole grains, lean proteins, and healthy fats. Strictly minimize refined carbohydrates, sweetened beverages, and ultra-processed foods. Engage in at least 150 minutes of moderate exercise per week.")
                .dietLifestyleBn("প্রচুর আঁশযুক্ত শাকসবজি, লাল চাল/আটা, ডাল এবং পর্যাপ্ত প্রোটিন গ্রহণ করুন। চিনিযুক্ত খাবার, কোমল পানীয় ও ফাস্টফুড বর্জন করুন। সপ্তাহে অন্তত ১৫০ মিনিট হাঁটুন।")
                .preventionEn("Maintain a healthy body weight, engage in daily physical exercise, consume a nutrient-dense balanced diet, and undergo annual health screenings if family history exists.")
                .preventionBn("ওজন নিয়ন্ত্রণে রাখা, প্রতিদিন শারীরিক পরিশ্রম বা হাঁটা, পুষ্টিকর খাবার গ্রহণ এবং পরিবারে ডায়াবেটিসের ইতিহাস থাকলে বছরে অন্তত একবার রক্তের শর্করা পরীক্ষা করা।")
                .doctorVisitEn("Visit your doctor for routine checkups every 3 to 6 months for HbA1c review, blood pressure check, lipid profile, and annual comprehensive eye and kidney screening.")
                .doctorVisitBn("প্রতি ৩-৬ মাস অন্তর চিকিৎসকের কাছে গিয়ে HbA1c, রক্তচাপ ও লিপিড প্রোফাইল পরীক্ষা করান। বছরে অন্তত একবার চোখ ও কিডনি পরীক্ষা করানো জরুরি।")
                .emergencyEn("Seek IMMEDIATE emergency medical care if you experience symptoms of severe hypoglycemia (blood sugar < 3.9 mmol/L with confusion, extreme sweating, shakiness, unconsciousness) or severe hyperglycemia with fruity breath, rapid breathing, and persistent vomiting (Diabetic Ketoacidosis/HHS).")
                .emergencyBn("রক্তের সুগার অতিরিক্ত কমে গেলে (হাত-পা কাঁপা, অতিরিক্ত ঘাম, মাথা ঘোরা, অজ্ঞান হওয়া) অথবা সুগার অতিরিক্ত বেড়ে তীব্র বমি, শ্বাসকষ্ট ও বিভ্রান্তি দেখা দিলে কালবিলম্ব না করে অবিলম্বে জরুরি বিভাগে যান।")
                .durationEn("Chronic (Lifelong management with lifestyle and medical support)")
                .durationBn("দীর্ঘস্থায়ী (আজীবন সুশৃঙ্খল জীবনযাপন ও চিকিৎসার মাধ্যমে নিয়ন্ত্রণে রাখতে হয়)")
                .isPopular(true)
                .viewCount(1420)
                .status("PUBLISHED")
                .sourceName("World Health Organization (WHO) & American Diabetes Association (ADA)")
                .sourceUrl("https://www.who.int/news-room/fact-sheets/detail/diabetes")
                .referenceNote("Reviewed according to ADA 2026 Standards of Care in Diabetes.")
                .lastReviewedAt(LocalDate.of(2026, 9, 1))
                .build();

        addSymptoms(diabetes, List.of(
                new String[]{"Frequent urination (Polyuria)", "ঘন ঘন প্রস্রাবের বেগ", "true"},
                new String[]{"Increased thirst (Polydipsia)", "অতিরিক্ত তৃষ্ণা লাগা", "true"},
                new String[]{"Unexplained weight loss", "অকারণেই ওজন কমে যাওয়া", "true"},
                new String[]{"Chronic fatigue and weakness", "সারাক্ষণ ক্লান্তি ও দুর্বলতা অনুভব", "false"},
                new String[]{"Blurred vision", "চোখে ঝাপসা দেখা", "false"},
                new String[]{"Slow-healing sores or frequent infections", "শরীরের ক্ষত বা ঘা দেরিতে শুকানো", "false"},
                new String[]{"Tingling or numbness in hands/feet", "হাত-পায়ে অবশ ভাব বা সুই ফোটার মতো অনুভূতি", "false"}
        ));

        addCauses(diabetes, List.of(
                new String[]{"Insulin resistance in muscle, liver, and fat tissues", "শরীরের কোষে ইনসুলিন সংবেদনশীলতা কমে যাওয়া"},
                new String[]{"Inadequate insulin secretion by pancreatic beta cells", "অগ্ন্যাশয় থেকে পর্যাপ্ত ইনসুলিন তৈরি না হওয়া"},
                new String[]{"Genetic predisposition and family history", "বংশগত বা জেনেটিক কারণ"},
                new String[]{"Excess body weight and physical inactivity", "অতিরিক্ত ওজন ও কায়িক পরিশ্রমের অভাব"}
        ));

        addRiskFactors(diabetes, List.of(
                new String[]{"Overweight or obesity (especially visceral abdominal fat)", "অতিরিক্ত শারীরিক ওজন বা ভুঁড়ি"},
                new String[]{"Age 35 years or older", "বয়স ৩৫ বা তার বেশি হওয়া"},
                new String[]{"First-degree relative with diabetes", "পরিবারে মা-বাবা বা ভাই-বোনের ডায়াবেটিস থাকা"},
                new String[]{"Sedentary lifestyle and lack of exercise", "অলস জীবনযাপন ও ব্যায়াম না করা"},
                new String[]{"History of gestational diabetes or polycystic ovary syndrome (PCOS)", "গর্ভকালীন ডায়াবেটিস বা পিসিওএস-এর ইতিহাস"},
                new String[]{"High blood pressure or abnormal cholesterol levels", "উচ্চ রক্তচাপ বা রক্তে অতিরিক্ত কোলেস্টেরল"}
        ));

        addMedicines(diabetes, List.of(
                new String[]{"Metformin (Biguanide class)", "মেটফরমিন", "Biguanides", "বিগুয়ানাইড", "First-line oral antidiabetic medication that reduces hepatic glucose production and improves insulin sensitivity.", "লিভারে গ্লুকোজ তৈরি কমায় এবং শরীরে ইনসুলিনের কার্যকারিতা বাড়ায়।"},
                new String[]{"Sulfonylureas / DPP-4 Inhibitors", "সালফোনিলইউরিয়া / ডিপিপি-৪ ইনহিবিটর", "Oral Hypoglycemic Agents", "মুখে খাবার অ্যান্টি-ডায়াবেটিক ওষুধ", "Stimulate pancreas to release more insulin in response to meals.", "অগ্ন্যাশয়কে খাবার গ্রহণের পর ইনসুলিন নিঃসরণে সাহায্য করে।"},
                new String[]{"SGLT-2 Inhibitors", "এসজিএলটি-২ ইনহিবিটর", "SGLT2 Inhibitors", "এসজিএলটি-২ ইনহিবিটর", "Help kidneys remove glucose through urine and provide cardiovascular/renal protection.", "কিডনির মাধ্যমে অতিরিক্ত শর্করা প্রস্রাবে বের করে দেয়।"},
                new String[]{"Insulin Preparations (Basal/Bolus)", "ইনসুলিন ইনজেকশন", "Hormone Replacement", "হরমোন প্রতিস্থাপন", "Injectable human insulin or analogues when oral medications are insufficient.", "মুখে খাবার ওষুধে সুগার নিয়ন্ত্রণে না এলে চিকিৎসকের পরামর্শে গ্রহণ করতে হয়।"}
        ));

        addWarningSigns(diabetes, List.of(
                new String[]{"Blood glucose dropping below 3.9 mmol/L (70 mg/dL)", "সুগার ৩.৯ mmol/L এর নিচে নেমে যাওয়া", "true"},
                new String[]{"Loss of consciousness or seizures from hypoglycemia", "অজ্ঞান হয়ে পড়া বা খিঁচুনি হওয়া", "true"},
                new String[]{"Persistent non-healing foot ulcers or blackened toes", "পায়ে কালো দাগ বা দীর্ঘদিনের না শুকানো গভীর ক্ষত", "false"},
                new String[]{"Sudden significant loss of vision", "হঠাৎ দৃষ্টিশক্তি হ্রাস পাওয়া", "true"},
                new String[]{"Severe nausea, rapid breathing, and confusion", "তীব্র বমি ভাব, দ্রুত শ্বাসপ্রশ্বাস ও বিভ্রান্তি", "true"}
        ));
        diseases.add(diabetes);

        // --- HYPERTENSION ---
        Disease hypertension = Disease.builder()
                .nameEn("Hypertension (High Blood Pressure)")
                .nameBn("উচ্চ রক্তচাপ (হাইপারটেনশন)")
                .slug("hypertension-high-blood-pressure")
                .category(catCardio)
                .subcategoryEn("Cardiovascular Vascular Disorder")
                .subcategoryBn("রক্ত সংবহনতন্ত্রের ব্যাধি")
                .alternativeNamesEn("High Blood Pressure, Elevated BP, Arterial Hypertension")
                .alternativeNamesBn("উচ্চ রক্তচাপ, হাই প্রেশার, ব্লাড প্রেশার")
                .overviewEn("Hypertension is a chronic medical condition in which the force of the blood against the artery walls is consistently too high (systolic >= 140 mmHg and/or diastolic >= 90 mmHg). Often referred to as a 'silent killer' because it usually produces no noticeable symptoms while damaging blood vessels, heart, brain, and kidneys.")
                .overviewBn("উচ্চ রক্তচাপ একটি নীরব ঘাতক ব্যাধি যেখানে রক্তনালীর প্রাচীরে রক্তের চাপ স্বাভাবিকের চেয়ে স্থায়ীভাবে বেশি থাকে (সিস্টোলিক ১৪০ বা বেশি এবং ডায়াস্টোলিক ৯০ বা বেশি)। সাধারণত কোনো সুস্পষ্ট উপসর্গ ছাড়াই এটি হার্ট অ্যাটাক, স্ট্রোক ও কিডনি বিকল করতে পারে।")
                .diagnosisEn("Diagnosed through multiple accurate blood pressure readings taken on separate occasions using a validated automated or manual sphygmomanometer. 24-hour ambulatory BP monitoring may also be used.")
                .diagnosisBn("শান্ত পরিবেশে অন্তত ২-৩ বার ভিন্ন ভিন্ন দিনে সঠিক নিয়মে রক্তচাপ মেপে এটি নির্ণয় করা হয়। প্রয়োজনে ২৪ ঘণ্টার অ্যাম্বুলেটরি বিপি মনিটরিং করা হয়।")
                .treatmentOverviewEn("Treatment includes sodium restriction, weight loss, DASH diet, regular aerobic exercise, stress reduction, and antihypertensive medications prescribed by a medical doctor.")
                .treatmentOverviewBn("খাবারে বাড়তি লবণ বর্জন, ওজন কমানো, নিয়মিত ব্যায়াম, মানসিক চাপ নিয়ন্ত্রণ এবং চিকিৎসকের দেওয়া রক্তচাপ নিয়ন্ত্রক ওষুধ নিয়মিত সেবন করা।")
                .homeCareEn("Maintain a calibrated home digital BP monitor, record readings twice daily (morning and evening), reduce processed salty foods, and never stop medication abruptly.")
                .homeCareBn("বাড়িতে নিয়মিত প্রেশার মেপে ডায়েরিতে লিখে রাখা, পাতে কাঁচা লবণ না খাওয়া এবং রক্তচাপ স্বাভাবিক মনে হলেও নিজে থেকে ওষুধ বন্ধ না করা।")
                .dietLifestyleEn("Adopt the DASH diet (rich in fruits, vegetables, potassium, and low-fat dairy). Restrict sodium intake to less than 2,000 mg (under 1 teaspoon salt) per day. Avoid smoking and limit alcohol.")
                .dietLifestyleBn("প্রচুর ফলমূল, শাকসবজি ও পটাশিয়াম সমৃদ্ধ খাবার খান। প্রতিদিন ৫ গ্রামের (১ চা চামচ) কম লবণ গ্রহণ করুন। ধূমপান ও জর্দা সম্পূর্ণ বর্জন করুন।")
                .preventionEn("Maintain healthy BMI, engage in moderate exercise 30 minutes daily, minimize dietary salt, manage mental stress, and undergo regular routine BP checks.")
                .preventionBn("আদর্শ ওজন বজায় রাখা, প্রতিদিন অন্তত ৩০ মিনিট হাঁটা, রান্নায় লবণ কম দেওয়া ও বছরে কয়েকবার রক্তচাপ পরীক্ষা করা।")
                .doctorVisitEn("Schedule clinical checkups every 1 to 3 months until blood pressure is stabilized, and every 6 months thereafter along with ECG, lipid profile, and serum creatinine checks.")
                .doctorVisitBn("রক্তচাপ নিয়ন্ত্রণে না আসা পর্যন্ত প্রতি ১-২ মাস অন্তর এবং নিয়ন্ত্রণে থাকলে প্রতি ৬ মাস পর পর চিকিৎসককে দেখান।")
                .emergencyEn("Seek IMMEDIATE emergency medical attention if BP exceeds 180/120 mmHg accompanied by chest pain, shortness of breath, severe headache, numbness/weakness, or visual changes (Hypertensive Crisis).")
                .emergencyBn("রক্তচাপ ১৮০/১২০ mmHg এর বেশি হলে এবং সাথে বুকে ব্যথা, শ্বাসকষ্ট, তীব্র মাথাব্যথা বা শরীরের একপাশ অবশ লাগলে কালবিলম্ব না করে অবিলম্বে জরুরি হাসপাতালে যান।")
                .durationEn("Chronic (Requires lifelong monitoring and lifestyle adherence)")
                .durationBn("দীর্ঘস্থায়ী (আজীবন নিয়মিত পর্যবেক্ষণ ও নিয়ম মেনে চলতে হয়)")
                .isPopular(true)
                .viewCount(1280)
                .status("PUBLISHED")
                .sourceName("World Health Organization (WHO) & International Society of Hypertension")
                .sourceUrl("https://www.who.int/news-room/fact-sheets/detail/hypertension")
                .referenceNote("Standardized under WHO 2025 Global Guidelines for Hypertension.")
                .lastReviewedAt(LocalDate.of(2026, 9, 5))
                .build();

        addSymptoms(hypertension, List.of(
                new String[]{"Often completely asymptomatic (Silent Killer)", "বেশিরভাগ ক্ষেত্রে কোনো লক্ষণ থাকে না", "true"},
                new String[]{"Occasional morning headaches", "সকালে ঘুম থেকে ওঠার পর মাথার পেছনে ব্যথা", "false"},
                new String[]{"Dizziness or lightheadedness", "মাথা ঘোরা বা শরীর টলমল করা", "false"},
                new String[]{"Shortness of breath on mild exertion", "অল্প পরিশ্রমে হাঁপিয়ে ওঠা", "false"},
                new String[]{"Nosebleeds (Epistaxis) in severe cases", "অতিরিক্ত চাপে নাক দিয়ে রক্ত পড়া", "false"},
                new String[]{"Palpitations or pounding sensation in chest/ears", "বুক ধড়ফড় করা বা কানের ভেতর শব্দের অনুভূতি", "false"}
        ));

        addCauses(hypertension, List.of(
                new String[]{"Primary/Essential hypertension (90-95% of cases without single identifiable cause)", "প্রাইমারি হাইপারটেনশন (অজানা ও বহুমুখী কারণ)"},
                new String[]{"Secondary causes: Chronic kidney disease, renal artery stenosis", "কিডনি রোগ বা রেনাল ধমনী সরু হওয়া"},
                new String[]{"Endocrine disorders (Cushing syndrome, Hyperaldosteronism, Pheochromocytoma)", "হরমোনজনিত বিভিন্ন রোগ"},
                new String[]{"Obstructive sleep apnea", "ঘুমের মধ্যে শ্বাসকষ্ট বা স্লিপ অ্যাপনিয়া"}
        ));

        addRiskFactors(hypertension, List.of(
                new String[]{"High dietary salt/sodium consumption", "খাবারে অতিরিক্ত কাঁচা লবণ বা সোডিয়াম খাওয়া"},
                new String[]{"Physical inactivity and sedentary habits", "ব্যায়ামহীন অলস জীবনযাপন"},
                new String[]{"Overweight and obesity", "শারীরিক অতিরিক্ত ওজন"},
                new String[]{"Tobacco use and smoking", "ধূমপান, তামাক ও জর্দা সেবন"},
                new String[]{"Family history of cardiovascular disease", "পরিবারে উচ্চ রক্তচাপ বা হার্টের রোগের ইতিহাস"},
                new String[]{"Chronic psychological stress", "অতিরিক্ত মানসিক দুশ্চিন্তা ও অনিদ্রা"}
        ));

        addMedicines(hypertension, List.of(
                new String[]{"ACE Inhibitors / ARBs (e.g. Losartan, Olmesartan)", "এআরবি / এসিই ইনহিবিটর (লোসারটান, ওলমেসারটান)", "Antihypertensive", "রক্তচাপ নিয়ন্ত্রক", "Relax blood vessels by blocking angiotensin II action.", "রক্তনালীকে শিথিল করে রক্তচাপ কমায় এবং কিডনিকে সুরক্ষা দেয়।"},
                new String[]{"Calcium Channel Blockers (e.g. Amlodipine)", "ক্যালসিয়াম চ্যানেল ব্লকার (অ্যামলোডিপিন)", "Vasodilator", "রক্তনালী প্রসারক", "Prevents calcium entry into smooth muscle cells, widening arterial vessels.", "রক্তনালী প্রসারিত করে রক্তের প্রবাহ সহজ করে।"},
                new String[]{"Thiazide Diuretics (e.g. Hydrochlorothiazide, Indapamide)", "থায়াজাইড ডাইইউরেটিক্স", "Diuretic", "মূত্রবর্ধক", "Promote renal excretion of excess fluid and sodium.", "শরীর থেকে অতিরিক্ত পানি ও লবণ প্রস্রাবের সাথে বের করে দেয়।"},
                new String[]{"Beta-Blockers (e.g. Bisoprolol, Metoprolol)", "বিটা-ব্লকার (বাইসোপ্রোলল)", "Beta Adrenergic Antagonist", "হার্ট রেট নিয়ন্ত্রক", "Reduce heart workload and regulate heart rate.", "হার্টের কাজের চাপ কমায় ও নাড়ির গতি নিয়ন্ত্রণ করে।"}
        ));

        addWarningSigns(hypertension, List.of(
                new String[]{"Severe chest pain radiating to arm or jaw", "বুকে তীব্র চাপ বা ব্যথা যা বাম বাহু বা চোয়ালে ছড়ায়", "true"},
                new String[]{"Sudden weakness or numbness in face, arm, or leg", "হঠাৎ মুখ বা শরীরের একপাশ অবশ বা দুর্বল হয়ে যাওয়া", "true"},
                new String[]{"Difficulty speaking or slurred speech", "কথা বলতে জড়তা বা অস্পষ্টতা", "true"},
                new String[]{"Severe explosive headache with confusion", "হঠাৎ প্রচণ্ড তীব্র মাথাব্যথা ও চোখে অন্ধকার দেখা", "true"},
                new String[]{"Acute severe shortness of breath", "তীব্র শ্বাসকষ্ট ও বুক ধড়ফড়", "true"}
        ));
        diseases.add(hypertension);

        // --- ASTHMA ---
        Disease asthma = Disease.builder()
                .nameEn("Bronchial Asthma")
                .nameBn("ব্রঙ্কিয়াল হাঁপানি (অ্যাজমা)")
                .slug("bronchial-asthma")
                .category(catResp)
                .subcategoryEn("Chronic Inflammatory Airway Disease")
                .subcategoryBn("শ্বাসনালীর দীর্ঘমেয়াদী প্রদাহ")
                .alternativeNamesEn("Asthma, Reactive Airway Disease, Bronchospasm")
                .alternativeNamesBn("হাঁপানি, শ্বাসকষ্ট, ব্রঙ্কিয়াল অ্যাজমা")
                .overviewEn("Asthma is a long-term inflammatory disease of the airways of the lungs. It is characterized by variable and recurring symptoms, reversible airflow obstruction, and bronchospasm. When exposed to triggers, the airways become swollen, narrowed, and produce excess mucus.")
                .overviewBn("অ্যাজমা বা হাঁপানি হলো ফুসফুসের শ্বাসনালীর একটি দীর্ঘমেয়াদী অ্যালার্জি ও প্রদাহজনিত রোগ। ধুলাবালি, ঠান্ডা বা অ্যালার্জেনের সংস্পর্শে এলে শ্বাসনালী ফুলে সংকুচিত হয়ে পড়ে এবং কফ জমে শ্বাস নিতে কষ্ট হয় ও বুকে বাঁশির মতো শব্দ হয়।")
                .diagnosisEn("Diagnosed through clinical history and lung function tests such as Spirometry (demonstrating reversible airway obstruction with FEV1/FVC improvement post-bronchodilator) and Peak Expiratory Flow (PEF) monitoring.")
                .diagnosisBn("লক্ষণ ও স্পাইরোমেট্রি (Spirometry) পরীক্ষার মাধ্যমে ফুসফুসের বাতাস চলাচলের ক্ষমতা মেপে অ্যাজমা নিশ্চিত করা হয়। পিক ফ্লো মিটার দিয়েও পর্যবেক্ষণ করা যায়।")
                .treatmentOverviewEn("Long-term management combines environmental trigger avoidance, daily controller inhalers (inhaled corticosteroids), and quick-relief rescue inhalers (short-acting beta-agonists) during flare-ups.")
                .treatmentOverviewBn("অ্যালার্জি ও ধুলাবালি এড়িয়ে চলা, নিয়মিত প্রিভেন্টার বা কন্ট্রোলার ইনহেলার ব্যবহার করা এবং হঠাৎ শ্বাসকষ্টের সময় তাৎক্ষণিক আরামদায়ক রিলিভার ইনহেলার গ্রহণ করা।")
                .homeCareEn("Identify and avoid personal triggers (dust mites, smoke, pollen, cold air). Practice proper inhaler technique with a spacer, track peak flow readings, and follow an Asthma Action Plan.")
                .homeCareBn("ধুলাবালি, ঘরের ঝুল ও সিগারেটের ধোঁয়া থেকে দূরে থাকুন। সঠিক নিয়মে স্পেসার দিয়ে ইনহেলার নিন এবং বিছানার চাদর গরম পানিতে ধুয়ে রোদে শুকান।")
                .dietLifestyleEn("Maintain a healthy weight, consume fresh fruits rich in antioxidants, avoid sulfites/preservatives if sensitive, and do warm-up exercises before physical activity in cold weather.")
                .dietLifestyleBn("প্রচুর তাজা ফলমূল ও শাকসবজি খান। খুব ঠান্ডা পানি বা আইসক্রিম এড়িয়ে চলুন এবং শীতে বাইরে যাওয়ার সময় নাক-মুখ মাফলার বা মাস্ক দিয়ে ঢেকে রাখুন।")
                .preventionEn("Avoid active and passive tobacco smoke, minimize exposure to air pollution and biomass fuel smoke, receive annual influenza vaccination, and use protective masks in dusty environments.")
                .preventionBn("ধূমপান ও ধোঁয়া বর্জন করুন, শীতকালে ইনফ্লুয়েঞ্জা ভ্যাকসিন নিন এবং ধুলাবালিময় স্থানে নিয়মিত মাস্ক ব্যবহার করুন।")
                .doctorVisitEn("Consult your pulmonologist or general physician if you need your rescue inhaler more than twice a week, wake up at night with coughing, or when symptoms interfere with normal daily activities.")
                .doctorVisitBn("সপ্তাহে ২ বারের বেশি রিলিভার ইনহেলার লাগলে বা রাতে কাশির জন্য ঘুম ভেঙে গেলে চিকিৎসকের সাথে পরামর্শ করে ওষুধের মাত্রা সমন্বয় করান।")
                .emergencyEn("Call for IMMEDIATE emergency medical transport if the patient cannot speak full sentences due to breathlessness, lips or fingernails turn blue/gray (Cyanosis), chest and ribs pull inward severely, or rescue inhaler provides no relief.")
                .emergencyBn("ইনহেলার নেওয়ার পরও শ্বাসকষ্ট না কমলে, কথা বলতে কষ্ট হলে বা ঠোঁট ও নখ নীলচে হয়ে গেলে কালবিলম্ব না করে দ্রুত নিকটস্থ হাসপাতালের জরুরি বিভাগে যান।")
                .durationEn("Chronic (Long-term condition that can be well-controlled)")
                .durationBn("দীর্ঘস্থায়ী (সঠিক চিকিৎসায় সম্পূর্ণ স্বাভাবিক ও কর্মক্ষম জীবনযাপন সম্ভব)")
                .isPopular(true)
                .viewCount(1150)
                .status("PUBLISHED")
                .sourceName("Global Initiative for Asthma (GINA) & WHO")
                .sourceUrl("https://ginasthma.org/")
                .referenceNote("Aligned with GINA 2026 Global Strategy for Asthma Management.")
                .lastReviewedAt(LocalDate.of(2026, 9, 2))
                .build();

        addSymptoms(asthma, List.of(
                new String[]{"Wheezing (high-pitched whistling sound while breathing)", "শ্বাস ছাড়ার সময় বুকে বাঁশির মতো সাঁই সাঁই শব্দ", "true"},
                new String[]{"Shortness of breath and difficulty exhaling", "শ্বাসকষ্ট ও দম আটকে আসার অনুভূতি", "true"},
                new String[]{"Chest tightness or pressure", "বুক চেপে আসা বা ভারী লাগা", "true"},
                new String[]{"Persistent cough (especially at night or early morning)", "রাতে বা ভোরে কাশি বেড়ে যাওয়া", "false"},
                new String[]{"Rapid breathing and fatigue", "দ্রুত শ্বাস নেওয়া ও সহজে ক্লান্ত হয়ে পড়া", "false"}
        ));

        addCauses(asthma, List.of(
                new String[]{"Genetic predisposition to atopy and allergic sensitization", "বংশগত অ্যালার্জিপ্রবণতা"},
                new String[]{"Inhalation of environmental allergens (house dust mites, pollens, pet dander)", "ধুলাবালি, ফুলের রেণু ও পোষা প্রাণীর লোম"},
                new String[]{"Respiratory viral infections in early childhood", "শৈশবে ঘনঘন ফুসফুসের ভাইরাস সংক্রমণ"},
                new String[]{"Exposure to tobacco smoke, industrial fumes, and air pollution", "ধূমপান, কলকারখানার ধোঁয়া ও বায়ুদূষণ"}
        ));

        addRiskFactors(asthma, List.of(
                new String[]{"Family history of asthma or eczema/allergic rhinitis", "পরিবারে হাঁপানি, একজিমা বা অ্যালার্জির ইতিহাস"},
                new String[]{"Active or passive exposure to cigarette smoke", "পরোক্ষ বা প্রত্যক্ষ ধূমপানের ধোঁয়া"},
                new String[]{"Workplace exposure to chemicals, dust, or flour", "কর্মক্ষেত্রের রাসায়নিক ধোঁয়া বা ধুলা"},
                new String[]{"Obesity and urban living conditions", "অতিরিক্ত শারীরিক ওজন ও শহরের দূষিত পরিবেশ"}
        ));

        addMedicines(asthma, List.of(
                new String[]{"Inhaled Corticosteroids (e.g. Budesonide, Fluticasone)", "ইনহেলড কর্টিকোস্টেরয়েড (বুডেসোনাইড)", "Inhaled Anti-inflammatory", "প্রদাহনাশক ইনহেলার", "Main controller medication that reduces airway swelling and mucus production.", "শ্বাসনালীর ভেতরের প্রদাহ ও ফোলা কমায়। প্রতিদিন নিয়মিত নিতে হয়।"},
                new String[]{"Short-Acting Beta Agonists (e.g. Salbutamol)", "সালবিউটামল ইনহেলার", "Bronchodilator", "শ্বাসকষ্টের দ্রুত উপশমকারী", "Quick-relief bronchodilator that opens narrowed airways within minutes during an attack.", "তীব্র শ্বাসকষ্টের সময় দ্রুত শ্বাসনালী প্রসারিত করে আরাম দেয়।"},
                new String[]{"Long-Acting Beta Agonists (e.g. Formoterol, Salmeterol)", "লং-অ্যাক্টিং ব্রঙ্কোডাইলেটর (ফরমেটেরল)", "LABA", "দীর্ঘমেয়াদী প্রসারণকারী", "Provides sustained airway opening up to 12-24 hours when combined with steroids.", "শ্বাসনালীকে দীর্ঘক্ষণ খোলা রাখতে সাহায্য করে।"},
                new String[]{"Leukotriene Receptor Antagonists (e.g. Montelukast)", "মন্টেলুকাস্ট ট্যাবলেট", "Leukotriene Blocker", "অ্যালার্জি প্রতিরোধক", "Oral medication that blocks inflammatory leukotrienes.", "অ্যালার্জি ও শ্বাসনালীর সংকোচন রোধে মুখে খাওয়ার ওষুধ।"}
        ));

        addWarningSigns(asthma, List.of(
                new String[]{"Inability to speak in full sentences or struggling to breathe", "শ্বাসকষ্টে একটানা পুরো বাক্য বলতে না পারা", "true"},
                new String[]{"Bluish discoloration of lips, face, or fingernails (Cyanosis)", "ঠোঁট, মুখ বা নখের কোণা নীলচে হয়ে যাওয়া", "true"},
                new String[]{"Chest wall retractions (skin sucking in between ribs)", "শ্বাস নেওয়ার সময় বুকের খাঁচা অতিরিক্ত দেবে যাওয়া", "true"},
                new String[]{"Peak flow meter reading in the red zone (< 50% personal best)", "পিক ফ্লো মিটারের রিডিং লাল দাগে নেমে আসা", "true"},
                new String[]{"No improvement 15 minutes after taking rescue inhaler", "রিলিভার ইনহেলার নেওয়ার পরও শ্বাসকষ্টের উন্নতি না হওয়া", "true"}
        ));
        diseases.add(asthma);

        // --- DENGUE FEVER ---
        Disease dengue = Disease.builder()
                .nameEn("Dengue Fever")
                .nameBn("ডেঙ্গু জ্বর")
                .slug("dengue-fever")
                .category(catInf)
                .subcategoryEn("Arboviral Vector-Borne Infection")
                .subcategoryBn("মশাবাহিত ভাইরাস সংক্রমণ")
                .alternativeNamesEn("Breakbone Fever, Dengue Viral Infection, DENV")
                .alternativeNamesBn("ডেঙ্গু, ডেঙ্গু ভাইরাস জ্বর, ব্রেকবোন ফিভার")
                .overviewEn("Dengue is a mosquito-borne viral infection caused by the dengue virus (DENV, serotypes 1-4) transmitted through the bite of infected female Aedes mosquitoes (primarily Aedes aegypti). Symptoms typically appear 4-10 days after infection and include high fever, intense body aches, retro-orbital pain, and rash.")
                .overviewBn("ডেঙ্গু হলো এডিস মশার কামড়ে সংক্রমিত একটি ভাইরাসজনিত জ্বর। এটি হলে হঠাৎ তীব্র জ্বর (১০৩-১০৫ ডিগ্রি ফাঃ), প্রচণ্ড শরীর ও জয়েন্টে ব্যথা, চোখের পেছনে ব্যথা, বমি ভাব ও শরীরে লালচে র‍্যাশ দেখা দেয়। সঠিক সময়ে চিকিৎসা না নিলে রক্তের প্লাটিলেট কমে মারাত্মক জটিলতা হতে পারে।")
                .diagnosisEn("Laboratory testing includes Dengue NS1 Antigen test (within days 1-4 of fever), Dengue IgM/IgG antibodies (after day 5), Complete Blood Count (CBC) to monitor Hematocrit (HCT) and Platelet count daily.")
                .diagnosisBn("জ্বরের প্রথম ১-৪ দিনের মধ্যে ডেঙ্গু এনএস১ (NS1) অ্যান্টিজেন পরীক্ষা এবং ৫ দিন পর থেকে ডেঙ্গু অ্যান্টিবডি (IgM/IgG) ও রক্তের সিবিসি (CBC) করে প্লাটিলেট ও হেমাটোক্রিট নিয়মিত পর্যবেক্ষণ করা হয়।")
                .treatmentOverviewEn("There is no specific antiviral medication for dengue. Management is supportive: adequate oral hydration (ORS, fluids, coconut water), rest, and fever control using Paracetamol only. NSAIDs (Aspirin, Ibuprofen) are STRICTLY CONTRAINDICATED due to bleeding risk.")
                .treatmentOverviewBn("ডেঙ্গুর কোনো নির্দিষ্ট অ্যান্টিভাইরাল ওষুধ নেই। পর্যাপ্ত তরল খাবার (স্যালাইন, ডাবের পানি, স্যুপ), পূর্ণ বিশ্রাম এবং জ্বর নিয়ন্ত্রণে শুধুমাত্র প্যারাসিটামল সেবন করা হয়। অ্যাসপিরিন বা অন্য কোনো ব্যথানাশক ওষুধ সম্পূর্ণ নিষিদ্ধ কারণ এতে রক্তক্ষরণ হতে পারে।")
                .homeCareEn("Drink 2.5 to 3 liters of fluid daily (ORS, fruit juice, soup), bed rest, sponge with normal water during high fever, and monitor urine output (should urinate every 4-6 hours).")
                .homeCareBn("প্রতিদিন পর্যাপ্ত খাবার স্যালাইন, ডাবের পানি ও তরল খাবার খান। হালকা ভেজা কাপড় দিয়ে শরীর মুছিয়ে দিন এবং পর্যাপ্ত প্রস্রাব হচ্ছে কিনা খেয়াল রাখুন।")
                .dietLifestyleEn("Consume easily digestible soft foods, high-protein broth, vitamin C-rich fruits (oranges, pomegranates). Avoid red/brown foods or drinks that could mimic blood in vomit or stool.")
                .dietLifestyleBn("সহজে হজম হয় এমন নরম খাবার, পেঁপে, বেদানা, ডাল ও লেবুর শরবত খান। কালো বা লাল রঙের খাবার এড়িয়ে চলুন যাতে বমি বা মলে রক্ত বোঝা যায়।")
                .preventionEn("Eliminate stagnant clean water containers (flower pots, tires, rooftop trays) where Aedes mosquitoes breed, use mosquito nets (even during daytime naps), and apply insect repellent.")
                .preventionBn("বাড়ির আশপাশে ও টবে জমে থাকা পরিষ্কার পানি ৩ দিনের মধ্যে ফেলে দিন, দিনে ও রাতে ঘুমানোর সময় মশারি ব্যবহার করুন এবং মশারোধী লোশন লাগান।")
                .doctorVisitEn("Consult a physician immediately upon developing fever during dengue outbreaks for diagnostic confirmation and CBC baseline monitoring.")
                .doctorVisitBn("জ্বর দেখা দিলেই দ্রুত চিকিৎসকের পরামর্শ নিয়ে রক্ত পরীক্ষা করান এবং প্লাটিলেট ও হেমাটোক্রিট পর্যবেক্ষণ করুন।")
                .emergencyEn("Rush to the HOSPITAL EMERGENCY IMMEDIATELY if any critical warning signs develop: severe abdominal pain, persistent vomiting, bleeding from gums/nose, black tarry stools, extreme restlessness, cold clammy skin, or sudden drop in platelet count with rising hematocrit.")
                .emergencyBn("তীব্র পেটে ব্যথা, ক্রমাগত বমি, মাড়ি বা নাক দিয়ে রক্ত পড়া, কালো পায়খানা, হঠাৎ দুর্বল বা নিস্তেজ হয়ে পড়া এবং হাত-পা ঠান্ডা হয়ে গেলে এক মুহূর্তও দেরি না করে রোগীকে সরাসরি হাসপাতালে ভর্তি করুন।")
                .durationEn("Acute (7 to 10 days, critical phase typically days 3 to 7)")
                .durationBn("তীব্র স্বল্পমেয়াদী (সাধারণত ৭ থেকে ১০ দিন, ৩-৭ দিন সংকটকাল)")
                .isPopular(true)
                .viewCount(1580)
                .status("PUBLISHED")
                .sourceName("World Health Organization (WHO) & Directorate General of Health Services (DGHS) Bangladesh")
                .sourceUrl("https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue")
                .referenceNote("Prepared according to National Dengue Clinical Management Guidelines (DGHS Bangladesh).")
                .lastReviewedAt(LocalDate.of(2026, 9, 10))
                .build();

        addSymptoms(dengue, List.of(
                new String[]{"Sudden onset high fever (104°F / 40°C)", "হঠাৎ তীব্র জ্বর (১০৩-১০৫ ডিগ্রি ফাঃ)", "true"},
                new String[]{"Severe headache and retro-orbital pain (behind the eyes)", "তীব্র মাথাব্যথা ও চোখের পেছনে ব্যথা", "true"},
                new String[]{"Severe muscle, joint, and bone aches (Breakbone ache)", "হাত-পা ও জয়েন্টে প্রচণ্ড ব্যথা", "true"},
                new String[]{"Nausea, vomiting, and loss of appetite", "বমি বমি ভাব, বমি ও খাবারে অরুচি", "false"},
                new String[]{"Flushed skin rash appearing 2-5 days after fever", "জ্বরের ২-৫ দিন পর গায়ে লালচে অ্যালার্জির মতো র‍্যাশ", "false"},
                new String[]{"Mild mucosal bleeding (gums, nose)", "দাঁতের মাড়ি বা নাক দিয়ে সামান্য রক্তক্ষরণ", "false"}
        ));

        addCauses(dengue, List.of(
                new String[]{"Dengue Virus (Flaviviridae family, serotypes DENV-1, DENV-2, DENV-3, DENV-4)", "ডেঙ্গু ভাইরাস (১, ২, ৩ ও ৪ নম্বর সেরোটাইপ)"},
                new String[]{"Transmission via bite of infected female Aedes aegypti or Aedes albopictus mosquito", "সংক্রমিত এডিস মশার দংশন"}
        ));

        addRiskFactors(dengue, List.of(
                new String[]{"Living in or traveling to tropical and subtropical urban areas", "গ্রীষ্মমন্ডলীয় ও ঘনবসতিপূর্ণ শহরে বসবাস"},
                new String[]{"Presence of stagnant clean water containers near residence", "বাসাবাড়ির আশেপাশে জমে থাকা পরিষ্কার পানি"},
                new String[]{"Previous infection with a different dengue serotype (increases risk of severe dengue)", "পূর্বে অন্য সেরোটাইপের ডেঙ্গুতে আক্রান্ত হওয়া (মারাত্মক ডেঙ্গুর ঝুঁকি বাড়ায়)"},
                new String[]{"Monsoon and post-monsoon rainy season", "বর্ষাকাল ও বর্ষা পরবর্তী স্যাঁতসেঁতে আবহাওয়া"}
        ));

        addMedicines(dengue, List.of(
                new String[]{"Paracetamol / Acetaminophen", "প্যারাসিটামল", "Antipyretic / Analgesic", "জ্বর ও ব্যথানাশক", "Used strictly for fever and pain control. Max adult dose: 500-1000mg every 6 hours (max 3-4g/day).", "শুধুমাত্র জ্বর ও শরীর ব্যথার জন্য চিকিৎসকের পরামর্শে নির্দিষ্ট মাত্রায় সেবন করতে হবে।"},
                new String[]{"Oral Rehydration Salts (ORS)", "খাবার স্যালাইন (ওআরএস)", "Electrolyte Replacement", "ইলেক্ট্রোলাইট প্রতিস্থাপন", "Essential fluid and electrolyte replenishment to prevent plasma leakage and shock.", "রক্তের তরল পদার্থের ভারসাম্য বজায় রাখতে এবং শকে যাওয়া প্রতিরোধে সবচেয়ে গুরুত্বপূর্ণ।"},
                new String[]{"DO NOT TAKE NSAIDs (Aspirin, Ibuprofen, Diclofenac, Naproxen)", "অ্যাসপিরিন ও আইবুপ্রোফেন বর্জনীয়", "Contraindicated NSAIDs", "নিষিদ্ধ ব্যথানাশক", "STRICTLY PROHIBITED: NSAIDs worsen platelet dysfunction and increase severe gastrointestinal bleeding risk.", "সম্পূর্ণ নিষিদ্ধ: এই জাতীয় ব্যথানাশক খেলে রক্তক্ষরণের মারাত্মক ঝুঁকি তৈরি হয়।"}
        ));

        addWarningSigns(dengue, List.of(
                new String[]{"Severe, continuous abdominal pain or tenderness", "পেটে তীব্র ও ক্রমাগত ব্যথা", "true"},
                new String[]{"Persistent vomiting (at least 3 times in 24 hours)", "বারবার বমি হওয়া (দিনে ৩ বারের বেশি)", "true"},
                new String[]{"Active mucosal bleeding (from gums, nose, vomit, or stool)", "দাঁতের মাড়ি, নাক বা মলের সাথে রক্ত যাওয়া", "true"},
                new String[]{"Extreme lethargy, confusion, restlessness, or difficulty waking", "অতিরিক্ত নিস্তেজ ভাব, অস্থিরতা বা বিভ্রান্তি", "true"},
                new String[]{"Cold, clammy, pale skin and rapid weak pulse (Dengue Shock)", "হাত-পা বরফের মতো ঠান্ডা হয়ে যাওয়া ও নাড়ির গতি দুর্বল হওয়া", "true"},
                new String[]{"Sudden drop in platelet count (< 50,000/mcL) with rising hematocrit", "প্লাটিলেট দ্রুত কমে যাওয়া এবং হেমাটোক্রিট ২০% এর বেশি বেড়ে যাওয়া", "true"}
        ));
        diseases.add(dengue);

        // --- GERD & GASTRITIS ---
        Disease gerd = Disease.builder()
                .nameEn("Gastroesophageal Reflux Disease (GERD) & Gastritis")
                .nameBn("গ্যাস্ট্রাইটিস ও এসিডিটি (গ্যাস্ট্রিক সমস্যা)")
                .slug("gerd-gastritis-acidity")
                .category(catDigest)
                .subcategoryEn("Upper Gastrointestinal Acid Disorder")
                .subcategoryBn("পাকস্থলী ও খাদ্যনালীর অম্লরোগ")
                .alternativeNamesEn("Acid Reflux, Heartburn, Gastric, Dyspepsia, Peptic Ulcer")
                .alternativeNamesBn("গ্যাস্ট্রিক, এসিডিটি, বুক জ্বালাপোড়া, পেপটিক আলসার")
                .overviewEn("GERD occurs when stomach acid frequently flows back into the tube connecting your mouth and stomach (esophagus), causing acid irritation. Gastritis is inflammation of the stomach lining. Both conditions are extremely common and cause heartburn, indigestion, and upper abdominal burning.")
                .overviewBn("গ্যাস্ট্রিক বা এসিডিটি হলো পাকস্থলীর অতিরিক্ত অম্ল বা অ্যাসিড খাদ্যনালীতে উঠে আসা বা পাকস্থলীর ভেতরের আবরণে প্রদাহ সৃষ্টি হওয়া। এতে বুক ও পেট জ্বালাপোড়া, টক ঢেকুর, বমি ভাব ও পেট ফাঁপা দেখা দেয়। অনিয়মিত খাওয়া ও অতিরিক্ত ভাজাপোড়া এর প্রধান কারণ।")
                .diagnosisEn("Diagnosed clinically based on typical symptoms. For persistent or warning symptoms, Upper GI Endoscopy, H. pylori stool antigen/breath test, and esophageal pH monitoring are utilized.")
                .diagnosisBn("সাধারণত উপসর্গের ভিত্তিতে নির্ণয় করা হয়। দীর্ঘমেয়াদী ক্ষেত্রে এন্ডোস্কোপি (Endoscopy) ও এইচ পাইলোরি (H. pylori) ব্যাকটেরিয়া পরীক্ষা করা হয়।")
                .treatmentOverviewEn("Treatment centers on dietary and lifestyle modification, short-term acid suppressants (Proton Pump Inhibitors or H2 blockers), antacids for quick relief, and treating H. pylori infection if present.")
                .treatmentOverviewBn("খাবারের নিয়ম মানা, তেল-চর্বিযুক্ত খাবার কমানো, চিকিৎসকের পরামর্শ অনুযায়ী নির্দিষ্ট মেয়াদে অ্যান্টাসিড বা পিপিআই (PPI) ওষুধ সেবন এবং প্রয়োজনে এইচ পাইলোরি নিরাময় করা।")
                .homeCareEn("Eat smaller, more frequent meals. Avoid lying down for at least 2-3 hours after eating. Elevate the head of your bed by 6-8 inches if night reflux occurs.")
                .homeCareBn("একবারে অতিরিক্ত না খেয়ে অল্প অল্প করে বারবার খান। খাওয়ার পরপরই শুয়ে পড়বেন না (অন্তত ২ ঘণ্টা পর ঘুমান) এবং ঘুমানোর সময় মাথা উঁচু রাখুন।")
                .dietLifestyleEn("Avoid trigger foods: deep-fried oily items, spicy chilies, coffee, carbonated sodas, chocolates, and citrus. Stop smoking and maintain healthy body weight.")
                .dietLifestyleBn("অতিরিক্ত তেল-ঝাল ও মসলাযুক্ত খাবার, ডুবো তেলে ভাজা, চা-কফি, কোল্ড ড্রিংকস বর্জন করুন। ধূমপান পরিহার করুন।")
                .preventionEn("Maintain regular meal timings without long gaps, manage stress, avoid late-night heavy meals, and maintain a balanced healthy weight.")
                .preventionBn("নির্দিষ্ট সময়ে খাবার খাওয়ার অভ্যাস করুন, দীর্ঘক্ষণ না খেয়ে থাকবেন না এবং রাতের খাবার ঘুমানোর অন্তত দুই ঘণ্টা আগে শেষ করুন।")
                .doctorVisitEn("Consult a doctor if symptoms occur more than twice a week, fail to respond to standard medications, or if you have difficulty swallowing.")
                .doctorVisitBn("সপ্তাহে দুই দিনের বেশি সমস্যা হলে, ওষুধ খেয়েও উপশম না হলে বা খাবার গিলতে কষ্ট হলে গ্যাস্ট্রোএন্টারোলজিস্টকে দেখান।")
                .emergencyEn("Seek IMMEDIATE emergency medical care if you vomit blood, have coffee-ground emesis, black tarry stools (Melena), or experience chest pain with sweating radiating to your arm (to rule out myocardial infarction).")
                .emergencyBn("রক্তবমি হলে, মলের রঙ আলকাতরার মতো কালো হলে বা বুকে তীব্র ব্যথার সাথে ঘাম হলে দ্রুত জরুরি হাসপাতালে যান কারণ এটি হার্ট অ্যাটাক বা আলসার থেকে রক্তক্ষরণ হতে পারে।")
                .durationEn("Recurrent / Chronic (Easily managed with dietary discipline)")
                .durationBn("পুনরাবৃত্তিমূলক / দীর্ঘস্থায়ী (খাদ্যাভ্যাস পরিবর্তনের মাধ্যমে সহজেই নিয়ন্ত্রণে রাখা সম্ভব)")
                .isPopular(true)
                .viewCount(1350)
                .status("PUBLISHED")
                .sourceName("American College of Gastroenterology (ACG) & WHO")
                .sourceUrl("https://gi.org/topics/acid-reflux/")
                .referenceNote("Reviewed according to ACG Clinical Guidelines on GERD Management.")
                .lastReviewedAt(LocalDate.of(2026, 9, 3))
                .build();

        addSymptoms(gerd, List.of(
                new String[]{"Heartburn (burning sensation in chest and throat)", "বুকে বা গলার কাছে জ্বালাপোড়া করা", "true"},
                new String[]{"Acid regurgitation and sour belching", "মুখে টক বা তেতো পানি উঠে আসা ও টক ঢেকুর", "true"},
                new String[]{"Upper abdominal pain, burning, or fullness", "পেটের ওপরের অংশে জ্বালাপোড়া বা কামড়ানো ব্যথা", "true"},
                new String[]{"Bloating, nausea, and early satiety", "পেট ফাঁপা, বমি বমি ভাব ও অল্পতেই পেট ভরা লাগা", "false"},
                new String[]{"Chronic dry cough or hoarseness of voice in morning", "সকালে গলা ভাঙা বা দীর্ঘদিনের শুকনো কাশি", "false"}
        ));

        addCauses(gerd, List.of(
                new String[]{"Weak lower esophageal sphincter (LES) tone", "খাদ্যনালীর নিচের ভালভ দুর্বল হওয়া"},
                new String[]{"Helicobacter pylori (H. pylori) bacterial infection of stomach", "এইচ পাইলোরি ব্যাকটেরিয়ার সংক্রমণ"},
                new String[]{"Frequent use of NSAID painkillers without gastroprotection", "গ্যাস্ট্রিকের ওষুধ ছাড়া অতিরিক্ত ব্যথানাশক সেবন"},
                new String[]{"Hiatal hernia, delayed gastric emptying, and obesity", "হায়াটাস হার্নিয়া ও অতিরিক্ত মেদ"}
        ));

        addRiskFactors(gerd, List.of(
                new String[]{"Irregular eating habits and skipping meals", "অনিয়মিত খাবার খাওয়া ও দীর্ঘক্ষণ খালি পেটে থাকা"},
                new String[]{"Excess consumption of fried, spicy, and fatty foods", "অতিরিক্ত ভাজাপোড়া, তৈলাক্ত ও মসলাযুক্ত খাবার খাওয়া"},
                new String[]{"Lying down immediately after eating", "খাওয়ার সাথে সাথেই শুয়ে পড়া"},
                new String[]{"Smoking, alcohol, and excessive caffeine", "ধূমপান, অ্যালকোহল ও অতিরিক্ত চা-কফি পান"},
                new String[]{"Pregnancy and obesity increasing intra-abdominal pressure", "গর্ভাবস্থা ও শারীরিক স্থূলতা"}
        ));

        addMedicines(gerd, List.of(
                new String[]{"Proton Pump Inhibitors (e.g. Omeprazole, Esomeprazole)", "প্রোটন পাম্প ইনহিবিটর (ওমেপ্রাজল, ইসোমেপ্রাজল)", "PPI (Acid Suppressant)", "অ্যাসিড দমনকারী", "Potently suppress gastric acid production for 24 hours. Taken 30-60 mins before breakfast.", "পাকস্থলীতে অ্যাসিড তৈরি কার্যকরভাবে কমায়। সকালে খাবারের ৩০-৬০ মিনিট আগে সেব্য।"},
                new String[]{"H2 Receptor Antagonists (e.g. Famotidine)", "এইচ২ ব্লকার (ফ্যামোটিডিন)", "H2 Blocker", "অ্যাসিড নিয়ন্ত্রণকারী", "Reduces baseline and nocturnal acid secretion.", "বিশেষ করে রাতের বেলার অ্যাসিড তৈরি কমাতে সাহায্য করে।"},
                new String[]{"Antacids (e.g. Aluminum / Magnesium Hydroxide, Magaldrate)", "অ্যান্টাসিড সিরাপ / ট্যাবলেট", "Acid Neutralizer", "অ্যাসিড প্রশমনকারী", "Directly neutralizes stomach acid for rapid symptom relief.", "পেটের বাড়তি অ্যাসিডকে তাৎক্ষণিকভাবে নিরপেক্ষ করে দ্রুত আরাম দেয়।"},
                new String[]{"Prokinetics (e.g. Domperidone)", "ডম্পেরিডন", "Prokinetic Agent", "বমিভাব ও পেট খালি করার ওষুধ", "Accelerates stomach emptying and reduces nausea/bloating.", "খাবার দ্রুত হজমে ও বমি ভাব কমাতে সাহায্য করে।"}
        ));

        addWarningSigns(gerd, List.of(
                new String[]{"Vomiting blood or coffee-ground material", "রক্তবমি হওয়া বা কফির মতো রঙের বমি", "true"},
                new String[]{"Black, sticky, tarry stools (Melena)", "আলকাতরার মতো দুর্গন্ধযুক্ত কালো পায়খানা", "true"},
                new String[]{"Progressive difficulty or pain when swallowing (Dysphagia)", "খাবার গিলতে কষ্ট হওয়া বা গলায় আটকে যাওয়ার অনুভূতি", "true"},
                new String[]{"Unexplained significant weight loss and anemia", "অস্বাভাবিক ওজন কমে যাওয়া ও রক্তশূন্যতা", "false"},
                new String[]{"Severe crushing chest pain radiating to left arm/back", "বুকে প্রচণ্ড চাপ বা ব্যথা যা বাম বাহুতে ছড়ায় (হার্ট অ্যাটাকের লক্ষণ)", "true"}
        ));
        diseases.add(gerd);

        // --- PNEUMONIA ---
        Disease pneumonia = Disease.builder()
                .nameEn("Pneumonia")
                .nameBn("নিউমোনিয়া")
                .slug("pneumonia")
                .category(catResp)
                .subcategoryEn("Lower Respiratory Infection")
                .subcategoryBn("ফুসফুসের তীব্র সংক্রমণ")
                .alternativeNamesEn("Lung Infection, Bronchopneumonia, Lobar Pneumonia")
                .alternativeNamesBn("নিউমোনিয়া, ফুসফুসের সংক্রমণ")
                .overviewEn("Pneumonia is an acute infection of one or both lungs that causes the air sacs (alveoli) to fill with pus and fluid. It can range in severity from mild to life-threatening, particularly in infants, elderly individuals, and immunocompromised patients.")
                .overviewBn("নিউমোনিয়া হলো ফুসফুসের একটি তীব্র সংক্রমণ যেখানে ফুসফুসের বায়ুথলিগুলো পুঁজ ও তরলে পূর্ণ হয়ে যায়। এতে প্রচণ্ড জ্বর, কাশির সাথে কফ, বুকে ব্যথা এবং শ্বাস নিতে কষ্ট হয়। শিশু ও বয়োবৃদ্ধদের ক্ষেত্রে এটি অত্যন্ত বিপজ্জনক হতে পারে।")
                .diagnosisEn("Diagnosed through clinical examination (crackles on auscultation), Chest X-Ray (demonstrating consolidation or infiltrate), Complete Blood Count (elevated WBC and CRP), and Pulse Oximetry.")
                .diagnosisBn("ডাক্তার স্টেথোস্কোপ দিয়ে ফুসফুস পরীক্ষা করে এবং বুকের এক্স-রে (Chest X-Ray) ও রক্তের সিবিসি (WBC, CRP) করে এটি নিশ্চিত করেন।")
                .treatmentOverviewEn("Bacterial pneumonia requires physician-prescribed antibiotics. Viral pneumonia is treated with supportive care. Oxygen therapy and hospital admission are needed for severe cases.")
                .treatmentOverviewBn("ব্যাকটেরিয়াজনিত নিউমোনিয়া হলে ডাক্তারের পরামর্শ অনুযায়ী অ্যান্টিবায়োটিক কোর্স সম্পূর্ণ করতে হয়। জটিল ক্ষেত্রে হাসপাতালে অক্সিজেন ও স্যালাইন প্রয়োজন হয়।")
                .homeCareEn("Strict bed rest, drinking plenty of warm fluids, steam inhalation, and finishing the full course of prescribed antibiotics even if feeling better.")
                .homeCareBn("পর্যাপ্ত বিশ্রাম, কুসুম গরম পানি ও স্যুপ পান, গরম পানির ভাপ নেওয়া এবং সুস্থ মনে হলেও অ্যান্টিবায়োটিকের পূর্ণ কোর্স শেষ করা।")
                .dietLifestyleEn("Consume nutrient-dense warm broths, ginger tea, vitamin-rich fruits, and easily digestible proteins to support immune recovery.")
                .dietLifestyleBn("উষ্ণ স্যুপ, আদা চা, ডিম, ডাল ও পুষ্টিকর খাবার গ্রহণ করুন। ধূমপান থেকে সম্পূর্ণ দূরে থাকুন।")
                .preventionEn("Pneumococcal and influenza vaccination, regular handwashing, avoiding indoor smoke/biomass fuel exposure, and exclusive breastfeeding for infants.")
                .preventionBn("শিশুদের এবং বয়স্কদের নিউমোকক্কাল ও ফ্লু ভ্যাকসিন দেওয়া, হাত ধোয়ার অভ্যাস এবং ঘরের ভেতরের ধোঁয়া এড়িয়ে চলা।")
                .doctorVisitEn("Seek medical evaluation immediately if you experience high fever, productive cough, sharp chest pain on deep breathing, or persistent chills.")
                .doctorVisitBn("জ্বরের সাথে কফ, বুকে ব্যথা বা শ্বাসকষ্ট দেখা দিলে দ্রুত চিকিৎসকের শরণাপন্ন হন।")
                .emergencyEn("Seek IMMEDIATE emergency medical care if oxygen saturation drops below 92%, lips or fingers turn blue, severe breathlessness develops, or confusion/lethargy occurs.")
                .emergencyBn("অক্সিজেন মাত্রা ৯২% এর নিচে নেমে গেলে, ঠোঁট নীল হলে, শ্বাস নেওয়ার জন্য অতিরিক্ত কষ্ট হলে বা রোগী নিস্তেজ হয়ে পড়লে দ্রুত জরুরি বিভাগে নিন।")
                .durationEn("Acute (2 to 4 weeks with appropriate treatment)")
                .durationBn("স্বল্পমেয়াদী (সঠিক চিকিৎসায় ২ থেকে ৪ সপ্তাহে নিরাময় হয়)")
                .isPopular(false)
                .viewCount(890)
                .status("PUBLISHED")
                .sourceName("World Health Organization (WHO) & British Thoracic Society")
                .sourceUrl("https://www.who.int/news-room/fact-sheets/detail/pneumonia")
                .referenceNote("Reviewed according to BTS Community Acquired Pneumonia Guidelines.")
                .lastReviewedAt(LocalDate.of(2026, 8, 20))
                .build();

        addSymptoms(pneumonia, List.of(
                new String[]{"High fever with shaking chills and sweating", "কাঁপুনি দিয়ে তীব্র জ্বর ও শরীর ঘামা", "true"},
                new String[]{"Cough producing thick green, yellow, or rust-colored phlegm", "কাশি ও কাশির সাথে হলুদ/সবুজ বা বাদামী কফ", "true"},
                new String[]{"Sharp chest pain that worsens when breathing deeply or coughing", "গভীর শ্বাস নিলে বা কাশলে বুকে তীব্র সুই ফোটার মতো ব্যথা", "true"},
                new String[]{"Shortness of breath and rapid shallow breathing", "শ্বাসকষ্ট ও দ্রুত ছোট ছোট শ্বাস নেওয়া", "true"},
                new String[]{"Extreme fatigue, body ache, and loss of appetite", "চরম ক্লান্তি, শরীর ব্যথা ও খাবারে অরুচি", "false"}
        ));
        diseases.add(pneumonia);

        // --- STROKE ---
        Disease stroke = Disease.builder()
                .nameEn("Stroke (Cerebrovascular Accident)")
                .nameBn("স্ট্রোক (মস্তিষ্কে রক্তক্ষরণ বা রক্তপ্রবাহে বাধা)")
                .slug("stroke-cerebrovascular-accident")
                .category(catEmerg)
                .subcategoryEn("Acute Neurological Emergency")
                .subcategoryBn("মস্তিষ্কের জরুরি রক্তনালী ব্যাধি")
                .alternativeNamesEn("Cerebrovascular Accident (CVA), Brain Attack, Ischemic Stroke, Hemorrhagic Stroke")
                .alternativeNamesBn("স্ট্রোক, ব্রেইন স্ট্রোক, মস্তিষ্কে রক্তক্ষরণ, প্যারালাইসিস")
                .overviewEn("A stroke occurs when blood supply to part of the brain is interrupted or reduced (Ischemic Stroke) or when a blood vessel in the brain bursts (Hemorrhagic Stroke), preventing brain tissue from getting oxygen and nutrients. Brain cells begin to die within minutes. TIME IS BRAIN.")
                .overviewBn("স্ট্রোক হলো মস্তিষ্কের রক্তনালী হঠাৎ বন্ধ হয়ে যাওয়া (ইস্কেমিক স্ট্রোক) বা ফেটে গিয়ে রক্তক্ষরণ হওয়া (হেমোরেজিক স্ট্রোক)। এর ফলে মস্তিষ্কের কোষগুলো অক্সিজেন না পেয়ে দ্রুত নষ্ট হতে শুরু করে। স্ট্রোক হলে প্রতিটি সেকেন্ড অত্যন্ত মূল্যবান—তাৎক্ষণিক হাসপাতালে নেওয়া জীবন রক্ষাকারী।")
                .diagnosisEn("Urgent Non-Contrast CT scan of the Brain or Brain MRI, CT Angiography, blood glucose testing, and ECG to determine whether stroke is ischemic or hemorrhagic.")
                .diagnosisBn("জরুরি ভিত্তিতে মস্তিষ্কের সিটি স্ক্যান (Brain CT Scan) বা এমআরআই (MRI) করে স্ট্রোকের ধরন নির্ণয় করা হয়।")
                .treatmentOverviewEn("Ischemic stroke requires urgent thrombolytic therapy (tPA within 4.5 hours of onset) or mechanical thrombectomy. Hemorrhagic stroke requires surgical intervention or hematoma management.")
                .treatmentOverviewBn("স্ট্রোকের প্রথম ৪.৫ ঘণ্টার মধ্যে হাসপাতালে পৌঁছালে রক্তনালীর জমাট বাঁধা রক্ত গলিয়ে দেওয়ার বিশেষ ইনজেকশন দেওয়া যায়। রক্তক্ষরণজনিত স্ট্রোকে বিশেষায়িত আইসিইউ চিকিৎসা প্রয়োজন।")
                .homeCareEn("Post-acute rehabilitation with physiotherapy, speech therapy, occupational therapy, strict blood pressure and glucose monitoring.")
                .homeCareBn("স্ট্রোক পরবর্তী নিয়মিত ফিজিওথেরাপি, স্পিচ থেরাপি, রক্তচাপ ও সুগার কঠোরভাবে নিয়ন্ত্রণে রাখা এবং চিকিৎসকের ওষুধ নিয়মিত চালিয়ে যাওয়া।")
                .dietLifestyleEn("Low-sodium, low-saturated fat Mediterranean-style diet, absolute cessation of smoking, and daily rehabilitation exercises.")
                .dietLifestyleBn("কম লবণযুক্ত খাবার, চর্বিহীন সুষম খাদ্য গ্রহণ, ধূমপান বর্জন এবং নিয়মিত ফিজিওথেরাপি অনুশীলন করা।")
                .preventionEn("Control hypertension, manage diabetes, treat high cholesterol, manage atrial fibrillation, avoid tobacco, and maintain an active lifestyle.")
                .preventionBn("উচ্চ রক্তচাপ ও ডায়াবেটিস কঠোর নিয়ন্ত্রণে রাখা, কোলেস্টেরল কমানো, নিয়মিত হাঁটা ও ধূমপান মুক্ত থাকা।")
                .doctorVisitEn("Regular follow-ups with a neurologist and primary care physician every 1-3 months following discharge.")
                .doctorVisitBn("হাসপাতাল থেকে বাড়ি ফেরার পর নিয়মিত নিউরোলজিস্টের পরামর্শ নিন ও ওষুধ পুনর্বিবেচনা করান।")
                .emergencyEn("ACT F.A.S.T. and call for IMMEDIATE EMERGENCY AMBULANCE: Face drooping, Arm weakness, Speech difficulty, Time to call emergency hospital.")
                .emergencyBn("FAST লক্ষণ মনে রাখুন: F (মুখের একপাশ বেকে যাওয়া), A (এক হাত বা পা দুর্বল/অবশ হওয়া), S (কথা জড়িয়ে যাওয়া), T (তাৎক্ষণিক জরুরি হাসপাতালে নিয়ে যাওয়া)।")
                .durationEn("Emergency Acute Onset (Lifelong rehabilitation for recovery)")
                .durationBn("জরুরি তীব্র অবস্থা (পুনরুদ্ধারের জন্য দীর্ঘমেয়াদী পুনর্বাসন প্রয়োজন)")
                .isPopular(true)
                .viewCount(1650)
                .status("PUBLISHED")
                .sourceName("World Stroke Organization (WSO) & American Heart Association (AHA/ASA)")
                .sourceUrl("https://www.world-stroke.org/")
                .referenceNote("Reviewed per AHA/ASA 2026 Guidelines for the Early Management of Acute Ischemic Stroke.")
                .lastReviewedAt(LocalDate.of(2026, 9, 8))
                .build();

        addSymptoms(stroke, List.of(
                new String[]{"Sudden numbness or weakness in face, arm, or leg (especially one side of body)", "শরীরের একপাশ (মুখ, হাত বা পা) হঠাৎ অবশ বা দুর্বল হয়ে যাওয়া", "true"},
                new String[]{"Sudden confusion, difficulty speaking or understanding speech", "কথা বলতে জড়তা বা অন্যের কথা বুঝতে না পারা", "true"},
                new String[]{"Sudden trouble seeing in one or both eyes", "হঠাৎ এক চোখে বা উভয় চোখে দেখতে সমস্যা হওয়া", "true"},
                new String[]{"Sudden severe headache with no known cause ('thunderclap headache')", "অজানা কারণে হঠাৎ তীব্র বজ্রপাতের মতো মাথাব্যথা", "true"},
                new String[]{"Sudden trouble walking, dizziness, loss of balance or coordination", "হাঁটতে সমস্যা, মাথা ঘোরা বা শরীরের ভারসাম্য হারিয়ে ফেলা", "true"}
        ));
        diseases.add(stroke);

        // --- MIGRAINE ---
        Disease migraine = Disease.builder()
                .nameEn("Migraine Headache")
                .nameBn("মাইগ্রেন (মাথাব্যথা)")
                .slug("migraine-headache")
                .category(catNeuro)
                .subcategoryEn("Neurological Headache Disorder")
                .subcategoryBn("স্নায়বিক মাথাব্যথা ব্যাধি")
                .alternativeNamesEn("Migraine, Vascular Headache, Hemicrania")
                .alternativeNamesBn("মাইগ্রেন, আধকপালে মাথাব্যথা")
                .overviewEn("Migraine is a complex neurological condition characterized by intense, throbbing headaches usually affecting one side of the head. It is frequently accompanied by nausea, vomiting, and extreme sensitivity to light, sound, and smells.")
                .overviewBn("মাইগ্রেন হলো একটি স্নায়বিক রোগ যাতে মাথার একপাশে (কখনও উভয়পাশে) তীব্র দপদপ করা ব্যথা হয়। এর সাথে বমি ভাব, আলো ও শব্দের প্রতি অসহ্য অনুভূতি দেখা দেয়। মানসিক চাপ, অনিয়মিত ঘুম বা কিছু নির্দিষ্ট খাবার এর ব্যথা বাড়িয়ে দিতে পারে।")
                .diagnosisEn("Diagnosed clinically through patient history using the International Classification of Headache Disorders (ICHD-3) criteria. Brain MRI or CT may be performed to exclude secondary causes.")
                .diagnosisBn("লক্ষণ ও ইতিহাসের ভিত্তিতে নির্ণয় করা হয়। অন্য কোনো জটিলতা না থাকলে সাধারণ টেস্টের প্রয়োজন হয় না।")
                .treatmentOverviewEn("Acute relief using triptans, NSAIDs, or antiemetics at earliest onset. Preventive therapy (beta-blockers, topiramate, CGRP antagonists) for frequent disabling episodes.")
                .treatmentOverviewBn("ব্যথা শুরুর সাথে সাথে চিকিৎসকের দেওয়া নির্দিষ্ট ব্যথানাশক বা ট্রিপটান গ্রহণ করা এবং অতিরিক্ত ঘনঘন ব্যথার ক্ষেত্রে প্রতিদিনের প্রতিরোধক ওষুধ খাওয়া।")
                .homeCareEn("Rest in a quiet, dark room with a cool compress on the forehead, practice deep breathing relaxation, and maintain a headache trigger diary.")
                .homeCareBn("ব্যথা শুরু হলে অন্ধকার ও শান্ত ঘরে বিশ্রাম নিন, কপালে ঠান্ডা পানির পট্টি দিন এবং প্রচুর পানি পান করুন।")
                .dietLifestyleEn("Maintain regular sleep schedules, avoid skipping meals, stay well hydrated, and limit trigger foods (aged cheese, chocolates, MSG, artificial sweeteners).")
                .dietLifestyleBn("প্রতিদিন একই সময়ে ঘুমান ও উঠুন, পর্যাপ্ত পানি খান এবং চকোলেট, অতিরিক্ত ক্যাফেইন বা পনির জাতীয় খাবার পরিহার করুন।")
                .preventionEn("Identify personal triggers, manage daily emotional stress through yoga or meditation, and avoid excessive screen time.")
                .preventionBn("মানসিক চাপ কমানো, নিয়মিত ব্যায়াম এবং একটানা মোবাইল বা কম্পিউটারের স্ক্রিনের দিকে তাকিয়ে না থাকা।")
                .doctorVisitEn("Consult a neurologist if headaches occur more than 4 days a month, severe pain disrupts work, or over-the-counter medicines stop working.")
                .doctorVisitBn("মাসে ৪ দিনের বেশি মাথাব্যথা হলে বা স্বাভাবিক কাজকর্মে ব্যাঘাত ঘটলে চিকিৎসকের পরামর্শ নিন।")
                .emergencyEn("Seek emergency care if headache is sudden and explosively severe ('worst headache of life'), accompanied by fever, stiff neck, confusion, seizures, or double vision.")
                .emergencyBn("হঠাৎ তীব্র অসহ্য মাথাব্যথা, সাথে ঘাড় শক্ত হয়ে যাওয়া, জ্বর, খিঁচুনি বা চোখে দুটি দেখা দিলে অবিলম্বে জরুরি বিভাগে যান।")
                .durationEn("Episodic attacks lasting 4 to 72 hours")
                .durationBn("পর্বভিত্তিক (সাধারণত ৪ থেকে ৭২ ঘণ্টা স্থায়ী হয়)")
                .isPopular(false)
                .viewCount(980)
                .status("PUBLISHED")
                .sourceName("International Headache Society & American Migraine Foundation")
                .sourceUrl("https://americanmigrainefoundation.org/")
                .referenceNote("Aligned with ICHD-3 Clinical Diagnostic Criteria.")
                .lastReviewedAt(LocalDate.of(2026, 8, 15))
                .build();

        addSymptoms(migraine, List.of(
                new String[]{"Throbbing, pulsating moderate-to-severe headache (often unilateral)", "মাথার একপাশে তীব্র দপদপানি মাথাব্যথা", "true"},
                new String[]{"Extreme sensitivity to light (Photophobia) and sound (Phonophobia)", "আলো ও শব্দ একদম সহ্য না হওয়া", "true"},
                new String[]{"Nausea and vomiting", "বমি বমি ভাব ও বমি হওয়া", "true"},
                new String[]{"Visual aura (flashing lights, zigzag patterns, blind spots) before pain", "ব্যথা শুরুর আগে চোখে আলোর ঝলকানি বা ঝাপসা দেখা (অরা)", "false"},
                new String[]{"Worsening of pain with routine physical activity (walking, stairs)", "হাঁটাহাঁটি বা পরিশ্রমে ব্যথা বেড়ে যাওয়া", "false"}
        ));
        diseases.add(migraine);

        // --- CHRONIC KIDNEY DISEASE ---
        Disease ckd = Disease.builder()
                .nameEn("Chronic Kidney Disease (CKD)")
                .nameBn("দীর্ঘস্থায়ী কিডনি রোগ (সিকেডি)")
                .slug("chronic-kidney-disease")
                .category(catKidney)
                .subcategoryEn("Renal Impairment")
                .subcategoryBn("কিডনির কার্যক্ষমতা হ্রাস")
                .alternativeNamesEn("CKD, Chronic Renal Failure, Kidney Impairment")
                .alternativeNamesBn("কিডনি রোগ, সিকেডি, কিডনি বিকল")
                .overviewEn("Chronic Kidney Disease (CKD) is a gradual loss of kidney function over months or years. The kidneys filter wastes and excess fluids from the blood. When damaged, dangerous levels of fluid, electrolytes, and wastes build up in the body.")
                .overviewBn("দীর্ঘস্থায়ী কিডনি রোগ হলো ধীরে ধীরে কিডনির রক্ত পরিশোধনের ক্ষমতা নষ্ট হয়ে যাওয়া। প্রাথমিক পর্যায়ে কোনো লক্ষণ থাকে না, তবে রোগ বাড়লে শরীর ও পায়ে পানি আসা, রক্তস্বল্পতা এবং বিষাক্ত বর্জ্য জমে বিভিন্ন অঙ্গের ক্ষতি হয়।")
                .diagnosisEn("Diagnosed by measuring estimated Glomerular Filtration Rate (eGFR), Serum Creatinine, Blood Urea Nitrogen (BUN), and Urine Albumin-to-Creatinine Ratio (UACR). Renal ultrasound evaluates kidney size and structure.")
                .diagnosisBn("রক্তে সিরাম ক্রিয়েটিনিন (Serum Creatinine), ইজিএফআর (eGFR) এবং প্রস্রাবে অ্যালবুমিন (Urine Microalbumin) পরীক্ষার মাধ্যমে কিডনির অবস্থা নির্ণয় করা হয়।")
                .treatmentOverviewEn("Treatment aims to slow progression of kidney damage by controlling underlying conditions (strict blood pressure and diabetes management, ACEi/ARBs, SGLT2 inhibitors) and dietary protein/potassium management.")
                .treatmentOverviewBn("ডায়াবেটিস ও রক্তচাপ কঠোর নিয়ন্ত্রণে রাখা, চিকিৎসকের পরামর্শ অনুযায়ী নির্দিষ্ট কিডনি সুরক্ষাকারী ওষুধ সেবন এবং খাদ্যে প্রোটিন, লবণ ও পটাশিয়ামের মাত্রা নিয়ন্ত্রণ করা।")
                .homeCareEn("Strict fluid intake tracking if advised by nephrologist, monitoring daily body weight, avoiding all OTC painkiller NSAIDs, and taking prescribed binders with meals.")
                .homeCareBn("প্রতিদিনের প্রস্রাব ও পানি পানের পরিমাণ মেপে রাখা, প্রতিদিন সকালে ওজন মাপা এবং চিকিৎসকের অনুমতি ছাড়া কোনো ব্যথানাশক ওষুধ একদম না খাওয়া।")
                .dietLifestyleEn("Follow a kidney-friendly diet: limit sodium, control protein intake according to stage, and restrict high-potassium foods (bananas, coconut water) and high-phosphorus foods if levels are elevated.")
                .dietLifestyleBn("কম লবণযুক্ত খাবার খান। রক্তে পটাশিয়াম বেশি থাকলে ডাবের পানি, কলা ও টক ফল এড়িয়ে চলুন এবং চিকিৎসকের নির্দেশিত মাত্রায় প্রোটিন গ্রহণ করুন।")
                .preventionEn("Maintain optimal control of diabetes and hypertension, avoid self-medicating with pain medications (NSAIDs), drink clean water, and get annual kidney function tests.")
                .preventionBn("ডায়াবেটিস ও উচ্চ রক্তচাপ নিয়ন্ত্রণে রাখা, ব্যথানাশক ওষুধ বর্জন করা এবং বছরে অন্তত একবার রক্তের ক্রিয়েটিনিন পরীক্ষা করা।")
                .doctorVisitEn("Regular monitoring with a nephrologist every 1-3 months depending on the stage of CKD.")
                .doctorVisitBn("কিডনির অবস্থা অনুযায়ী প্রতি ১-৩ মাস অন্তর নেফ্রোলজিস্টের (কিডনি বিশেষজ্ঞ) পরামর্শ নিন।")
                .emergencyEn("Seek IMMEDIATE emergency medical care for severe fluid overload causing intense breathlessness while lying flat (Pulmonary Edema), severe chest pain, or dangerous hyperkalemia.")
                .emergencyBn("শোয়া অবস্থায় তীব্র শ্বাসকষ্ট হলে (ফুসফুসে পানি জমা), বুকে চাপ লাগলে বা হঠাৎ প্রস্রাব সম্পূর্ণ বন্ধ হয়ে গেলে তাৎক্ষণিক জরুরি বিভাগে যান।")
                .durationEn("Chronic (Long-term progressive condition)")
                .durationBn("দীর্ঘস্থায়ী (আজীবন পর্যবেক্ষণ ও যত্ন প্রয়োজন)")
                .isPopular(false)
                .viewCount(780)
                .status("PUBLISHED")
                .sourceName("KDIGO (Kidney Disease: Improving Global Outcomes) & National Kidney Foundation")
                .sourceUrl("https://kdigo.org/")
                .referenceNote("Aligned with KDIGO 2026 Clinical Practice Guideline for CKD.")
                .lastReviewedAt(LocalDate.of(2026, 8, 25))
                .build();

        addSymptoms(ckd, List.of(
                new String[]{"Often asymptomatic in early stages (Stages 1-3)", "প্রাথমিক পর্যায়ে কোনো উপসর্গ থাকে না", "true"},
                new String[]{"Swelling in ankles, feet, or face (Edema)", "পা, গোড়ালি বা মুখ ফুলে যাওয়া ও পানি আসা", "true"},
                new String[]{"Persistent fatigue, weakness, and anemia", "সারাক্ষণ ক্লান্তি, দুর্বলতা ও রক্তস্বল্পতা", "true"},
                new String[]{"Changes in urination (foamy/frothy urine, increased night urination)", "প্রস্রাবে অতিরিক্ত ফেনা হওয়া বা রাতে বারবার প্রস্রাব হওয়া", "false"},
                new String[]{"Loss of appetite, metallic taste in mouth, and nausea", "খাবারে অরুচি, মুখে ধাতব স্বাদ ও বমি ভাব", "false"},
                new String[]{"Itchy, dry skin and muscle cramps", "ত্বকে চুলকানি ও মাংসপেশিতে টান লাগা", "false"}
        ));
        diseases.add(ckd);

        // --- OSTEOARTHRITIS ---
        Disease osteoarthritis = Disease.builder()
                .nameEn("Osteoarthritis (Knee & Joint Arthritis)")
                .nameBn("অস্টিওআর্থারাইটিস (হাঁটু ও জয়েন্টের বাত ব্যথা)")
                .slug("osteoarthritis-joint-arthritis")
                .category(catJoint)
                .subcategoryEn("Degenerative Joint Disease")
                .subcategoryBn("জয়েন্টের ক্ষয়জনিত রোগ")
                .alternativeNamesEn("OA, Degenerative Arthritis, Wear-and-Tear Arthritis")
                .alternativeNamesBn("অস্টিওআর্থারাইটিস, বাত রোগ, হাঁটুর ক্ষয়")
                .overviewEn("Osteoarthritis is the most common form of arthritis, caused by the gradual breakdown of protective cartilage that cushions the ends of bones within joints. It commonly affects knees, hips, hands, and spine, resulting in joint pain, stiffness, and reduced mobility.")
                .overviewBn("অস্টিওআর্থারাইটিস হলো হাড়ের জোড়া বা জয়েন্টের কার্টিলেজ বা নরম তরুণাস্থি ক্ষয়ে যাওয়ার রোগ। এতে হাঁটু, কোমর বা আঙুলের জয়েন্টে প্রচণ্ড ব্যথা, শক্ত হয়ে যাওয়া এবং হাঁটাচলা করতে সমস্যা হয়। বয়স বৃদ্ধি ও অতিরিক্ত ওজন এর প্রধান কারণ।")
                .diagnosisEn("Diagnosed through clinical examination, joint range-of-motion assessment, and Plain Weight-Bearing X-Rays showing joint space narrowing and osteophytes (bone spurs).")
                .diagnosisBn("চিকিৎসকের পরীক্ষা এবং আক্রান্ত জয়েন্টের এক্স-রে (X-Ray) করে হাড়ের মধ্যকার দূরত্ব কমে যাওয়া দেখে এটি নিশ্চিত করা হয়।")
                .treatmentOverviewEn("Management focuses on pain reduction, physical therapy, low-impact exercise (swimming, cycling), weight loss, topical/oral analgesics, and in advanced stages, joint replacement surgery.")
                .treatmentOverviewBn("ওজন কমানো, ফিজিওথেরাপি ও হালকা ব্যায়াম, গরম সেঁক, চিকিৎসকের পরামর্শ অনুযায়ী ব্যথানাশক মলম বা ওষুধ এবং তীব্র ক্ষেত্রে জয়েন্ট প্রতিস্থাপন অপারেশন।")
                .homeCareEn("Apply warm compresses for joint stiffness, use supportive knee braces or walking sticks, and perform quadriceps strengthening exercises daily.")
                .homeCareBn("হাঁটুতে গরম সেঁক দিন, হাঁটু ভাজ করে বেশিক্ষণ মেঝেতে বা পিঁড়িতে বসবেন না, হাই কমোড ব্যবহার করুন এবং পায়ের পেশি শক্ত করার হালকা ব্যায়াম করুন।")
                .dietLifestyleEn("Maintain a healthy body weight to reduce mechanical stress on weight-bearing joints. Consume anti-inflammatory omega-3 fatty acids, calcium, and vitamin D.")
                .dietLifestyleBn("শারীরিক ওজন কমান (প্রতি ১ কেজি ওজন কমলে হাঁটুর ওপর ৪ কেজি চাপ কমে)। ক্যালসিয়াম, ভিটামিন ডি ও ওমেগা-৩ সমৃদ্ধ খাবার খান।")
                .preventionEn("Avoid repetitive joint trauma, maintain healthy weight, stay physically active, and use ergonomic techniques when lifting heavy objects.")
                .preventionBn("ওজন নিয়ন্ত্রণে রাখা, নিয়মিত হাঁটা বা সাঁতার কাটা এবং অতিরিক্ত ভারী জিনিস তোলা এড়িয়ে চলা।")
                .doctorVisitEn("Consult an orthopedic specialist or rheumatologist if joint pain persists for more than 2 weeks, interferes with sleep, or limits walking ability.")
                .doctorVisitBn("জয়েন্টের ব্যথা দুই সপ্তাহের বেশি স্থায়ী হলে বা স্বাভাবিক চলাচলে সমস্যা হলে অর্থোপেডিক চিকিৎসকের শরণাপন্ন হন।")
                .emergencyEn("Seek prompt medical care if a joint suddenly becomes red, hot, severely swollen, and accompanied by fever (to exclude Septic Arthritis).")
                .emergencyBn("জয়েন্ট হঠাৎ অতিরিক্ত ফুলে লাল ও গরম হয়ে গেলে এবং সাথে জ্বর থাকলে দ্রুত হাসপাতালে যান কারণ এটি জীবাণুঘটিত সংক্রমণ হতে পারে।")
                .durationEn("Chronic (Progressive condition manageable with therapy)")
                .durationBn("দীর্ঘস্থায়ী (সঠিক নিয়মে চললে ব্যথা নিয়ন্ত্রণে রেখে ভালো থাকা সম্ভব)")
                .isPopular(false)
                .viewCount(720)
                .status("PUBLISHED")
                .sourceName("American College of Rheumatology (ACR) & Arthritis Foundation")
                .sourceUrl("https://www.rheumatology.org/")
                .referenceNote("Reviewed according to ACR 2026 Guidelines for the Management of Osteoarthritis.")
                .lastReviewedAt(LocalDate.of(2026, 8, 12))
                .build();

        addSymptoms(osteoarthritis, List.of(
                new String[]{"Joint pain during or after movement/weight-bearing", "হাঁটাহাঁটি বা সিঁড়ি দিয়ে ওঠার সময় জয়েন্টে ব্যথা", "true"},
                new String[]{"Joint stiffness upon waking in the morning (lasting < 30 minutes)", "ঘুম থেকে ওঠার পর জয়েন্ট আড়ষ্ট বা শক্ত লাগা (আধা ঘণ্টার কম)", "true"},
                new String[]{"Crackling or grating sound/sensation in the joint (Crepitus)", "হাঁটু বা জয়েন্ট নাড়ালে কট কট শব্দ হওয়া", "true"},
                new String[]{"Loss of flexibility and reduced range of motion", "জয়েন্ট পুরোপুরি ভাজ বা সোজা করতে না পারা", "false"},
                new String[]{"Mild swelling and bony enlargement around joint", "জয়েন্টের চারপাশ কিছুটা ফুলে যাওয়া বা হাড় মোটা লাগা", "false"}
        ));
        diseases.add(osteoarthritis);

        // --- ECZEMA ---
        Disease eczema = Disease.builder()
                .nameEn("Atopic Dermatitis (Eczema)")
                .nameBn("একজিমা (এটোপিক ডার্মাটাইটিস)")
                .slug("atopic-dermatitis-eczema")
                .category(catSkin)
                .subcategoryEn("Allergic Dermatological Disease")
                .subcategoryBn("অ্যালার্জিজনিত চর্মরোগ")
                .alternativeNamesEn("Eczema, Atopic Eczema, Allergic Skin Inflammation")
                .alternativeNamesBn("একজিমা, চুলকানি, চর্মরোগ, এলার্জি")
                .overviewEn("Atopic dermatitis (eczema) is a chronic inflammatory skin condition that makes skin dry, red, itchy, and irritated. It is strongly linked to a compromised skin barrier and overactive immune response, commonly running in families with asthma or allergic rhinitis.")
                .overviewBn("একজিমা হলো একটি দীর্ঘমেয়াদী ত্বকের অ্যালার্জি ও প্রদাহজনিত রোগ যাতে ত্বক অতিরিক্ত শুষ্ক, লালচে ও প্রচণ্ড চুলকানিযুক্ত হয়ে পড়ে। চুলকালে চামড়া খসখসে হয়ে পানি বা পুঁজ বের হতে পারে। এটি ছোঁয়াচে কোনো রোগ নয়।")
                .diagnosisEn("Diagnosed clinically through skin inspection and history of recurring itchy skin in flexural areas (creases of elbows, behind knees). Patch testing may be used to identify contact triggers.")
                .diagnosisBn("চর্মরোগ বিশেষজ্ঞ ত্বকের অবস্থা ও চুলকানির ইতিহাস দেখে এটি নির্ণয় করেন।")
                .treatmentOverviewEn("Core management involves daily barrier repair with thick emollients, avoiding harsh soaps, topical corticosteroids for flares, and non-steroidal topical calcineurin inhibitors.")
                .treatmentOverviewBn("ত্বকের আর্দ্রতা ধরে রাখতে নিয়মিত ময়েশ্চারাইজার ও ইমোলিয়েন্ট ব্যবহার করা, ক্ষারযুক্ত সাবান পরিহার এবং তীব্র চুলকানিতে চিকিৎসকের পরামর্শে নির্দিষ্ট মলম লাগানো।")
                .homeCareEn("Apply thick fragrance-free moisturizer within 3 minutes after bathing ('soak and seal'), take lukewarm short baths, wear soft cotton clothing, and keep fingernails short.")
                .homeCareBn("গোসলের পরপরই ৩ মিনিটের মধ্যে শরীরে পেট্রোলিয়াম জেলি বা ময়েশ্চারাইজার লাগান, কুসুম গরম পানিতে গোসল করুন এবং সুতি ঢিলেঢালা পোশাক পরুন।")
                .dietLifestyleEn("Identify and avoid personal trigger foods if confirmed by testing. Avoid synthetic woolen fabrics and maintain humid air during dry winters.")
                .dietLifestyleBn("যেসব খাবারে বা উপাদানে অ্যালার্জি বাড়ে তা এড়িয়ে চলুন এবং শীতকালে ত্বকের শুষ্কতা রোধে বেশি করে ময়েশ্চারাইজার লাগান।")
                .preventionEn("Maintain regular moisturizing habits, use mild soap-free cleansers, and manage psychological stress which often triggers flare-ups.")
                .preventionBn("ত্বক কখনো শুষ্ক হতে না দেওয়া, মৃদু সাবান ব্যবহার করা এবং মানসিক চাপমুক্ত থাকা।")
                .doctorVisitEn("Consult a dermatologist if eczema flares become widespread, cause intense sleep disturbance, or fail to respond to emollients.")
                .doctorVisitBn("চুলকানি খুব বেশি হলে বা স্বাভাবিক ঘুমে ব্যাঘাত ঘটলে চর্মরোগ বিশেষজ্ঞের পরামর্শ নিন।")
                .emergencyEn("Seek prompt medical attention if skin becomes intensely painful, swollen, warm, or develops yellow crusts/pus (indicating secondary bacterial infection like Staphylococcal Cellulitis).")
                .emergencyBn("ত্বক অতিরিক্ত লাল হয়ে ফুলে গেলে, প্রচণ্ড গরম লাগলে বা হলুদ পুঁজ বের হলে অবিলম্বে হাসপাতালে যান কারণ এটি ব্যাকটেরিয়া সংক্রমণ হতে পারে।")
                .durationEn("Chronic relapsing (Cycles of flares and remissions)")
                .durationBn("দীর্ঘস্থায়ী (মাঝে মাঝে বাড়ে আবার নিয়মে থাকলে কমে যায়)")
                .isPopular(false)
                .viewCount(650)
                .status("PUBLISHED")
                .sourceName("American Academy of Dermatology (AAD) & National Eczema Association")
                .sourceUrl("https://www.aad.org/public/diseases/eczema")
                .referenceNote("Reviewed according to AAD 2026 Guidelines for Atopic Dermatitis.")
                .lastReviewedAt(LocalDate.of(2026, 8, 10))
                .build();

        addSymptoms(eczema, List.of(
                new String[]{"Intense itching (Pruritus), especially severe at night", "তীব্র চুলকানি, বিশেষ করে রাতের বেলা বেশি হওয়া", "true"},
                new String[]{"Dry, cracked, sensitive, and scaly skin patches", "ত্বক খসখসে, শুষ্ক ও ফেটে যাওয়া", "true"},
                new String[]{"Red to brownish-gray patches (creases of elbows, knees, neck, wrists)", "হাঁটু বা কনুইয়ের ভাঁজে, গলায় লালচে বা কালচে দাগ", "true"},
                new String[]{"Small raised bumps which may leak fluid and crust when scratched", "ছোট ছোট ফুসকুড়ি যা চুলকালে তরল পানি বের হয়", "false"},
                new String[]{"Raw, sensitive, swollen skin from repeated scratching", "চুলকানোর কারণে চামড়া ছিলে লাল হয়ে জ্বালা করা", "false"}
        ));
        diseases.add(eczema);

        // Save all diseases
        diseaseRepository.saveAll(diseases);

        // Connect related diseases
        diabetes.setRelatedDiseases(new ArrayList<>(List.of(hypertension, ckd)));
        hypertension.setRelatedDiseases(new ArrayList<>(List.of(stroke, diabetes, ckd)));
        asthma.setRelatedDiseases(new ArrayList<>(List.of(pneumonia, eczema)));
        dengue.setRelatedDiseases(new ArrayList<>(List.of(pneumonia)));
        gerd.setRelatedDiseases(new ArrayList<>(List.of(hypertension)));
        pneumonia.setRelatedDiseases(new ArrayList<>(List.of(asthma)));
        stroke.setRelatedDiseases(new ArrayList<>(List.of(hypertension, diabetes)));
        ckd.setRelatedDiseases(new ArrayList<>(List.of(diabetes, hypertension)));
        osteoarthritis.setRelatedDiseases(new ArrayList<>(List.of(ckd)));
        eczema.setRelatedDiseases(new ArrayList<>(List.of(asthma)));

        diseaseRepository.saveAll(diseases);
        log.info("Disease database successfully initialized with {} authoritative bilingual medical records.", diseases.size());
    }

    private DiseaseCategory createCategory(String nameEn, String nameBn, String slug, String icon,
                                           String descEn, String descBn, int order) {
        return DiseaseCategory.builder()
                .nameEn(nameEn)
                .nameBn(nameBn)
                .slug(slug)
                .icon(icon)
                .descriptionEn(descEn)
                .descriptionBn(descBn)
                .displayOrder(order)
                .build();
    }

    private void addSymptoms(Disease d, List<String[]> symptoms) {
        int order = 0;
        for (String[] s : symptoms) {
            d.getSymptoms().add(DiseaseSymptom.builder()
                    .disease(d)
                    .symptomEn(s[0])
                    .symptomBn(s[1])
                    .isPrimary(Boolean.parseBoolean(s[2]))
                    .displayOrder(order++)
                    .build());
        }
    }

    private void addCauses(Disease d, List<String[]> causes) {
        int order = 0;
        for (String[] c : causes) {
            d.getCauses().add(DiseaseCause.builder()
                    .disease(d)
                    .causeEn(c[0])
                    .causeBn(c[1])
                    .displayOrder(order++)
                    .build());
        }
    }

    private void addRiskFactors(Disease d, List<String[]> factors) {
        int order = 0;
        for (String[] f : factors) {
            d.getRiskFactors().add(DiseaseRiskFactor.builder()
                    .disease(d)
                    .factorEn(f[0])
                    .factorBn(f[1])
                    .displayOrder(order++)
                    .build());
        }
    }

    private void addMedicines(Disease d, List<String[]> medicines) {
        int order = 0;
        for (String[] m : medicines) {
            d.getMedicines().add(DiseaseMedicineInfo.builder()
                    .disease(d)
                    .nameEn(m[0])
                    .nameBn(m[1])
                    .drugClassEn(m[2])
                    .drugClassBn(m[3])
                    .generalInfoEn(m[4])
                    .generalInfoBn(m[5])
                    .displayOrder(order++)
                    .build());
        }
    }

    private void addWarningSigns(Disease d, List<String[]> signs) {
        int order = 0;
        for (String[] w : signs) {
            d.getWarningSigns().add(DiseaseWarningSign.builder()
                    .disease(d)
                    .signEn(w[0])
                    .signBn(w[1])
                    .isEmergency(Boolean.parseBoolean(w[2]))
                    .displayOrder(order++)
                    .build());
        }
    }
}
