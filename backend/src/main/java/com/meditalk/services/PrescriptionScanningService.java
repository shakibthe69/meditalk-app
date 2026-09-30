package com.meditalk.services;

import com.meditalk.dto.ExtractedMedicineDto;
import com.meditalk.dto.OcrParseResponse;
import com.meditalk.exceptions.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates the prescription scanning pipeline:
 *
 * <pre>
 * image -> preprocessing -> OCR (OCR.space, Google Cloud Vision as backup)
 *       -> Gemini structured extraction (validated)
 *       -> deterministic parser fallback
 *       -> editable draft for the patient to review
 * </pre>
 *
 * <p>The draft returned here is never medical record data on its own: it is a
 * suggestion the patient must review, edit and confirm in the app.</p>
 */
@Service
public class PrescriptionScanningService {

    private static final Logger log = LoggerFactory.getLogger(PrescriptionScanningService.class);

    private static final String SAFETY_DISCLAIMER =
            "Meditalk organises the text it can read from your prescription. It is not a diagnosis and "
                    + "does not replace your doctor's advice. Please check every medicine, dose and time "
                    + "against the original prescription before saving.";

    private final PrescriptionOcrService ocrSpaceService;
    private final GoogleCloudVisionOcrService visionOcrService;
    private final ImagePreprocessingService preprocessingService;
    private final FileStorageService fileStorageService;
    private final GeminiPrescriptionExtractionService extractionService;
    private final OcrAiParserService ruleBasedParser;

    public PrescriptionScanningService(PrescriptionOcrService ocrSpaceService,
                                       GoogleCloudVisionOcrService visionOcrService,
                                       ImagePreprocessingService preprocessingService,
                                       FileStorageService fileStorageService,
                                       GeminiPrescriptionExtractionService extractionService,
                                       OcrAiParserService ruleBasedParser) {
        this.ocrSpaceService = ocrSpaceService;
        this.visionOcrService = visionOcrService;
        this.preprocessingService = preprocessingService;
        this.fileStorageService = fileStorageService;
        this.extractionService = extractionService;
        this.ruleBasedParser = ruleBasedParser;
    }

    /** A scanned draft plus metadata about how it was produced. */
    public static class ScanResult {
        private final OcrParseResponse draft;
        private final String ocrEngine;

        ScanResult(OcrParseResponse draft, String ocrEngine) {
            this.draft = draft;
            this.ocrEngine = ocrEngine;
        }

        public OcrParseResponse getDraft() { return draft; }
        public String getOcrEngine() { return ocrEngine; }
    }

    /**
     * Full pipeline for an uploaded prescription image. The image is stored once for
     * the user's record; nothing is written to the medical tables here.
     */
    public ScanResult scan(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Prescription image file is required.");
        }

        String imageUrl = fileStorageService.storeFile(file);
        ImagePreprocessingService.PreprocessedImageResult preprocessed = preprocessingService.preprocess(file);

        String ocrText = null;
        String ocrEngine = null;
        String primaryError = null;
        List<String> detectedLanguages = List.of("en");
        double confidence = 0.9;

        // 1. Primary: OCR.space
        if (ocrSpaceService.isConfigured()) {
            PrescriptionOcrService.OcrSpaceResult result = ocrSpaceService.extractText(
                    preprocessed.getImageBytes(), preprocessed.getMimeType(), file.getOriginalFilename());
            if (result.isSuccess()) {
                ocrText = result.getFullText();
                ocrEngine = "ocr.space";
                detectedLanguages = List.of(ocrSpaceService.getLanguage());
                log.info("OCR completed using OCR.space.");
            } else {
                primaryError = result.getErrorMessage();
                log.warn("OCR.space did not return text; trying the backup OCR engine.");
            }
        } else {
            log.info("OCR.space is not configured; using the backup OCR engine.");
        }

        // 2. Backup: Google Cloud Vision (also better at mixed Bangla/English pages)
        if (ocrText == null) {
            GoogleCloudVisionOcrService.OcrTextResult visionResult =
                    visionOcrService.detectText(preprocessed.getImageBytes());
            if (visionResult.isSuccess() && visionResult.getFullText() != null
                    && !visionResult.getFullText().isBlank()) {
                ocrText = visionResult.getFullText();
                ocrEngine = "google-cloud-vision";
                detectedLanguages = visionResult.getDetectedLanguages().isEmpty()
                        ? List.of("en") : visionResult.getDetectedLanguages();
                confidence = visionResult.getConfidenceScore();
                log.info("OCR completed using Google Cloud Vision.");
            } else if (primaryError == null) {
                primaryError = visionResult.getErrorMessage();
            }
        }

        // 3. No OCR text: read the prescription straight from the image with Gemini,
        //    which is multimodal. This keeps scanning working with a single AI
        //    credential and no separate OCR provider.
        if (ocrText == null || ocrText.isBlank()) {
            if (extractionService.isConfigured()) {
                log.info("No OCR text available; reading the prescription image directly with Gemini vision.");
                GeminiPrescriptionExtractionService.ExtractionResult vision =
                        extractionService.extractFromImage(preprocessed.getImageBytes(), preprocessed.getMimeType());

                if (vision.isSuccess() && vision.getParsed() != null) {
                    OcrParseResponse visionDraft = fromAi(vision.getParsed(), "", imageUrl,
                            preprocessed.getSummary(), detectedLanguages, 0.85, "gemini-vision");
                    visionDraft.setOcrEngine("gemini-vision");
                    visionDraft.setExtractionSource("gemini");
                    visionDraft.setRequiresUserVerification(true);
                    String visionNote = "Read directly from the image by the AI. Please verify every "
                            + "medicine, dose and time before saving.";
                    String existingNotes = visionDraft.getNotes();
                    visionDraft.setNotes(existingNotes == null || existingNotes.isBlank()
                            ? visionNote : existingNotes + " " + visionNote);
                    log.info("Gemini vision read {} medicine(s) from the image.",
                            vision.getParsed().getMedicines().size());
                    return new ScanResult(visionDraft, "gemini-vision");
                }

                if (vision.getErrorMessage() != null && !vision.getErrorMessage().isBlank()) {
                    primaryError = vision.getErrorMessage();
                }
            }

            throw new BadRequestException(primaryError != null && !primaryError.isBlank()
                    ? primaryError
                    : "We could not read any text from this prescription. Please try a clearer, brighter photo.");
        }

        return new ScanResult(
                buildDraft(ocrText, imageUrl, preprocessed.getSummary(), detectedLanguages, confidence, ocrEngine),
                ocrEngine
        );
    }

    /**
     * Structure text the user typed or pasted themselves (no OCR step involved).
     */
    public ScanResult analyzeText(String rawText, String imageUrl) {
        if (rawText == null || rawText.isBlank()) {
            throw new BadRequestException("Prescription text is required.");
        }
        return new ScanResult(
                buildDraft(rawText, imageUrl, "Provided as text", List.of("en", "bn"), 0.9, "user-provided-text"),
                "user-provided-text"
        );
    }

    /**
     * Runs the prescription AI over the OCR text, falling back to the deterministic
     * parser when the AI is unavailable or returns nothing usable.
     */
    private OcrParseResponse buildDraft(String ocrText,
                                        String imageUrl,
                                        String preprocessingSummary,
                                        List<String> detectedLanguages,
                                        double confidence,
                                        String ocrEngine) {

        List<String> notes = new ArrayList<>();
        String extractionSource = "rule-based";

        OcrParseResponse draft = null;

        if (extractionService.isConfigured()) {
            GeminiPrescriptionExtractionService.ExtractionResult ai = extractionService.extract(ocrText);
            if (ai.isSuccess() && ai.getParsed() != null && !ai.getParsed().getMedicines().isEmpty()) {
                draft = fromAi(ai.getParsed(), ocrText, imageUrl, preprocessingSummary,
                        detectedLanguages, confidence, ocrEngine);
                extractionSource = "gemini";
            } else if (ai.isSuccess()) {
                notes.add("The AI did not find any medicine lines, so the text was parsed directly.");
            } else {
                log.info("Falling back to deterministic parsing: {}", ai.getErrorMessage());
                notes.add(ai.getErrorMessage());
            }
        } else {
            notes.add("Prescription AI analysis is not configured on the server; the text was parsed directly.");
        }

        if (draft == null) {
            draft = ruleBasedParser.parsePrescriptionTextWithMetadata(
                    ocrText, imageUrl, detectedLanguages, confidence, preprocessingSummary);
            draft.setExtractionSource("rule-based");
        } else {
            draft.setExtractionSource(extractionSource);
        }

        draft.setOcrEngine(ocrEngine);
        if (!notes.isEmpty()) {
            String aiNotes = String.join(" ", notes);
            String existing = draft.getNotes();
            draft.setNotes(existing == null || existing.isBlank() ? aiNotes : existing + " " + aiNotes);
        }
        return draft;
    }

    private OcrParseResponse fromAi(PrescriptionExtractionValidator.ParsedPrescription parsed,
                                    String ocrText,
                                    String imageUrl,
                                    String preprocessingSummary,
                                    List<String> detectedLanguages,
                                    double confidence,
                                    String ocrEngine) {

        List<ExtractedMedicineDto> medicines = new ArrayList<>();
        for (ExtractedMedicineDto med : parsed.getMedicines()) {
            // Pre-compute editable reminder slots from the stated schedule only.
            ruleBasedParser.buildSchedulesForMedicine(med);
            medicines.add(med);
        }

        String prescriptionDate = parsed.getPrescriptionDate();
        if (prescriptionDate == null) {
            prescriptionDate = LocalDate.now().toString();
        }

        return OcrParseResponse.builder()
                .doctorName(parsed.getDoctorName())
                .hospitalOrClinic(parsed.getHospitalOrClinic())
                .prescriptionDate(prescriptionDate)
                .diagnosis(parsed.getDiagnosis())
                .rawOcrText(ocrText)
                .imageUrl(imageUrl)
                .medicines(medicines)
                .detectedLanguages(detectedLanguages)
                .confidenceScore(confidence)
                .preprocessingSummary(preprocessingSummary)
                .extractionSource("gemini")
                .notes(parsed.getNotes() != null
                        ? parsed.getNotes()
                        : "AI structured draft. Please verify every medicine, dose and time before saving.")
                .requiresUserVerification(true)
                .safetyDisclaimer(SAFETY_DISCLAIMER)
                .build();
    }

    public String getSafetyDisclaimer() {
        return SAFETY_DISCLAIMER;
    }
}
