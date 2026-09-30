package com.meditalk.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditalk.entities.MedicineInformationCache;
import com.meditalk.repositories.MedicineInformationCacheRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * General (educational) medicine information, fetched from trusted structured
 * drug-label sources — DailyMed and openFDA — and cached in the local database.
 *
 * <p>This service is strictly additive to MediTalk's prescription data: it never
 * writes to {@code medicines} and never overrides a user's prescribed dose. It
 * normalizes OCR medicine spellings (brand names, misspellings, strengths) to a
 * generic ingredient, resolves the drug label, and caches the normalized result
 * in {@code medicine_information_cache} so external APIs are not called on
 * every view.</p>
 *
 * <p>Bangladesh retail price is NOT available from DailyMed/openFDA, so the
 * service simply reports that price is unavailable instead of fabricating one.</p>
 */
@Service
public class MedicineInformationService {

    private static final Logger log = LoggerFactory.getLogger(MedicineInformationService.class);

    /** Cache entries older than this are refreshed on the next view. */
    private static final Duration CACHE_TTL = Duration.ofDays(30);

    private static final String DAILYMED_SPLS_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json";
    private static final String DAILYMED_SPL_URL = "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/";
    private static final String OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json";
    private static final String DAILYMED_WEB_URL = "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final MedicineInformationCacheRepository cacheRepository;

    public MedicineInformationService(MedicineInformationCacheRepository cacheRepository) {
        this.cacheRepository = cacheRepository;
    }

    /** Normalized medicine information returned to the mobile client. */
    public static class MedicineInfo {
        public String queriedName;
        public String brandName;
        public String genericName;
        public String strength;
        public String dosageForm;
        public String description;
        public String uses;
        public String dosageInformation;
        public String sideEffects;
        public String warnings;
        public String contraindications;
        public String interactions;
        public String storage;
        public String source;
        public String sourceUrl;
        public String lastUpdated;
        public String price = null;          // never fabricated
        public String priceNote = "unavailable";
        public String disclaimer;
        public boolean found;
        public boolean cached = false;
    }

    /**
     * Main entry point: resolve general information for a medicine name as it
     * appears in the user's prescription (OCR spelling, brand name, strength).
     */
    public MedicineInfo getMedicineInfo(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            MedicineInfo empty = new MedicineInfo();
            empty.found = false;
            empty.disclaimer = buildDisclaimer("en");
            return empty;
        }

        String trimmed = rawName.trim();
        Normalized normalized = normalize(trimmed);

        // 1. Cache lookup keyed by the generic ingredient (fall back to the cleaned brand).
        String cacheKey = normalized.generic != null ? normalized.generic : normalized.cleanName;
        if (cacheKey == null || cacheKey.isBlank()) {
            MedicineInfo empty = new MedicineInfo();
            empty.queriedName = trimmed;
            empty.found = false;
            empty.disclaimer = buildDisclaimer("en");
            return empty;
        }

        Optional<MedicineInformationCache> cached = cacheRepository.findByLookupKey(cacheKey.toLowerCase());
        if (cached.isPresent() && !isStale(cached.get())) {
            MedicineInfo info = toInfo(cached.get(), trimmed);
            info.cached = true;
            return info;
        }

        // 2. Resolve against trusted sources: try the cleaned name first (with
        //    strength), then the brand without strength, then the generic.
        List<String> candidates = buildSearchCandidates(normalized);
        for (String candidate : candidates) {
            MedicineInfo info = fetchFromSources(candidate, normalized, trimmed);
            if (info != null && info.found) {
                saveCache(cacheKey, info);
                return info;
            }
        }

        // 3. Not found: never invent information.
        MedicineInfo notFound = new MedicineInfo();
        notFound.queriedName = trimmed;
        notFound.found = false;
        notFound.disclaimer = buildDisclaimer("en");
        return notFound;
    }

    // ------------------------------------------------------------------
    // Normalization
    // ------------------------------------------------------------------

    private static class Normalized {
        String cleanName;   // name without strength / form words
        String generic;     // resolved generic ingredient, if known
        String strength;    // e.g. "500 mg"
        String form;        // e.g. "Tablet"
    }

    /** Common dosage-form words that appear in OCR names. */
    private static final Pattern FORM_PATTERN = Pattern.compile(
            "\\b(tablets?|tabs?|capsules?|caps?|syrup|susp(ension)?|injection|inj\\.?|drops?|cream|ointment|gel|sachet|sachets|suppository|iv\\.?|im\\.?)\\b",
            Pattern.CASE_INSENSITIVE);

    /** Strength such as 500mg, 500 mg, 5mg/5ml, 2.5mg. */
    private static final Pattern STRENGTH_PATTERN = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*(mg|mcg|g|gm|iu|ml|%)((\\s*/\\s*\\d+(?:[.,]\\d+)?)?\\s*(mg|mcg|g|ml|%))?",
            Pattern.CASE_INSENSITIVE);

    /**
     * Common Bangladesh / regional brand names mapped to their generic
     * ingredient. OCR often reads a brand ("Napa", "Nappa", "NAPA-500") that
     * the international label sources know under the generic name only.
     */
    private static final Map<String, String> BRAND_TO_GENERIC = buildBrandMap();

    private static Map<String, String> buildBrandMap() {
        Map<String, String> m = new LinkedHashMap<>();
        // Analgesics / antipyretics
        m.put("napa", "paracetamol");
        m.put("nappa", "paracetamol");
        m.put("ace", "paracetamol");
        m.put("parama", "paracetamol");
        m.put("ecopa", "paracetamol");
        m.put("acejr", "paracetamol");
        m.put("brufen", "ibuprofen");
        m.put("flamyd", "ibuprofen");
        m.put("ibucil", "ibuprofen");
        m.put("fenidin", "ibuprofen");
        m.put("disprin", "aspirin");
        m.put("ecospirin", "aspirin");
        m.put("keticin", "ketorolac");
        // Antibiotics
        m.put("amoxin", "amoxicillin");
        m.put("moxacil", "amoxicillin");
        m.put("amoxisol", "amoxicillin");
        m.put("septrin", "sulfamethoxazole");
        m.put("cotrim-v", "sulfamethoxazole");
        m.put("zimax", "azithromycin");
        m.put("azithral", "azithromycin");
        m.put("zia", "azithromycin");
        m.put("cephin", "ceftriaxone");
        m.put("cef-3", "cefixime");
        m.put("maxcef", "cefixime");
        m.put("cefotil", "cefixime");
        m.put("cidoflox", "ciprofloxacin");
        m.put("ciprocin", "ciprofloxacin");
        m.put("flexiwin", "ciprofloxacin");
        m.put("monas", "montelukast");
        m.put("fexo", "fexofenadine");
        m.put("fexet", "fexofenadine");
        m.put("alin", "fexofenadine");
        m.put("certriaz", "cetirizine");
        m.put("sifrol", "cetirizine");
        m.put("ketotif", "ketotifen");
        m.put("titracil", "cetirizine");
        // Gastro / metabolic
        m.put("omefix", "omeprazole");
        m.put("losectil", "omeprazole");
        m.put("seclo", "omeprazole");
        m.put("proloc", "pantoprazole");
        m.put("pantonix", "pantoprazole");
        m.put("anzen", "pantoprazole");
        m.put("emax", "esomeprazole");
        m.put("sompraz", "esomeprazole");
        m.put("anti-loc", "esomeprazole");
        m.put("mozal", "domperidone");
        m.put("domin", "domperidone");
        m.put("motigut", "domperidone");
        m.put("maxpro", "esomeprazole");
        m.put("totonin", "metoclopramide");
        // Cardiovascular / diabetes
        m.put("amlodipin", "amlodipine");
        m.put("amlovas", "amlodipine");
        m.put("amlova", "amlodipine");
        m.put("calcigard", "nifedipine");
        m.put(" aten", "atenolol");
        m.put("tenormin", "atenolol");
        m.put("carca", "carvedilol");
        m.put("lopress", "metoprolol");
        m.put("rilos", "losartan");
        m.put("losatan", "losartan");
        m.put("contec", "losartan");
        m.put("telsar", "telmisartan");
        m.put("temis", "telmisartan");
        m.put("ramor", "ramipril");
        m.put("cardace", "ramipril");
        m.put("glycomet", "metformin");
        m.put("comet", "metformin");
        m.put("sitablet", "metformin");
        m.put("insul", "insulin");
        m.put("glimepiride", "glimepiride");
        m.put("getryl", "glimepiride");
        m.put("amlod", "amlodipine");
        // Vitamins / supplements
        m.put("zinctron", "multivitamin");
        m.put("vitacid", "vitamin c");
        m.put("folic", "folic acid");
        m.put("or saline", "oral rehydration salt");
        m.put("or salinef", "oral rehydration salt");
        m.put("orsaline", "oral rehydration salt");
        m.put("fero-s", "ferrous sulfate");
        m.put("ferric", "iron");
        // Respiratory
        m.put("sultolin", "salbutamol");
        m.put("ventolin", "salbutamol");
        m.put("ophyllin", "aminophylline");
        m.put("a-methapterin", "aminophylline");
        // Steroids
        m.put("solomet", "methylprednisolone");
        m.put("dexa", "dexamethasone");
        m.put("pred", "prednisolone");
        return m;
    }

    private Normalized normalize(String rawName) {
        Normalized n = new Normalized();
        String name = rawName == null ? "" : rawName.trim();

        // Extract strength before removing anything else.
        String strength = null;
        Matcher strengthMatcher = STRENGTH_PATTERN.matcher(name);
        if (strengthMatcher.find()) {
            strength = strengthMatcher.group().replaceAll("\\s+", "").replace(",", ".");
        }
        n.strength = strength;

        // Remove strength + form words.
        String cleaned = name;
        if (strength != null) {
            cleaned = cleaned.replace(strengthMatcher.group(), " ");
        }
        cleaned = FORM_PATTERN.matcher(cleaned).replaceAll(" ");
        // Hyphens/dots used by OCR like "NAPA-500", "Cef-3".
        cleaned = cleaned.replaceAll("[^\\p{L}\\p{Nd} ]+", " ");
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        n.cleanName = cleaned;

        // Try to resolve the generic through the brand map (exact, then prefix).
        String lower = cleaned.toLowerCase();
        String generic = BRAND_TO_GENERIC.get(lower);
        if (generic == null) {
            for (Map.Entry<String, String> e : BRAND_TO_GENERIC.entrySet()) {
                String brand = e.getKey();
                if (lower.startsWith(brand) || lower.contains(brand)) {
                    generic = e.getValue();
                    break;
                }
            }
        }

        // If the name itself already is a generic ingredient, keep it.
        if (generic == null && isLikelyGeneric(lower)) {
            generic = lower;
        }

        n.generic = generic;

        // Dosage form detection (for display only).
        String lowerRaw = name.toLowerCase();
        if (lowerRaw.contains("syrup")) n.form = "Syrup";
        else if (lowerRaw.contains("caps")) n.form = "Capsule";
        else if (lowerRaw.contains("inj") || lowerRaw.contains("iv") || lowerRaw.contains("im")) n.form = "Injection";
        else if (lowerRaw.contains("susp")) n.form = "Suspension";
        else if (lowerRaw.contains("drop")) n.form = "Drops";
        else if (lowerRaw.contains("cream") || lowerRaw.contains("ointment") || lowerRaw.contains("gel")) n.form = "Topical";
        else if (lowerRaw.contains("tab")) n.form = "Tablet";
        else n.form = null;

        return n;
    }

    private static final List<String> KNOWN_GENERICS = List.of(
            "paracetamol", "acetaminophen", "ibuprofen", "aspirin", "amoxicillin", "azithromycin",
            "ciprofloxacin", "cefixime", "ceftriaxone", "metformin", "glimepiride", "insulin",
            "amlodipine", "atenolol", "losartan", "telmisartan", "ramipril", "omeprazole",
            "pantoprazole", "esomeprazole", "domperidone", "metoclopramide", "cetirizine",
            "fexofenadine", "montelukast", "salbutamol", "prednisolone", "dexamethasone",
            "folic acid", "iron", "ferrous sulfate", "multivitamin", "vitamin c",
            "oral rehydration salt", "metronidazole", "diclofenac", "tramadol", "clopidogrel",
            "atorvastatin", "warfarin", "levothyroxine", "vitamin d", "calcium", "zinc");

    private boolean isLikelyGeneric(String lower) {
        if (lower == null || lower.isBlank()) return false;
        for (String g : KNOWN_GENERICS) {
            if (lower.contains(g)) return true;
        }
        return false;
    }

    /**
     * Generic ingredient names differ between the international (BP/INN) naming
     * MediTalk users see — e.g. "paracetamol" — and the US naming used by
     * openFDA/DailyMed — e.g. "acetaminophen". Map the common ones so a valid
     * generic is not wrongly reported as "not found".
     */
    private static final Map<String, String> GENERIC_SYNONYMS = buildSynonymMap();

    private static Map<String, String> buildSynonymMap() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("paracetamol", "acetaminophen");
        m.put("adrenaline", "epinephrine");
        m.put("noradrenaline", "norepinephrine");
        m.put("lidocaine", "lignocaine");
        m.put("amoxycillin", "amoxicillin");
        m.put("meptazinol", "meptazinol");
        m.put("carteolol", "carteolol");
        m.put("frusemide", "furosemide");
        m.put("chlorpheniramine", "chlorphenamine");
        m.put("vitamin c", "ascorbic acid");
        m.put("vitamin d", "cholecalciferol");
        m.put("vitamin b1", "thiamine");
        m.put("vitamin b6", "pyridoxine");
        m.put("vitamin b12", "cyanocobalamin");
        m.put("iron", "ferrous sulfate");
        return m;
    }

    /** Build the list of search terms to try, in order. */
    private List<String> buildSearchCandidates(Normalized n) {
        List<String> candidates = new ArrayList<>();
        if (n.cleanName != null && !n.cleanName.isBlank()) {
            candidates.add(n.cleanName);
        }
        if (n.generic != null && !n.generic.isBlank()) {
            if (!n.generic.equalsIgnoreCase(n.cleanName)) {
                candidates.add(n.generic);
            }
            // Also try the US-named synonym (paracetamol -> acetaminophen).
            String synonym = GENERIC_SYNONYMS.get(n.generic.toLowerCase());
            if (synonym != null && !candidates.contains(synonym)) {
                candidates.add(synonym);
            }
        }
        // Brand without any strength digits ("Cef 3" -> "Cef").
        if (n.cleanName != null) {
            String digitsStripped = n.cleanName.replaceAll("\\b\\d+\\b", "").replaceAll("\\s+", " ").trim();
            if (!digitsStripped.isBlank() && !candidates.contains(digitsStripped)) {
                candidates.add(digitsStripped);
            }
        }
        return candidates;
    }

    // ------------------------------------------------------------------
    // External source calls (DailyMed first, then openFDA)
    // ------------------------------------------------------------------

    private MedicineInfo fetchFromSources(String searchTerm, Normalized normalized, String queriedName) {
        MedicineInfo info = fetchFromDailyMed(searchTerm);
        if (info == null) {
            info = fetchFromOpenFda(searchTerm);
        }
        if (info == null) {
            return null;
        }

        info.queriedName = queriedName;
        // Fill display fields from the user's own spelling when the source lacks them.
        if (info.strength == null || info.strength.isBlank()) {
            info.strength = normalized.strength;
        }
        if ((info.dosageForm == null || info.dosageForm.isBlank()) && normalized.form != null) {
            info.dosageForm = normalized.form;
        }
        if (normalized.generic != null && (info.genericName == null || info.genericName.isBlank())) {
            info.genericName = capitalize(normalized.generic);
        }
        if (info.brandName == null || info.brandName.isBlank()) {
            info.brandName = capitalize(normalized.cleanName);
        }
        info.found = hasMeaningfulContent(info);
        info.disclaimer = buildDisclaimer("en");
        return info;
    }

    private boolean hasMeaningfulContent(MedicineInfo info) {
        return notBlank(info.uses) || notBlank(info.description) || notBlank(info.dosageInformation)
                || notBlank(info.warnings) || notBlank(info.sideEffects)
                || notBlank(info.contraindications) || notBlank(info.interactions);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private MedicineInfo fetchFromDailyMed(String searchTerm) {
        try {
            String url = DAILYMED_SPLS_URL + "?drug_name="
                    + URLEncoder.encode(searchTerm, StandardCharsets.UTF_8) + "&pagesize=1";
            JsonNode root = getJson(url);
            if (root == null) return null;
            JsonNode data = root.path("data");
            if (!data.isArray() || data.isEmpty()) return null;

            String setid = data.get(0).path("setid").asText(null);
            if (setid == null || setid.isBlank()) return null;

            MedicineInfo info = new MedicineInfo();
            info.source = "DailyMed";
            info.sourceUrl = DAILYMED_WEB_URL + setid;

            // Structured label sections from the DailyMed SPL Web Service (v2 JSON).
            JsonNode sections = getJson(DAILYMED_SPL_URL + setid + "/sections.json");
            if (sections != null && sections.isArray()) {
                for (JsonNode section : sections) {
                    String title = section.path("title").asText("").toLowerCase();
                    String text = section.path("text").asText(null);
                    if (text == null || text.isBlank()) continue;
                    text = cleanLabel(text);
                    if (title.contains("indications")) {
                        info.uses = pick(info.uses, text);
                    } else if (title.contains("dosage") && title.contains("administration")) {
                        info.dosageInformation = pick(info.dosageInformation, text);
                    } else if (title.contains("adverse reactions")) {
                        info.sideEffects = pick(info.sideEffects, text);
                    } else if (title.contains("warning")) {
                        info.warnings = pick(info.warnings, text);
                    } else if (title.contains("contraindication")) {
                        info.contraindications = pick(info.contraindications, text);
                    } else if (title.contains("drug interaction")) {
                        info.interactions = pick(info.interactions, text);
                    } else if (title.contains("storage") || title.contains("handling")) {
                        info.storage = pick(info.storage, text);
                    } else if (title.contains("description")) {
                        info.description = pick(info.description, text);
                    }
                }
            }

            info.lastUpdated = LocalDate.now().toString();
            return hasMeaningfulContent(info) ? info : null;
        } catch (Exception e) {
            log.warn("DailyMed lookup failed for '{}': {}", searchTerm, e.getMessage());
            return null;
        }
    }

    private MedicineInfo fetchFromOpenFda(String searchTerm) {
        try {
            String url = OPENFDA_LABEL_URL + "?search=openfda.brand_name:%22"
                    + URLEncoder.encode(searchTerm, StandardCharsets.UTF_8) + "%22"
                    + "&limit=1";
            JsonNode root = getJson(url);
            if (root == null) return null;
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) {
                // Retry with generic_name.
                url = OPENFDA_LABEL_URL + "?search=openfda.generic_name:%22"
                        + URLEncoder.encode(searchTerm, StandardCharsets.UTF_8) + "%22&limit=1";
                root = getJson(url);
                if (root == null) return null;
                results = root.path("results");
                if (!results.isArray() || results.isEmpty()) return null;
            }
            JsonNode label = results.get(0);

            MedicineInfo info = new MedicineInfo();
            info.uses = firstOrNull(label, "indications_and_usage");
            info.dosageInformation = firstOrNull(label, "dosage_and_administration");
            info.sideEffects = firstOrNull(label, "adverse_reactions");
            info.warnings = firstOrNull(label, "warnings");
            info.contraindications = firstOrNull(label, "contraindications");
            info.interactions = firstOrNull(label, "drug_interactions");
            info.storage = firstOrNull(label, "storage_and_handling");
            info.description = firstOrNull(label, "description");

            JsonNode openfda = label.path("openfda");
            if (openfda.isObject()) {
                info.brandName = firstArrayValue(openfda, "brand_name");
                info.genericName = firstArrayValue(openfda, "generic_name");
                info.dosageForm = firstArrayValue(openfda, "dosage_form");
                String strengthRaw = firstArrayValue(openfda, "strength");
                if (strengthRaw != null && (info.strength == null || info.strength.isBlank())) {
                    info.strength = strengthRaw;
                }
            }
            info.source = "openFDA";
            info.sourceUrl = "https://open.fda.gov/data/downloads/";
            info.lastUpdated = LocalDate.now().toString();
            return hasMeaningfulContent(info) ? info : null;
        } catch (Exception e) {
            log.warn("openFDA lookup failed for '{}': {}", searchTerm, e.getMessage());
            return null;
        }
    }

    private JsonNode getJson(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            // 404 from openFDA simply means "no match" — that is normal.
            if (response.statusCode() != 404) {
                log.warn("External medicine API returned {} for {}", response.statusCode(), url);
            }
            return null;
        }
        return objectMapper.readTree(response.body());
    }

    private static String firstOrNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isTextual()) {
            return cleanLabel(value.asText());
        }
        if (value.isArray() && !value.isEmpty()) {
            return cleanLabel(value.get(0).asText());
        }
        return null;
    }

    private static String firstArrayValue(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isArray() && !value.isEmpty()) {
            return value.get(0).asText();
        }
        if (value.isTextual()) return value.asText();
        return null;
    }

    /** Truncate + tidy long label text so the mobile card stays readable. */
    private static String cleanLabel(String text) {
        if (text == null) return null;
        String cleaned = text.replaceAll("font\\s*size\\s*=\\s*\"?\\d+\"?", "")
                .replaceAll("<[^>]+>", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (cleaned.length() > 4000) {
            cleaned = cleaned.substring(0, 4000) + "…";
        }
        return cleaned.isBlank() ? null : cleaned;
    }

    /** Keep the first non-blank value (already-computed fields win). */
    private static String pick(String current, String candidate) {
        return notBlank(current) ? current : candidate;
    }

    private static String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    // ------------------------------------------------------------------
    // Cache
    // ------------------------------------------------------------------

    private boolean isStale(MedicineInformationCache cache) {
        if (cache.getUpdatedAt() == null) return true;
        return cache.getUpdatedAt().isBefore(java.time.LocalDateTime.now().minus(CACHE_TTL));
    }

    private void saveCache(String lookupKey, MedicineInfo info) {
        try {
            MedicineInformationCache cache = cacheRepository.findByLookupKey(lookupKey.toLowerCase())
                    .orElseGet(MedicineInformationCache::new);
            cache.setLookupKey(lookupKey.toLowerCase());
            apply(cache, info);
            cacheRepository.save(cache);
        } catch (Exception e) {
            // Cache write failures must never break the response.
            log.warn("Medicine info cache write failed: {}", e.getMessage());
        }
    }

    private void apply(MedicineInformationCache cache, MedicineInfo info) {
        cache.setBrandName(info.brandName);
        cache.setGenericName(info.genericName);
        cache.setStrength(info.strength);
        cache.setDosageForm(info.dosageForm);
        cache.setDescription(info.description);
        cache.setUses(info.uses);
        cache.setDosageInformation(info.dosageInformation);
        cache.setSideEffects(info.sideEffects);
        cache.setWarnings(info.warnings);
        cache.setContraindications(info.contraindications);
        cache.setInteractions(info.interactions);
        cache.setStorage(info.storage);
        cache.setSource(info.source);
        cache.setSourceUrl(info.sourceUrl);
        cache.setExternalLastUpdated(info.lastUpdated);
    }

    private MedicineInfo toInfo(MedicineInformationCache cache, String queriedName) {
        MedicineInfo info = new MedicineInfo();
        info.queriedName = queriedName;
        info.brandName = cache.getBrandName();
        info.genericName = cache.getGenericName();
        info.strength = cache.getStrength();
        info.dosageForm = cache.getDosageForm();
        info.description = cache.getDescription();
        info.uses = cache.getUses();
        info.dosageInformation = cache.getDosageInformation();
        info.sideEffects = cache.getSideEffects();
        info.warnings = cache.getWarnings();
        info.contraindications = cache.getContraindications();
        info.interactions = cache.getInteractions();
        info.storage = cache.getStorage();
        info.source = cache.getSource();
        info.sourceUrl = cache.getSourceUrl();
        info.lastUpdated = cache.getExternalLastUpdated();
        info.found = hasMeaningfulContent(info);
        info.disclaimer = buildDisclaimer("en");
        return info;
    }

    private static String buildDisclaimer(String language) {
        if ("bn".equalsIgnoreCase(language)) {
            return "এই তথ্য শুধুমাত্র সাধারণ শিক্ষামূলক উদ্দেশ্যে। এটি আপনার প্রেসক্রিপশনের বিকল্প নয়। ডোজ বা চিকিৎসা সংক্রান্ত সিদ্ধান্ত সবসময় যোগ্য চিকিৎসকের সাথে আলোচনা করুন।";
        }
        return "This information is educational only and is not a substitute for your prescription. Discuss any treatment decisions with a qualified healthcare professional.";
    }
}
