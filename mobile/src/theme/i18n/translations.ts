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
  loadingUploadingPrescription: string;
  loadingReadingPrescription: string;
  loadingUnderstandingPrescription: string;
  loadingPreparingMedicines: string;
  retryOcr: string;
  extractionSourceLabel: string;
  extractionGemini: string;
  extractionRuleBased: string;
  ocrEngineLabel: string;
  missingFieldsAlert: string;
  missingFieldsMsg: string;
  duplicateTitle: string;
  duplicateMsg: string;
  saveAnyway: string;
  namelessMedicineAlert: string;
  namelessMedicineMsg: string;
  incompleteWarningTitle: string;
  incompleteWarningMsg: string;
  keepEditing: string;
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

  // Emergency Assistance
  emergencyAssistance: string;
  emergencySubtitle: string;

  // Doctor Updates (patient dashboard)
  doctorUpdates: string;
  noDoctorUpdates: string;
  doctorOnline: string;

  // Find Doctors (patient dashboard)
  findDoctors: string;
  findDoctorsSubtitle: string;
  doctorsOnline: string;
  searchDoctors: string;
  noDoctorsFound: string;
  noDoctorsFoundSub: string;
  onlineNow: string;
  offlineNow: string;
  call: string;
  message: string;
  seeAllDoctors: string;

  // Profile editing
  editProfile: string;
  editProfileSubtitle: string;
  changePhoto: string;
  saveChanges: string;
  profileSaved: string;
  profileSaveFailed: string;
  fullName: string;
  emailLabel: string;
  phoneLabel: string;
  genderLabel: string;
  bloodGroupLabel: string;
  dateOfBirthLabel: string;
  emergencyContactLabel: string;

  // Reminder notification settings
  notificationSettings: string;
  notificationSettingsSubtitle: string;
  medicineReminders: string;
  medicineRemindersDesc: string;
  reminderSound: string;
  reminderSoundDesc: string;
  reminderVibration: string;
  reminderVibrationDesc: string;
  reminderVoiceReadout: string;
  reminderVoiceReadoutDesc: string;
  sendTestReminder: string;
  testReminderTitle: string;
  testReminderBody: string;
  notificationPermissionNeeded: string;
  customTimesHint: string;
  addReminderTime: string;

  // Health chat (AI assistant)
  aiChatTitle: string;
  aiChatSubtitle: string;
  aiGreeting: string;
  aiThinking: string;
  aiInputPlaceholder: string;
  aiDisclaimer: string;
  aiRelatedConditions: string;
  aiEmergencyTitle: string;
  aiEmergencyBody: string;
  askAiAction: string;
  directoryAction: string;
  aiSuggestFever: string;
  aiSuggestHeadache: string;
  aiSuggestStomach: string;
  aiSuggestBreathing: string;
  aiSuggestMedicine: string;
  aiNoMatch: string;

  // Calls & realtime
  callHistory: string;
  calls: string;
  incomingCall: string;
  outgoingCall: string;
  missedCall: string;
  declinedCall: string;
  callEnded: string;
  ringing: string;
  connecting: string;
  connected: string;
  acceptCall: string;
  declineCall: string;
  endCall: string;
  audioCall: string;
  videoCall: string;
  noCallHistory: string;
  callBack: string;
  typing: string;
  peerOffline: string;
  mediaPending: string;
  mute: string;
  unmute: string;
  speaker: string;
  liveChat: string;
  mediaStarting: string;
  mediaLive: string;
  mediaFailed: string;
  mediaHint: string;
  devBuildTitle: string;

  // Medicine Details (general online info — additive feature)
  medicineDetailsTitle: string;
  medicineInfoLoading: string;
  medicineInfoNotFound: string;
  medicineInfoNotFoundSub: string;
  medicineInfoLoadFailed: string;
  medicineInfoRetry: string;
  medicineYourPrescription: string;
  medicineScheduleLabel: string;
  medicineMealLabel: string;
  medicineFromPrescriptionNote: string;
  medicineAbout: string;
  medicineUses: string;
  medicineUsesSub: string;
  medicineDosageInfo: string;
  medicineSideEffects: string;
  medicineWarnings: string;
  medicineContraindications: string;
  medicineInteractions: string;
  medicineStorage: string;
  medicinePrice: string;
  medicinePriceUnavailable: string;
  medicinePriceVaryNote: string;
  medicineSource: string;
  medicineLastUpdated: string;
  medicineEducationalNote: string;
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
    loadingUploadingPrescription: 'Uploading prescription...',
    loadingReadingPrescription: 'Reading prescription...',
    loadingUnderstandingPrescription: 'Understanding prescription...',
    loadingPreparingMedicines: 'Preparing medicines for review...',
    retryOcr: 'Retry OCR',
    extractionSourceLabel: 'Structured by',
    extractionGemini: 'Prescription AI',
    extractionRuleBased: 'Direct text parsing',
    ocrEngineLabel: 'Read by',
    missingFieldsAlert: 'Incomplete medicine details',
    missingFieldsMsg:
      'Every medicine needs a name, a strength/dose and a dose schedule. Please fill in what the prescription actually states — MediTalk never guesses these values.',
    duplicateTitle: 'Prescription already saved',
    duplicateMsg:
      'A matching prescription is already in your records. Open it from your history, or save another copy if this is a different prescription.',
    saveAnyway: 'Save anyway',
    namelessMedicineAlert: 'Medicine name missing',
    namelessMedicineMsg:
      'A medicine with no name cannot be saved or turned into a reminder. Add the name exactly as written on the prescription, or remove that row.',
    incompleteWarningTitle: 'Some details could not be read',
    incompleteWarningMsg:
      'MediTalk never guesses values. For the medicines listed below the strength/dose or the dose schedule is missing, so they will be saved with the dose marked as not readable and a single reminder at 08:00 AM. You can correct them later.',
    keepEditing: 'Keep editing',
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
    tabGuide: 'Health Chat',
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

    // Health Chat & Disease Directory
    healthGuide: 'Health Chat',
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

    // Emergency Service
    emergencyAssistance: 'Emergency Service',
    emergencySubtitle: 'Nearby hospitals & one-tap emergency call',

    // Doctor Updates (patient dashboard)
    doctorUpdates: 'Doctor Updates',
    noDoctorUpdates: 'No updates from doctors yet.',
    doctorOnline: 'Online',

    // Find Doctors (patient dashboard)
    findDoctors: 'Find Doctors',
    findDoctorsSubtitle: 'Call, text or chat with a doctor who is online now',
    doctorsOnline: 'doctors online',
    searchDoctors: 'Search by name or specialty...',
    noDoctorsFound: 'No doctors match your search.',
    noDoctorsFoundSub: 'Try a different name or medical specialty.',
    onlineNow: 'Online',
    offlineNow: 'Offline',
    call: 'Call',
    message: 'Message',
    seeAllDoctors: 'See all doctors',

    // Profile editing
    editProfile: 'Edit Profile',
    editProfileSubtitle: 'Update your photo and personal details',
    changePhoto: 'Change Photo',
    saveChanges: 'Save Changes',
    profileSaved: 'Profile updated successfully.',
    profileSaveFailed: 'Could not update the profile. Please try again.',
    fullName: 'Full Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone Number',
    genderLabel: 'Gender',
    bloodGroupLabel: 'Blood Group',
    dateOfBirthLabel: 'Date of Birth',
    emergencyContactLabel: 'Emergency Contact Number',

    // Reminder notification settings
    notificationSettings: 'Reminder Notifications',
    notificationSettingsSubtitle: 'Choose how medicine reminders reach you',
    medicineReminders: 'Medicine reminders',
    medicineRemindersDesc: 'Daily alarms for every scheduled dose',
    reminderSound: 'Reminder sound',
    reminderSoundDesc: 'Play a sound with reminders and incoming calls',
    reminderVibration: 'Vibration',
    reminderVibrationDesc: 'Vibrate the device for reminders and incoming calls',
    reminderVoiceReadout: 'Voice readout',
    reminderVoiceReadoutDesc: 'Speak the reminder out loud in your language',
    sendTestReminder: 'Send a test reminder',
    testReminderTitle: 'Test reminder',
    testReminderBody: 'Reminders are working. Your next dose will alert you at its scheduled time.',
    notificationPermissionNeeded: 'Notification permission is required for reminders. Please allow notifications for Meditalk in system settings.',
    customTimesHint: 'You can add your own reminder times when adding a medicine.',
    addReminderTime: '+ Add reminder time',

    // Health chat (AI assistant)
    aiChatTitle: 'AI Health Assistant',
    aiChatSubtitle: 'Ask about symptoms, medicines or home care',
    aiGreeting: 'Hello! I am your AI health assistant. Tell me your symptom or ask a medical question in English or Bangla — I will guide you.',
    aiThinking: 'Thinking…',
    aiInputPlaceholder: 'Type your symptom or question…',
    aiDisclaimer: 'This AI guidance is educational and is not a diagnosis. Always consult a qualified doctor for medical decisions.',
    aiRelatedConditions: 'Related conditions',
    aiEmergencyTitle: 'This may be an emergency',
    aiEmergencyBody: 'Please call emergency services (999) or open Emergency Service right away. Do not wait.',
    askAiAction: 'Ask AI',
    directoryAction: 'Browse Guide',
    aiSuggestFever: 'I have fever',
    aiSuggestHeadache: 'Headache for 2 days',
    aiSuggestStomach: 'Stomach pain',
    aiSuggestBreathing: 'Trouble breathing',
    aiSuggestMedicine: 'How should I take medicine?',
    aiNoMatch: 'I could not find a matching condition. Try describing the symptom differently, or browse the Health Chat directory.',

    // Calls & realtime
    callHistory: 'Call History',
    calls: 'Calls',
    incomingCall: 'Incoming call',
    outgoingCall: 'Outgoing',
    missedCall: 'Missed',
    declinedCall: 'Declined',
    callEnded: 'Call ended',
    ringing: 'Ringing…',
    connecting: 'Connecting…',
    connected: 'Connected',
    acceptCall: 'Accept',
    declineCall: 'Decline',
    endCall: 'End call',
    audioCall: 'Audio call',
    videoCall: 'Video call',
    noCallHistory: 'No calls yet.',
    callBack: 'Call back',
    typing: 'typing…',
    peerOffline: 'is offline right now',
    mediaPending: 'Audio & video media connects here',
    mute: 'Mute',
    unmute: 'Unmute',
    speaker: 'Speaker',
    liveChat: 'Live chat',
    mediaStarting: 'Starting camera & microphone…',
    mediaLive: 'Live audio & video',
    mediaFailed: 'Media connection failed',
    mediaHint: 'Both sides are streaming live audio and video',
    devBuildTitle: 'In-app calls need a development build',

    // Medicine Details (general online info — additive feature)
    medicineDetailsTitle: 'Medicine Details',
    medicineInfoLoading: 'Loading medicine information...',
    medicineInfoNotFound: 'Medicine information not found.',
    medicineInfoNotFoundSub: 'We could not find reliable information for this medicine.',
    medicineInfoLoadFailed: 'Unable to load online medicine information. Please try again later.',
    medicineInfoRetry: 'Retry',
    medicineYourPrescription: 'Your Prescription',
    medicineScheduleLabel: 'Schedule',
    medicineMealLabel: 'Meal',
    medicineFromPrescriptionNote: 'From your MediTalk prescription. Online information never changes this.',
    medicineAbout: 'About this medicine',
    medicineUses: 'Uses',
    medicineUsesSub: 'Why is it used?',
    medicineDosageInfo: 'General dosage information',
    medicineSideEffects: 'Common side effects',
    medicineWarnings: 'Serious warnings',
    medicineContraindications: 'Contraindications',
    medicineInteractions: 'Drug interactions',
    medicineStorage: 'Storage',
    medicinePrice: 'Price',
    medicinePriceUnavailable: 'Price information unavailable.',
    medicinePriceVaryNote: 'Price may vary by pharmacy and location.',
    medicineSource: 'Information source',
    medicineLastUpdated: 'Last updated',
    medicineEducationalNote: 'For educational purposes only. Discuss treatment decisions with a qualified healthcare professional.',
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
    loadingUploadingPrescription: 'প্রেসক্রিপশন আপলোড করা হচ্ছে...',
    loadingReadingPrescription: 'প্রেসক্রিপশন পড়া হচ্ছে...',
    loadingUnderstandingPrescription: 'প্রেসক্রিপশন বিশ্লেষণ করা হচ্ছে...',
    loadingPreparingMedicines: 'পর্যালোচনার জন্য ওষুধ প্রস্তুত করা হচ্ছে...',
    retryOcr: 'আবার স্ক্যান করুন',
    extractionSourceLabel: 'সাজানো হয়েছে',
    extractionGemini: 'প্রেসক্রিপশন এ আই',
    extractionRuleBased: 'সরাসরি টেক্সট বিশ্লেষণ',
    ocrEngineLabel: 'পড়া হয়েছে',
    missingFieldsAlert: 'ওষুধের তথ্য অসম্পূর্ণ',
    missingFieldsMsg:
      'প্রতিটি ওষুধের জন্য নাম, পাওয়ার/মাত্রা এবং সেবনের নিয়ম প্রয়োজন। প্রেসক্রিপশনে যা লেখা আছে সেটিই লিখুন — মেডিটক কখনো অনুমান করে মান বসায় না।',
    duplicateTitle: 'প্রেসক্রিপশন ইতিমধ্যে সংরক্ষিত',
    duplicateMsg:
      'একই প্রেসক্রিপশন আপনার রেকর্ডে আগেই আছে। ইতিহাস থেকে সেটি খুলুন, অথবা এটি ভিন্ন প্রেসক্রিপশন হলে নতুন কপি হিসেবে সংরক্ষণ করুন।',
    saveAnyway: 'তবুও সংরক্ষণ করুন',
    namelessMedicineAlert: 'ওষুধের নাম নেই',
    namelessMedicineMsg:
      'নাম ছাড়া ওষুধ সংরক্ষণ করা যায় না বা তার রিমাইন্ডার তৈরি হয় না। প্রেসক্রিপশনে লেখা নাম যোগ করুন, অথবা সেই সারিটি মুছে ফেলুন।',
    incompleteWarningTitle: 'কিছু তথ্য পড়া যায়নি',
    incompleteWarningMsg:
      'মেডিটক কোনো মান অনুমান করে বসায় না। নিচের ওষুধগুলোর পাওয়ার/মাত্রা বা সেবনের নিয়ম পাওয়া যায়নি, তাই সেগুলো “মাত্রা পড়া যায়নি” হিসেবে এবং সকাল ০৮:০০ টায় একটি রিমাইন্ডার দিয়ে সংরক্ষণ করা হবে। পরে সম্পাদনা করতে পারবেন।',
    keepEditing: 'সম্পাদনা চালিয়ে যান',
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
    tabGuide: 'স্বাস্থ্য চ্যাট',
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

    // Health Chat & Disease Directory
    healthGuide: 'স্বাস্থ্য চ্যাট',
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

    // Emergency Service
    emergencyAssistance: 'জরুরি সেবা',
    emergencySubtitle: 'নিকটস্থ হাসপাতাল ও এক ট্যাপে জরুরি কল',

    // Doctor Updates (patient dashboard)
    doctorUpdates: 'ডাক্তারের আপডেট',
    noDoctorUpdates: 'এখনো কোনো আপডেট নেই।',
    doctorOnline: 'অনলাইন',

    // Find Doctors (patient dashboard)
    findDoctors: 'ডাক্তার খুঁজুন',
    findDoctorsSubtitle: 'এখন অনলাইনে থাকা ডাক্তারকে কল, মেসেজ বা চ্যাট করুন',
    doctorsOnline: 'জন ডাক্তার অনলাইন',
    searchDoctors: 'নাম বা বিশেষত্ব দিয়ে খুঁজুন...',
    noDoctorsFound: 'আপনার অনুসন্ধানের সাথে কোনো ডাক্তার মেলেনি।',
    noDoctorsFoundSub: 'অন্য নাম বা বিশেষত্ব দিয়ে চেষ্টা করুন।',
    onlineNow: 'অনলাইন',
    offlineNow: 'অফলাইন',
    call: 'কল',
    message: 'মেসেজ',
    seeAllDoctors: 'সব ডাক্তার দেখুন',

    // Profile editing
    editProfile: 'প্রোফাইল সম্পাদনা',
    editProfileSubtitle: 'আপনার ছবি ও ব্যক্তিগত তথ্য হালনাগাদ করুন',
    changePhoto: 'ছবি পরিবর্তন করুন',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    profileSaved: 'প্রোফাইল সফলভাবে হালনাগাদ হয়েছে।',
    profileSaveFailed: 'প্রোফাইল হালনাগাদ করা যায়নি। আবার চেষ্টা করুন।',
    fullName: 'পুরো নাম',
    emailLabel: 'ইমেইল',
    phoneLabel: 'ফোন নম্বর',
    genderLabel: 'লিঙ্গ',
    bloodGroupLabel: 'রক্তের গ্রুপ',
    dateOfBirthLabel: 'জন্মতারিখ',
    emergencyContactLabel: 'জরুরি যোগাযোগ নম্বর',

    // Reminder notification settings
    notificationSettings: 'রিমাইন্ডার নোটিফিকেশন',
    notificationSettingsSubtitle: 'ওষুধের রিমাইন্ডার কীভাবে পাবেন তা নির্বাচন করুন',
    medicineReminders: 'ওষুধের রিমাইন্ডার',
    medicineRemindersDesc: 'প্রতিটি নির্ধারিত ডোজের জন্য দৈনিক অ্যালার্ম',
    reminderSound: 'রিমাইন্ডার সাউন্ড',
    reminderSoundDesc: 'রিমাইন্ডার ও ইনকামিং কলে সাউন্ড বাজাবে',
    reminderVibration: 'কম্পন (ভাইব্রেশন)',
    reminderVibrationDesc: 'রিমাইন্ডার ও ইনকামিং কলে ফোন কম্পন করবে',
    reminderVoiceReadout: 'ভয়েস পড়ে শোনানো',
    reminderVoiceReadoutDesc: 'রিমাইন্ডার আপনার ভাষায় উচ্চস্বরে পড়ে শোনাবে',
    sendTestReminder: 'টেস্ট রিমাইন্ডার পাঠান',
    testReminderTitle: 'টেস্ট রিমাইন্ডার',
    testReminderBody: 'রিমাইন্ডার কাজ করছে। পরবর্তী ডোজের সময় নির্ধারিত সময়ে অ্যালার্ট পাবেন।',
    notificationPermissionNeeded: 'রিমাইন্ডারের জন্য নোটিফিকেশন অনুমতি প্রয়োজন। সিস্টেম সেটিংসে Meditalk-এর জন্য নোটিফিকেশন চালু করুন।',
    customTimesHint: 'ওষুধ যোগ করার সময় নিজের পছন্দের রিমাইন্ডার সময় যোগ করতে পারেন।',
    addReminderTime: '+ রিমাইন্ডার সময় যোগ করুন',

    // Health chat (AI assistant)
    aiChatTitle: 'এআই স্বাস্থ্য সহকারী',
    aiChatSubtitle: 'লক্ষণ, ওষুধ বা ঘরোয়া যত্ন সম্পর্কে জিজ্ঞাসা করুন',
    aiGreeting: 'আমি আপনার এআই স্বাস্থ্য সহকারী। আপনার লক্ষণ বা চিকিৎসা সংক্রান্ত প্রশ্ন বাংলা বা ইংরেজিতে লিখুন — আমি দিকনির্দেশনা দেব।',
    aiThinking: 'ভাবছি…',
    aiInputPlaceholder: 'আপনার লক্ষণ বা প্রশ্ন লিখুন…',
    aiDisclaimer: 'এই এআই নির্দেশনা শিক্ষামূলক, এটি রোগ নির্ণয় নয়। চিকিৎসা সিদ্ধান্তের জন্য সর্বদা যোগ্য চিকিৎসকের পরামর্শ নিন।',
    aiRelatedConditions: 'সম্পর্কিত রোগ',
    aiEmergencyTitle: 'এটি জরুরি পরিস্থিতি হতে পারে',
    aiEmergencyBody: 'অবিলম্বে ৯৯৯-এ কল করুন অথবা জরুরি সেবা খুলুন। অপেক্ষা করবেন না।',
    askAiAction: 'এআইকে জিজ্ঞাসা',
    directoryAction: 'গাইড দেখুন',
    aiSuggestFever: 'আমার জ্বর আছে',
    aiSuggestHeadache: '২ দিন ধরে মাথাব্যথা',
    aiSuggestStomach: 'পেট ব্যথা',
    aiSuggestBreathing: 'শ্বাস নিতে কষ্ট হচ্ছে',
    aiSuggestMedicine: 'ওষুধ কীভাবে খাব?',
    aiNoMatch: 'মিল পাওয়া যায়নি। লক্ষণটি অন্যভাবে লিখুন, অথবা স্বাস্থ্য চ্যাটের ডিরেক্টরি দেখুন।',

    // Calls & realtime
    callHistory: 'কল ইতিহাস',
    calls: 'কল',
    incomingCall: 'ইনকামিং কল',
    outgoingCall: 'আউটগোয়িং',
    missedCall: 'মিসড',
    declinedCall: 'প্রত্যাখ্যাত',
    callEnded: 'কল শেষ',
    ringing: 'রিং হচ্ছে…',
    connecting: 'সংযুক্ত হচ্ছে…',
    connected: 'সংযুক্ত',
    acceptCall: 'রিসিভ',
    declineCall: 'প্রত্যাখ্যান',
    endCall: 'কল শেষ করুন',
    audioCall: 'অডিও কল',
    videoCall: 'ভিডিও কল',
    noCallHistory: 'এখনো কোনো কল নেই।',
    callBack: 'আবার কল করুন',
    typing: 'লিখছেন…',
    peerOffline: 'এখন অফলাইনে আছেন',
    mediaPending: 'অডিও ও ভিডিও এখানে সংযুক্ত হবে',
    mute: 'মিউট',
    unmute: 'আনমিউট',
    speaker: 'স্পিকার',
    liveChat: 'লাইভ চ্যাট',
    mediaStarting: 'ক্যামেরা ও মাইক চালু হচ্ছে…',
    mediaLive: 'লাইভ অডিও ও ভিডিও',
    mediaFailed: 'মিডিয়া সংযোগ ব্যর্থ হয়েছে',
    mediaHint: 'উভয় পক্ষ লাইভ অডিও ও ভিডিও পাঠাচ্ছে',
    devBuildTitle: 'ইন-অ্যাপ কলে ডেভেলপমেন্ট বিল্ড প্রয়োজন',

    // Medicine Details (general online info — additive feature)
    medicineDetailsTitle: 'ওষুধের বিবরণ',
    medicineInfoLoading: 'ওষুধের তথ্য লোড হচ্ছে...',
    medicineInfoNotFound: 'ওষুধের তথ্য পাওয়া যায়নি।',
    medicineInfoNotFoundSub: 'আমরা এই ওষুধের জন্য নির্ভরযোগ্য তথ্য খুঁজে পাইনি।',
    medicineInfoLoadFailed: 'অনলাইন ওষুধের তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।',
    medicineInfoRetry: 'আবার চেষ্টা করুন',
    medicineYourPrescription: 'আপনার প্রেসক্রিপশন',
    medicineScheduleLabel: 'সময়সূচি',
    medicineMealLabel: 'খাবার',
    medicineFromPrescriptionNote: 'এই তথ্য আপনার প্রেসক্রিপশন থেকে নেওয়া। অনলাইন তথ্য এটিকে পরিবর্তন করে না।',
    medicineAbout: 'এই ওষুধ সম্পর্কে',
    medicineUses: 'ব্যবহার',
    medicineUsesSub: 'কেন ব্যবহৃত হয়?',
    medicineDosageInfo: 'সাধারণ ডোজ তথ্য',
    medicineSideEffects: 'সাধারণ পার্শ্বপ্রতিক্রিয়া',
    medicineWarnings: 'সতর্কতা',
    medicineContraindications: 'যেসব ক্ষেত্রে নিষিদ্ধ',
    medicineInteractions: 'ওষুধের মিথস্ক্রিয়া',
    medicineStorage: 'সংরক্ষণ',
    medicinePrice: 'মূল্য',
    medicinePriceUnavailable: 'মূল্য তথ্য পাওয়া যায়নি।',
    medicinePriceVaryNote: 'ফার্মেসি ও এলাকাভেদে মূল্য ভিন্ন হতে পারে।',
    medicineSource: 'তথ্যের উৎস',
    medicineLastUpdated: 'সর্বশেষ হালনাগাদ',
    medicineEducationalNote: 'শিক্ষামূলক তথ্য — চিকিৎসা সিদ্ধান্ত সবসময় যোগ্য চিকিৎসকের সাথে আলোচনা করুন।',
  },
};
