export type AppLanguage = 'en' | 'bn';

export interface TranslationDict {
  appName: string;
  goodDay: string;
  upcomingMedication: string;
  at: string;
  adherenceTitle: string;
  adherenceGoal: string;
  quickActions: string;
  addMed: string;
  scanRx: string;
  addReport: string;
  exportPdf: string;
  todaySchedule: string;
  viewAll: string;
  noDosesToday: string;
  addMedicationBtn: string;
  markAsTaken: string;
  markAsSkipped: string;
  taken: string;
  missed: string;
  skipped: string;
  pending: string;
  due: string;
  recentPrescriptions: string;
  recentReports: string;
  disclaimerTitle: string;
  disclaimerText: string;
  
  // OCR & Prescription Scanner
  scanPrescriptionTitle: string;
  verifyOcrTitle: string;
  reviewMedicinesTitle: string;
  captureInstruction: string;
  takePhotoButton: string;
  takePhotoSub: string;
  uploadImageButton: string;
  uploadImageSub: string;
  orQuickDemo: string;
  useSamplePrescription: string;
  useSampleSub: string;
  processingPrescription: string;
  rawOcrTextLabel: string;
  rawOcrTextDesc: string;
  runAiParser: string;
  verificationRequired: string;
  verificationBannerDesc: string;
  prescriptionDetails: string;
  doctorName: string;
  hospitalOrClinic: string;
  date: string;
  diagnosis: string;
  medicinesCount: string;
  addMedicine: string;
  medicineName: string;
  strengthDose: string;
  duration: string;
  dosePattern: string;
  mealInstruction: string;
  reminders: string;
  confirmAndSave: string;
  backToCapture: string;
  backToRaw: string;
  verifySpellingNotice: string;
  prescriptionSavedAlert: string;
  prescriptionSavedMsg: string;
  saveFailedAlert: string;
  saveFailedMsg: string;

  // Food Instructions
  beforeMeal: string;
  afterMeal: string;
  withMeal: string;
  emptyStomach: string;

  // Voice narration prompts
  voiceCapturePrompt: string;
  voiceScanningPrompt: string;
  voiceReviewPrompt: string;
  voiceSavedPrompt: string;
  voiceTakenPrompt: string;
  voiceSkippedPrompt: string;
  voiceEnabledPrompt: string;
  voiceDisabledPrompt: string;
  voiceLangChangedPrompt: string;

  // Tabs & Nav
  tabHome: string;
  tabMedicines: string;
  tabHistory: string;
  tabGuide: string;
  tabProfile: string;

  // History & Records
  medicalHistory: string;
  timelineRecords: string;
  searchRecords: string;
  allRecords: string;
  prescriptions: string;
  labReports: string;
  doctorVisits: string;
  myMedicines: string;
  allMedicines: string;

  // Health Guide & Disease Directory
  healthGuide: string;
  searchDiseasePlaceholder: string;
  popularConditions: string;
  browseCategories: string;
  allDiseases: string;
  noDiseasesFound: string;
  noDiseasesFoundSub: string;
  overview: string;
  symptoms: string;
  causes: string;
  riskFactors: string;
  treatment: string;
  medicineInfo: string;
  homeCare: string;
  dietLifestyle: string;
  prevention: string;
  warningSigns: string;
  whenToSeeDoctor: string;
  emergencyInfo: string;
  diseaseDuration: string;
  relatedConditions: string;
  sources: string;
  lastReviewed: string;
  educationalDisclaimer: string;
  listenOverview: string;
  stopAudio: string;

  // Settings
  language: string;
  voiceNarration: string;
  voiceOn: string;
  voiceOff: string;
  selectLanguage: string;
}

export const translations: Record<AppLanguage, TranslationDict> = {
  en: {
    appName: 'MediTalk',
    goodDay: 'Good day',
    upcomingMedication: 'Upcoming Medication',
    at: 'at',
    adherenceTitle: 'Medication Adherence',
    adherenceGoal: 'Active Goal: 90%+',
    quickActions: 'Quick Actions',
    addMed: 'Add Med',
    scanRx: 'Scan Rx',
    addReport: 'Add Report',
    exportPdf: 'Export PDF',
    todaySchedule: "Today's Schedule",
    viewAll: 'View All',
    noDosesToday: 'No doses scheduled for today.',
    addMedicationBtn: '+ Add Medication',
    markAsTaken: 'Mark as Taken',
    markAsSkipped: 'Skip',
    taken: 'Taken',
    missed: 'Missed',
    skipped: 'Skipped',
    pending: 'Pending',
    due: 'Due',
    recentPrescriptions: 'Recent Prescriptions',
    recentReports: 'Recent Lab Reports',
    disclaimerTitle: 'Healthcare Disclaimer:',
    disclaimerText:
      'Meditalk helps organize your medical records and reminders. It does not replace professional medical advice. Always follow your doctor\'s official prescription.',

    // Prescription Scanner
    scanPrescriptionTitle: 'Scan Prescription',
    verifyOcrTitle: 'Verify OCR Text',
    reviewMedicinesTitle: 'AI Medicine Review',
    captureInstruction:
      'Capture your doctor\'s prescription using the camera or select from your gallery. Our AI preprocessing and Google Cloud Vision OCR will extract medications automatically.',
    takePhotoButton: 'Take Photo',
    takePhotoSub: 'Capture with camera',
    uploadImageButton: 'Upload Image',
    uploadImageSub: 'Select from gallery',
    orQuickDemo: 'OR QUICK DEMO',
    useSamplePrescription: 'Use Sample Bilingual Prescription',
    useSampleSub: 'Instant OCR demo with English + Bangla dosage patterns (1+0+1)',
    processingPrescription: 'Processing prescription with OCR...',
    rawOcrTextLabel: 'Extracted Raw OCR Text',
    rawOcrTextDesc: 'Review or edit any extracted characters before running the AI structured parser:',
    runAiParser: 'Run AI Structure Parser',
    verificationRequired: 'Verification Required',
    verificationBannerDesc:
      'Please review extracted medicine names, dosages, and timings below. Edit any field before confirming.',
    prescriptionDetails: 'Prescription Details',
    doctorName: 'Physician Name:',
    hospitalOrClinic: 'Hospital / Clinic:',
    date: 'Date:',
    diagnosis: 'Diagnosis:',
    medicinesCount: 'Medicines',
    addMedicine: 'Add Medicine',
    medicineName: 'Medicine Name',
    strengthDose: 'Strength / Dose',
    duration: 'Duration',
    dosePattern: 'Dose Pattern (Schedule)',
    mealInstruction: 'Food / Meal Instruction',
    reminders: 'Reminders:',
    confirmAndSave: 'Confirm & Save Prescription',
    backToCapture: 'Back',
    backToRaw: 'Raw Text',
    verifySpellingNotice: 'Please verify medicine name spelling from original prescription.',
    prescriptionSavedAlert: 'Prescription Saved',
    prescriptionSavedMsg: 'Prescription saved to MySQL and medicine reminders scheduled successfully!',
    saveFailedAlert: 'Save Failed',
    saveFailedMsg: 'Could not save prescription. Please verify your connection and try again.',

    // Food Instructions
    beforeMeal: 'Before Meal',
    afterMeal: 'After Meal',
    withMeal: 'With Meal',
    emptyStomach: 'Empty Stomach',

    // Voice narration prompts
    voiceCapturePrompt: 'Please take a photo of your prescription or select one from your gallery.',
    voiceScanningPrompt: 'Uploading prescription and extracting medicine information with Google Cloud Vision OCR.',
    voiceReviewPrompt: 'Prescription extracted. Please review and edit your medicines before saving.',
    voiceSavedPrompt: 'Prescription saved to database and medicine reminders scheduled.',
    voiceTakenPrompt: 'Medicine marked as taken. Well done!',
    voiceSkippedPrompt: 'Medicine marked as skipped.',
    voiceEnabledPrompt: 'Voice narration enabled.',
    voiceDisabledPrompt: 'Voice narration disabled.',
    voiceLangChangedPrompt: 'Language changed to English.',

    // Tabs & Nav
    tabHome: 'Home',
    tabMedicines: 'Medicines',
    tabHistory: 'History',
    tabGuide: 'Health Guide',
    tabProfile: 'Profile',

    // History & Records
    medicalHistory: 'Medical History',
    timelineRecords: 'Timeline Records',
    searchRecords: 'Search records, doctors, test names...',
    allRecords: 'All Records',
    prescriptions: 'Prescriptions',
    labReports: 'Lab Reports',
    doctorVisits: 'Doctor Visits',
    myMedicines: 'My Medicines',
    allMedicines: 'All Medications',

    // Health Guide & Disease Directory
    healthGuide: 'Health & Disease Guide',
    searchDiseasePlaceholder: 'Search disease, symptoms (e.g. Diabetes, Fever, Asthma)...',
    popularConditions: 'Popular Conditions',
    browseCategories: 'Medical Categories',
    allDiseases: 'All Diseases',
    noDiseasesFound: 'No disease information found.',
    noDiseasesFoundSub: 'Try searching with alternative English or Bangla medical terms.',
    overview: 'Overview',
    symptoms: 'Symptoms',
    causes: 'Causes',
    riskFactors: 'Risk Factors',
    treatment: 'General Treatment',
    medicineInfo: 'Medicine Information',
    homeCare: 'Home & Supportive Care',
    dietLifestyle: 'Diet & Lifestyle',
    prevention: 'Prevention',
    warningSigns: 'Warning Signs',
    whenToSeeDoctor: 'When to See a Doctor',
    emergencyInfo: 'Emergency Warning Signs',
    diseaseDuration: 'Course & Duration',
    relatedConditions: 'Related Health Conditions',
    sources: 'Medical Sources & References',
    lastReviewed: 'Last Reviewed',
    educationalDisclaimer:
      'Medical Disclaimer: This information is for general educational purposes and is not a substitute for professional medical diagnosis, treatment, or advice. Always consult a qualified physician.',
    listenOverview: 'Listen Audio',
    stopAudio: 'Stop Audio',

    // Settings
    language: 'Language',
    voiceNarration: 'Voice Narration',
    voiceOn: 'Voice On',
    voiceOff: 'Voice Off',
    selectLanguage: 'Language / ভাষা',
  },
  bn: {
    appName: 'মেডিটক',
    goodDay: 'শুভ দিন',
    upcomingMedication: 'পরবর্তী ওষুধ',
    at: 'সময়',
    adherenceTitle: 'ওষুধ গ্রহণের ধারাবাহিকতা',
    adherenceGoal: 'লক্ষ্য: ৯০%+',
    quickActions: 'দ্রুত সেবা',
    addMed: 'ওষুধ যোগ',
    scanRx: 'প্রেসক্রিপশন স্ক্যান',
    addReport: 'রিপোর্ট যোগ',
    exportPdf: 'পিডিএফ ডাউনলোড',
    todaySchedule: 'আজকের সময়সূচি',
    viewAll: 'সব দেখুন',
    noDosesToday: 'আজকের জন্য কোনো ওষুধ নির্ধারিত নেই।',
    addMedicationBtn: '+ ওষুধ যোগ করুন',
    markAsTaken: 'খেয়েছি',
    markAsSkipped: 'বাদ দিন',
    taken: 'গৃহীত',
    missed: 'বাদ পড়েছে',
    skipped: 'এড়িয়ে গেছি',
    pending: 'অপেক্ষমাণ',
    due: 'সময় হয়েছে',
    recentPrescriptions: 'সাম্প্রতিক প্রেসক্রিপশন',
    recentReports: 'ল্যাব টেস্ট রিপোর্ট',
    disclaimerTitle: 'স্বাস্থ্য সুরক্ষা নির্দেশিকা:',
    disclaimerText:
      'মেডিটক আপনার স্বাস্থ্য সংক্রান্ত রেকর্ড ও রিমাইন্ডার ব্যবস্থাপনায় সাহায্য করে। এটি ডাক্তারের পেশাদার পরামর্শের বিকল্প নয়। সর্বদা চিকিৎসকের মূল প্রেসক্রিপশন অনুসরণ করুন।',

    // Prescription Scanner
    scanPrescriptionTitle: 'প্রেসক্রিপশন স্ক্যান',
    verifyOcrTitle: 'ও সি আর টেক্সট যাচাই',
    reviewMedicinesTitle: 'ওষুধের তথ্য পর্যালোচনা',
    captureInstruction:
      'ক্যামেরা দিয়ে প্রেসক্রিপশনের স্পষ্ট ছবি তুলুন অথবা গ্যালারি থেকে নির্বাচন করুন। আমাদের কৃত্রিম বুদ্ধিমত্তা ও গুগল ভিশন ও সি আর স্বয়ংক্রিয়ভাবে ওষুধের তথ্য সনাক্ত করবে।',
    takePhotoButton: 'ছবি তুলুন',
    takePhotoSub: 'ক্যামেরা ব্যবহার করুন',
    uploadImageButton: 'ছবি আপলোড',
    uploadImageSub: 'গ্যালারি থেকে নিন',
    orQuickDemo: 'অথবা নমুনা প্রেসক্রিপশন ডেমো',
    useSamplePrescription: 'নমুনা দ্বিভাষিক প্রেসক্রিপশন ব্যবহার করুন',
    useSampleSub: 'ইংরেজি ও বাংলা মাত্রা প্যাটার্নসহ দ্রুত ও সি আর ডেমো (১+০+১)',
    processingPrescription: 'প্রেসক্রিপশন ও সি আর প্রক্রিয়া করা হচ্ছে...',
    rawOcrTextLabel: 'সনাক্তকৃত ও সি আর টেক্সট',
    rawOcrTextDesc: 'স্বয়ংক্রিয়ভাবে সাজানোর পূর্বে টেক্সট যাচাই বা সংশোধন করতে পারেন:',
    runAiParser: 'ওষুধের তথ্য সনাক্ত করুন',
    verificationRequired: 'যাচাইকরণ প্রয়োজন',
    verificationBannerDesc:
      'অনুগ্রহ করে সনাক্তকৃত ওষুধের নাম, মাত্রা এবং খাওয়ার সময়সূচি মিলিয়ে নিন। সংরক্ষণের পূর্বে যেকোনো তথ্য সম্পাদনা করতে পারেন।',
    prescriptionDetails: 'প্রেসক্রিপশনের বিবরণ',
    doctorName: 'চিকিৎসকের নাম:',
    hospitalOrClinic: 'হাসপাতাল / ক্লিনিক:',
    date: 'তারিখ:',
    diagnosis: 'রোগ / লক্ষণ:',
    medicinesCount: 'ওষুধের তালিকা',
    addMedicine: '+ নতুন ওষুধ যোগ করুন',
    medicineName: 'ওষুধের নাম',
    strengthDose: 'পাওয়ার / মাত্রা',
    duration: 'মেয়াদ',
    dosePattern: 'সেবনের নিয়ম (মাত্রা)',
    mealInstruction: 'খাবার গ্রহণের নির্দেশ',
    reminders: 'রিমাইন্ডার সময়:',
    confirmAndSave: 'যাচাই সম্পন্ন ও সংরক্ষণ করুন',
    backToCapture: 'পিছনে',
    backToRaw: 'মূল টেক্সট',
    verifySpellingNotice: 'মূল প্রেসক্রিপশন থেকে ওষুধের নামের বানান নিশ্চিত করুন।',
    prescriptionSavedAlert: 'সংরক্ষণ সফল',
    prescriptionSavedMsg: 'প্রেসক্রিপশন ডাটাবেজে সংরক্ষিত হয়েছে এবং ওষুধের রিমাইন্ডার সক্রিয় করা হয়েছে!',
    saveFailedAlert: 'সংরক্ষণ ব্যর্থ',
    saveFailedMsg: 'প্রেসক্রিপশন সংরক্ষণ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',

    // Food Instructions
    beforeMeal: 'খাবারের আগে',
    afterMeal: 'খাবারের পরে',
    withMeal: 'খাবারের সাথে',
    emptyStomach: 'খালি পেটে',

    // Voice narration prompts
    voiceCapturePrompt: 'আপনার প্রেসক্রিপশনের ছবি তুলুন অথবা গ্যালারি থেকে নির্বাচন করুন।',
    voiceScanningPrompt: 'প্রেসক্রিপশন আপলোড হচ্ছে এবং গুগল ভিশন ও সি আর দিয়ে ওষুধের তথ্য বের করা হচ্ছে।',
    voiceReviewPrompt: 'প্রেসক্রিপশন থেকে তথ্য পাওয়া গেছে। সংরক্ষণের পূর্বে ওষুধের নাম ও সময়সূচি মিলিয়ে নিন।',
    voiceSavedPrompt: 'প্রেসক্রিপশন সফলভাবে সংরক্ষিত হয়েছে এবং রিমাইন্ডার সেট করা হয়েছে।',
    voiceTakenPrompt: 'ওষুধ গ্রহণ করা হয়েছে হিসেবে চিহ্নিত করা হয়েছে। অনেক ধন্যবাদ!',
    voiceSkippedPrompt: 'ওষুধ বাদ দেওয়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে।',
    voiceEnabledPrompt: 'ভয়েস নির্দেশনা চালু করা হয়েছে।',
    voiceDisabledPrompt: 'ভয়েস নির্দেশনা বন্ধ করা হয়েছে।',
    voiceLangChangedPrompt: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',

    // Tabs & Nav
    tabHome: 'হোম',
    tabMedicines: 'ওষুধ',
    tabHistory: 'হিস্ট্রি',
    tabGuide: 'স্বাস্থ্য গাইড',
    tabProfile: 'প্রোফাইল',

    // History & Records
    medicalHistory: 'মেডিকেল হিস্ট্রি',
    timelineRecords: 'টাইমলাইন রেকর্ড',
    searchRecords: 'রেকর্ড, চিকিৎসক বা টেস্টের নাম খুঁজুন...',
    allRecords: 'সব রেকর্ড',
    prescriptions: 'প্রেসক্রিপশন',
    labReports: 'ল্যাব রিপোর্ট',
    doctorVisits: 'ডাক্তারের পরামর্শ',
    myMedicines: 'আমার ওষুধ',
    allMedicines: 'সকল ওষুধ',

    // Health Guide & Disease Directory
    healthGuide: 'স্বাস্থ্য ও রোগ নির্দেশিকা',
    searchDiseasePlaceholder: 'রোগ বা লক্ষণ খুঁজুন (যেমন: ডায়াবেটিস, জ্বর, হাঁপানি)...',
    popularConditions: 'জনপ্রিয় স্বাস্থ্য পরিস্থিতি',
    browseCategories: 'বিভাগ অনুযায়ী রোগসমূহ',
    allDiseases: 'সকল রোগ ও ব্যাধি',
    noDiseasesFound: 'কোনো রোগের তথ্য পাওয়া যায়নি।',
    noDiseasesFoundSub: 'বিকল্প বাংলা বা ইংরেজি নামে অনুসন্ধান করার চেষ্টা করুন।',
    overview: 'সংক্ষিপ্ত বিবরণ',
    symptoms: 'লক্ষণসমূহ',
    causes: 'কারণসমূহ',
    riskFactors: 'ঝুঁকির কারণ',
    treatment: 'চিকিৎসা ও ব্যবস্থাপনা',
    medicineInfo: 'ওষুধের শিক্ষামূলক তথ্য',
    homeCare: 'ঘরোয়া ও সহায়ক যত্ন',
    dietLifestyle: 'খাদ্য ও জীবনযাপন',
    prevention: 'প্রতিরোধ',
    warningSigns: 'সতর্কবার্তা ও বিপদের লক্ষণ',
    whenToSeeDoctor: 'কখন ডাক্তার দেখাবেন',
    emergencyInfo: 'জরুরি পরিস্থিতি ও তাৎক্ষণিক করণীয়',
    diseaseDuration: 'স্থায়িত্ব ও গতিপ্রকৃতি',
    relatedConditions: 'সম্পর্কিত রোগ বা অবস্থা',
    sources: 'তথ্যের উৎস ও নির্দেশিকা',
    lastReviewed: 'সর্বশেষ পর্যালোচনা',
    educationalDisclaimer:
      'চিকিৎসা সতর্কীকরণ: এই তথ্য সাধারণ স্বাস্থ্য শিক্ষার উদ্দেশ্যে প্রদান করা হয়েছে। এটি চিকিৎসকের পরামর্শ, রোগ নির্ণয় বা ব্যক্তিগত চিকিৎসার বিকল্প নয়। সর্বদা যোগ্য চিকিৎসকের পরামর্শ নিন।',
    listenOverview: 'অডিও শুনুন',
    stopAudio: 'অডিও বন্ধ',

    // Settings
    language: 'ভাষা',
    voiceNarration: 'ভয়েস নির্দেশনা',
    voiceOn: 'ভয়েস চালু',
    voiceOff: 'ভয়েস বন্ধ',
    selectLanguage: 'ভাষা নির্বাচন (Language)',
  },
};
