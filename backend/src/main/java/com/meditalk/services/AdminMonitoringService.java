package com.meditalk.services;

import com.meditalk.config.AdminProperties;
import com.meditalk.dto.AdminDtos;
import com.meditalk.dto.ChatEvent;
import com.meditalk.entities.AdminAuditLog;
import com.meditalk.entities.AdminContactLog;
import com.meditalk.entities.AdminFollowUp;
import com.meditalk.entities.AdminHelpRequest;
import com.meditalk.entities.AdminNote;
import com.meditalk.entities.DoctorAccount;
import com.meditalk.entities.Medicine;
import com.meditalk.entities.MedicineLog;
import com.meditalk.entities.MedicineSchedule;
import com.meditalk.entities.Prescription;
import com.meditalk.entities.User;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.AdminAuditLogRepository;
import com.meditalk.repositories.AdminContactLogRepository;
import com.meditalk.repositories.AdminFollowUpRepository;
import com.meditalk.repositories.AdminHelpRequestRepository;
import com.meditalk.repositories.AdminNoteRepository;
import com.meditalk.repositories.DoctorAccountRepository;
import com.meditalk.repositories.MedicineLogRepository;
import com.meditalk.repositories.MedicineRepository;
import com.meditalk.repositories.PrescriptionRepository;
import com.meditalk.repositories.UserRepository;
import com.meditalk.websocket.RealtimeHub;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Admin monitoring engine.
 *
 * <p>Every number shown to an administrator is derived from existing
 * {@code MedicineLog} / {@code User} data — no duplicate tracking system, no
 * hard-coded statistics. Two signals are kept deliberately separate:
 *
 * <ul>
 *   <li><b>App inactivity</b> — days since the account was last seen.</li>
 *   <li><b>Medication records</b> — TAKEN / MISSED / SKIPPED / UNCONFIRMED
 *       (a past-due PENDING log). A missed reminder is not proof of a missed
 *       medication, so PENDING stays "unconfirmed".</li>
 * </ul>
 *
 * <p>The combined result is an <em>administrative follow-up priority</em>
 * (NORMAL → MONITOR → FOLLOW_UP → HIGH_PRIORITY), never a medical diagnosis.
 * Thresholds come from {@link AdminProperties} (app.admin.* in application.yml).
 */
@Service
public class AdminMonitoringService {

    private static final Logger log = LoggerFactory.getLogger(AdminMonitoringService.class);

    private static final String ROLE_PATIENT = "ROLE_PATIENT";
    private static final List<String> PRIORITY_ORDER = List.of("NORMAL", "MONITOR", "FOLLOW_UP", "HIGH_PRIORITY");

    private static final DateTimeFormatter LOG_TIME_FORMAT = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a", Locale.US);

    /** scheduledTime is stored as e.g. "07:30 AM" (see MedicineLogService). */
    private static final DateTimeFormatter[] TIME_PATTERNS = {
            DateTimeFormatter.ofPattern("hh:mm a", Locale.US),
            DateTimeFormatter.ofPattern("h:mm a", Locale.US),
            DateTimeFormatter.ofPattern("HH:mm", Locale.US)
    };

    private final UserRepository userRepository;
    private final MedicineLogRepository medicineLogRepository;
    private final MedicineRepository medicineRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AdminFollowUpRepository followUpRepository;
    private final AdminContactLogRepository contactLogRepository;
    private final AdminNoteRepository noteRepository;
    private final AdminHelpRequestRepository helpRequestRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final DoctorAccountRepository doctorAccountRepository;
    private final AdminProperties props;
    private final RealtimeHub realtimeHub;

    public AdminMonitoringService(UserRepository userRepository,
                                  MedicineLogRepository medicineLogRepository,
                                  MedicineRepository medicineRepository,
                                  PrescriptionRepository prescriptionRepository,
                                  AdminFollowUpRepository followUpRepository,
                                  AdminContactLogRepository contactLogRepository,
                                  AdminNoteRepository noteRepository,
                                  AdminHelpRequestRepository helpRequestRepository,
                                  AdminAuditLogRepository auditLogRepository,
                                  DoctorAccountRepository doctorAccountRepository,
                                  AdminProperties props,
                                  RealtimeHub realtimeHub) {
        this.userRepository = userRepository;
        this.medicineLogRepository = medicineLogRepository;
        this.medicineRepository = medicineRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.followUpRepository = followUpRepository;
        this.contactLogRepository = contactLogRepository;
        this.noteRepository = noteRepository;
        this.helpRequestRepository = helpRequestRepository;
        this.auditLogRepository = auditLogRepository;
        this.doctorAccountRepository = doctorAccountRepository;
        this.props = props;
        this.realtimeHub = realtimeHub;
    }

    /**
     * All registered doctor accounts for the admin panel: professional profile,
     * contact details, availability and last-seen time. Read-only and never
     * includes credentials.
     */
    @Transactional(readOnly = true)
    public List<AdminDtos.DoctorSummary> listDoctors() {
        return doctorAccountRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        DoctorAccount::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(a -> new AdminDtos.DoctorSummary(
                        a.getId(),
                        a.getUser() != null ? a.getUser().getId() : null,
                        a.getFullName(),
                        a.getUser() != null ? a.getUser().getEmail() : null,
                        a.getSpecialization(),
                        a.getLicenseNumber(),
                        a.getHospitalOrClinic(),
                        a.getPhoneNumber(),
                        a.getChamberAddress(),
                        a.getVisitingHours(),
                        Boolean.TRUE.equals(a.getIsAvailable()),
                        a.getCreatedAt(),
                        a.getLastActiveAt()))
                .toList();
    }

    // =====================================================================
    // Signal computation
    // =====================================================================

    /** Everything we know about one patient, recomputed on read. */
    public record Signals(
            User patient,
            int inactiveDays,
            int scheduled,
            int taken,
            int missed,
            int skipped,
            int unconfirmed,
            int futurePending,
            Integer adherencePercent,
            String priority,
            String reason) {}

    @Transactional(readOnly = true)
    public List<Signals> computeAllSignals() {
        List<Signals> all = new ArrayList<>();
        for (User patient : userRepository.findAllByRole(ROLE_PATIENT)) {
            all.add(computeSignals(patient));
        }
        return all;
    }

    @Transactional(readOnly = true)
    public Signals computeSignals(User patient) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        // --- Inactivity (signal only, never a diagnosis) ---
        LocalDateTime lastActive = patient.getLastActiveAt() != null ? patient.getLastActiveAt() : patient.getCreatedAt();
        int inactiveDays = 0;
        if (lastActive != null) {
            inactiveDays = (int) Math.max(0, ChronoUnit.DAYS.between(lastActive.toLocalDate(), today));
        }

        // --- Medication records ---
        int taken = 0;
        int missed = 0;
        int skipped = 0;
        int scheduled = 0;
        for (Object[] row : medicineLogRepository.countStatusesForUser(patient.getId())) {
            String status = String.valueOf(row[0]).toUpperCase(Locale.ROOT);
            long count = (Long) row[1];
            scheduled += count;
            switch (status) {
                case "TAKEN" -> taken += count;
                case "MISSED" -> missed += count;
                case "SKIPPED" -> skipped += count;
                default -> { /* PENDING handled below */ }
            }
        }

        // Unconfirmed = PENDING doses whose scheduled time has already passed.
        // PENDING doses that are not yet due today are NOT unconfirmed.
        long pendingPastDays = medicineLogRepository.countPendingBefore(patient.getId(), startOfDay);
        int overdueToday = 0;
        int futurePending = 0;
        for (String time : medicineLogRepository.findPendingTimesToday(patient.getId(), startOfDay)) {
            LocalTime parsed = parseTime(time);
            if (parsed == null) continue;
            if (parsed.isBefore(now.toLocalTime())) overdueToday++;
            else futurePending++;
        }
        int unconfirmed = (int) pendingPastDays + overdueToday;

        int denominator = taken + missed + skipped + unconfirmed;
        Integer adherence = denominator > 0 ? (int) Math.round((taken * 100.0) / denominator) : null;

        // --- Priority from configurable thresholds ---
        List<String> reasons = new ArrayList<>();
        int rank = 0;

        if (inactiveDays >= props.getInactiveHighPriorityDays()) {
            rank = Math.max(rank, 3);
            reasons.add("Inactive for " + inactiveDays + " days");
        } else if (inactiveDays >= props.getInactiveFollowUpDays()) {
            rank = Math.max(rank, 2);
            reasons.add("Inactive for " + inactiveDays + " days");
        } else if (inactiveDays >= props.getInactiveMonitorDays()) {
            rank = Math.max(rank, 1);
            reasons.add("Inactive for " + inactiveDays + " days");
        }

        if (unconfirmed >= props.getUnconfirmedDosesHighPriority()) {
            rank = Math.max(rank, 3);
            reasons.add(unconfirmed + " medication doses unconfirmed");
        } else if (unconfirmed >= props.getUnconfirmedDosesFollowUp()) {
            rank = Math.max(rank, 2);
            reasons.add(unconfirmed + " medication doses unconfirmed");
        }

        if (adherence != null && adherence < props.getLowAdherencePercent() && denominator > 0) {
            rank = Math.max(rank, 1);
            reasons.add("Adherence " + adherence + "% is below the " + props.getLowAdherencePercent() + "% threshold");
        }

        String priority = PRIORITY_ORDER.get(Math.min(rank, PRIORITY_ORDER.size() - 1));
        String reason = reasons.isEmpty() ? null : String.join("; ", reasons);

        return new Signals(patient, inactiveDays, scheduled, taken, missed, skipped, unconfirmed,
                futurePending, adherence, priority, reason);
    }

    private static LocalTime parseTime(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim().toUpperCase(Locale.ROOT);
        for (DateTimeFormatter pattern : TIME_PATTERNS) {
            try {
                return LocalTime.parse(value, pattern);
            } catch (Exception ignored) {
                // try next pattern
            }
        }
        return null;
    }

    private static int rankOf(String priority) {
        int idx = PRIORITY_ORDER.indexOf(priority);
        return idx < 0 ? 0 : idx;
    }

    // =====================================================================
    // Follow-up queue (upsert from signals)
    // =====================================================================

    /**
     * Recomputes follow-up rows for the given signals and persists changes.
     *
     * <ul>
     *   <li>No row + non-NORMAL priority → create OPEN.</li>
     *   <li>OPEN row → priority/reason refreshed; auto-resolved when signals clear.</li>
     *   <li>CONTACTED row → admin workflow preserved, fields refreshed.</li>
     *   <li>RESOLVED row → stays resolved unless the priority escalates further.</li>
     * </ul>
     */
    @Transactional
    public Map<Long, AdminFollowUp> syncFollowUps(List<Signals> signals) {
        Map<Long, AdminFollowUp> rows = new HashMap<>();
        for (Signals s : signals) {
            Long userId = s.patient().getId();
            Optional<AdminFollowUp> existing = followUpRepository.findByUserId(userId);

            if ("NORMAL".equals(s.priority())) {
                if (existing.isPresent()) {
                    AdminFollowUp row = existing.get();
                    row.setPriority("NORMAL");
                    row.setReason(null);
                    row.setInactiveDays(s.inactiveDays());
                    row.setUnconfirmedDoses(s.unconfirmed());
                    row.setAdherencePercent(s.adherencePercent());
                    if ("OPEN".equals(row.getStatus())) {
                        row.setStatus("RESOLVED");
                        row.setResolvedAt(LocalDateTime.now());
                    }
                    rows.put(userId, followUpRepository.save(row));
                }
                continue;
            }

            AdminFollowUp row = existing.orElseGet(() -> {
                AdminFollowUp created = new AdminFollowUp();
                created.setUser(s.patient());
                created.setStatus("OPEN");
                return created;
            });

            String previousStatus = row.getStatus();
            String previousPriority = row.getPriority();

            row.setPriority(s.priority());
            row.setReason(s.reason());
            row.setInactiveDays(s.inactiveDays());
            row.setUnconfirmedDoses(s.unconfirmed());
            row.setAdherencePercent(s.adherencePercent());

            if (previousStatus == null || "OPEN".equals(previousStatus)) {
                row.setStatus("OPEN");
            } else if ("RESOLVED".equals(previousStatus)
                    && rankOf(s.priority()) > rankOf(previousPriority)) {
                // Signals got worse since the admin resolved it — surface again.
                row.setStatus("OPEN");
                row.setResolvedAt(null);
            }
            // CONTACTED stays CONTACTED until the admin resolves it manually.

            rows.put(userId, followUpRepository.save(row));
        }
        return rows;
    }

    private Map<Long, AdminFollowUp> refreshQueue() {
        List<Signals> signals = computeAllSignals();
        return syncFollowUps(signals);
    }

    // =====================================================================
    // Dashboard
    // =====================================================================

    @Transactional
    public AdminDtos.Dashboard dashboard() {
        List<Signals> signals = computeAllSignals();
        Map<Long, AdminFollowUp> rows = syncFollowUps(signals);

        long totalPatients = userRepository.countByRole(ROLE_PATIENT);
        long activeToday = userRepository.countActiveSince(ROLE_PATIENT, LocalDate.now().atStartOfDay());
        long inactive2Plus = signals.stream().filter(s -> s.inactiveDays() >= props.getInactiveMonitorDays()).count();
        long missedAlerts = signals.stream()
                .filter(s -> (s.missed() + s.unconfirmed()) >= props.getMissedDoseAlertAggregation())
                .count();

        List<AdminFollowUp> openOrContacted = rows.values().stream()
                .filter(r -> !"RESOLVED".equals(r.getStatus()))
                .toList();
        long highPriority = openOrContacted.stream()
                .filter(r -> "HIGH_PRIORITY".equals(r.getPriority()))
                .count();
        long openFollowUps = openOrContacted.stream()
                .filter(r -> "OPEN".equals(r.getStatus()))
                .count();
        long openSupport = helpRequestRepository.countByStatus("NEW")
                + helpRequestRepository.countByStatus("ACKNOWLEDGED");

        // Alerts feed: newest/most urgent follow-ups first, then new help requests.
        List<AdminDtos.Alert> alerts = new ArrayList<>();
        signals.stream()
                .filter(s -> !"NORMAL".equals(s.priority()))
                .sorted(Comparator.comparingInt((Signals s) -> rankOf(s.priority())).reversed()
                        .thenComparing(Comparator.comparingInt(Signals::inactiveDays).reversed()))
                .limit(6)
                .forEach(s -> {
                    AdminFollowUp row = rows.get(s.patient().getId());
                    if (row == null || !"OPEN".equals(row.getStatus())) return;
                    alerts.add(new AdminDtos.Alert(
                            "FOLLOW_UP", s.patient().getId(), s.patient().getFullName(),
                            s.priority(), s.reason(), row.getUpdatedAt()));
                });

        helpRequestRepository.findByStatusOrderByCreatedAtDesc("NEW").stream()
                .limit(4)
                .forEach(h -> alerts.add(new AdminDtos.Alert(
                        "HELP_REQUEST", h.getPatient().getId(), h.getPatient().getFullName(),
                        "EMERGENCY".equals(h.getType()) ? "HIGH_PRIORITY" : "FOLLOW_UP",
                        h.getType() + " help request: " + abbreviate(h.getMessage(), 90),
                        h.getCreatedAt())));

        return new AdminDtos.Dashboard(
                totalPatients, activeToday, inactive2Plus, missedAlerts,
                highPriority, openFollowUps, openSupport, alerts, thresholds());
    }

    public AdminDtos.Thresholds thresholds() {
        return new AdminDtos.Thresholds(
                props.getInactiveMonitorDays(),
                props.getInactiveFollowUpDays(),
                props.getInactiveHighPriorityDays(),
                props.getUnconfirmedDosesFollowUp(),
                props.getUnconfirmedDosesHighPriority(),
                props.getLowAdherencePercent(),
                props.getPrescriptionExpiryWarningDays(),
                props.getMissedDoseAlertAggregation());
    }

    private static String abbreviate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }

    // =====================================================================
    // Patient monitoring
    // =====================================================================

    @Transactional
    public List<AdminDtos.PatientSummary> listPatients(AdminDtos.PatientQuery query) {
        List<Signals> signals = computeAllSignals();
        Map<Long, AdminFollowUp> rows = syncFollowUps(signals);

        String search = query.getSearch() != null ? query.getSearch().trim().toLowerCase(Locale.ROOT) : "";
        Long searchId = null;
        if (query.getSearch() != null) {
            try {
                searchId = Long.parseLong(query.getSearch().trim());
            } catch (NumberFormatException ignored) {
                // not an id search
            }
        }

        List<AdminDtos.PatientSummary> result = new ArrayList<>();
        for (Signals s : signals) {
            User u = s.patient();
            AdminFollowUp row = rows.get(u.getId());

            if (searchId != null && !searchId.equals(u.getId())) continue;
            if (!search.isEmpty() && searchId == null
                    && !contains(u.getFullName(), search)
                    && !contains(u.getEmail(), search)
                    && !contains(u.getPhoneNumber(), search)) continue;

            if ("ACTIVE".equals(query.getStatus()) && s.inactiveDays() >= props.getInactiveMonitorDays()) continue;
            if ("INACTIVE".equals(query.getStatus()) && s.inactiveDays() < props.getInactiveMonitorDays()) continue;

            boolean lowAdherence = s.adherencePercent() != null && s.adherencePercent() < props.getLowAdherencePercent();
            if ("LOW".equals(query.getAdherence()) && !lowAdherence) continue;
            if ("OK".equals(query.getAdherence()) && lowAdherence) continue;

            if (query.getPriority() != null && !query.getPriority().isBlank()
                    && !query.getPriority().equals(s.priority())) continue;

            if (query.getMinMissedDoses() != null
                    && (s.missed() + s.unconfirmed()) < query.getMinMissedDoses()) continue;

            result.add(toSummary(s, row));
        }

        result.sort((a, b) -> {
            int cmp = Integer.compare(rankOf(b.followUpPriority()), rankOf(a.followUpPriority()));
            if (cmp != 0) return cmp;
            long inactiveA = a.inactiveDays() != null ? a.inactiveDays() : 0L;
            long inactiveB = b.inactiveDays() != null ? b.inactiveDays() : 0L;
            cmp = Long.compare(inactiveB, inactiveA);
            if (cmp != 0) return cmp;
            return Integer.compare(b.unconfirmedDoses(), a.unconfirmedDoses());
        });

        int limit = query.getLimit() != null ? Math.min(Math.max(query.getLimit(), 1), 500) : 200;
        return result.size() > limit ? result.subList(0, limit) : result;
    }

    private static boolean contains(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase(Locale.ROOT).contains(needle);
    }

    /** Inactive-patient quick list (uses the configured monitor threshold). */
    @Transactional
    public List<AdminDtos.PatientSummary> listInactive() {
        AdminDtos.PatientQuery query = new AdminDtos.PatientQuery();
        query.setStatus("INACTIVE");
        return listPatients(query);
    }

    /** Adherence table sorted worst-first. */
    @Transactional
    public List<AdminDtos.PatientSummary> listAdherence() {
        List<AdminDtos.PatientSummary> result = listPatients(new AdminDtos.PatientQuery());
        result.sort(Comparator.comparing(
                p -> p.adherencePercent() != null ? p.adherencePercent() : Integer.MAX_VALUE));
        return result;
    }

    private AdminDtos.PatientSummary toSummary(Signals s, AdminFollowUp row) {
        User u = s.patient();
        return new AdminDtos.PatientSummary(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getPhoneNumber(),
                u.getBloodGroup(),
                u.getCreatedAt(),
                u.getLastActiveAt(),
                (long) s.inactiveDays(),
                s.scheduled(),
                s.taken(),
                s.missed(),
                s.skipped(),
                s.unconfirmed(),
                s.adherencePercent(),
                row != null ? row.getPriority() : s.priority(),
                row != null ? row.getStatus() : "NONE",
                row != null ? row.getId() : null,
                prescriptionStatus(u),
                Boolean.TRUE.equals(u.getFollowUpCallsOptIn()));
    }

    // =====================================================================
    // Patient detail
    // =====================================================================

    @Transactional
    public AdminDtos.PatientDetail patientDetail(Long patientId, Long adminId) {
        User patient = requirePatient(patientId);
        Signals s = computeSignals(patient);
        AdminFollowUp row = syncFollowUps(List.of(s)).get(patientId);

        audit(adminId, "VIEW_PATIENT", patientId, "Viewed patient profile");

        List<AdminDtos.Note> notes = noteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(n -> new AdminDtos.Note(n.getId(), n.getBody(),
                        n.getAdminUser() != null ? n.getAdminUser().getFullName() : null, n.getCreatedAt()))
                .toList();

        List<AdminDtos.Contact> contacts = contactLogRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(c -> new AdminDtos.Contact(c.getId(), c.getType(), c.getResult(), c.getNote(), c.getSubject(),
                        c.getAdminUser() != null ? c.getAdminUser().getFullName() : null, c.getCreatedAt()))
                .toList();

        // Least privilege: allergies / chronic conditions stay hidden from the
        // admin surface; contact details and emergency contact are shown.
        return new AdminDtos.PatientDetail(
                toSummary(s, row),
                patient.getDateOfBirth(),
                null,
                null,
                patient.getEmergencyContactName(),
                patient.getEmergencyContactPhone(),
                Boolean.TRUE.equals(patient.getFollowUpCallsOptIn()),
                buildMedications(patient),
                buildPrescriptions(patient),
                buildActivity(patient),
                notes,
                contacts,
                row != null ? toFollowUp(row) : null);
    }

    @Transactional
    public AdminDtos.Activity patientActivity(Long patientId, Long adminId) {
        User patient = requirePatient(patientId);
        audit(adminId, "VIEW_PATIENT", patientId, "Viewed patient activity");
        return buildActivity(patient);
    }

    @Transactional
    public List<AdminDtos.Medication> patientMedications(Long patientId, Long adminId) {
        User patient = requirePatient(patientId);
        audit(adminId, "VIEW_PATIENT", patientId, "Viewed patient medications");
        return buildMedications(patient);
    }

    private User requirePatient(Long patientId) {
        User patient = userRepository.findById(patientId)
                .filter(u -> ROLE_PATIENT.equals(u.getRole()))
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return patient;
    }

    private List<AdminDtos.Medication> buildMedications(User patient) {
        List<Medicine> medicines = medicineRepository.findByUserIdOrderByCreatedAtDesc(patient.getId());
        if (medicines.isEmpty()) return List.of();

        Map<Long, List<MedicineLog>> logsByMedicine = new HashMap<>();
        for (MedicineLog l : medicineLogRepository.findByUserIdOrderByLogDateDesc(patient.getId())) {
            if (l.getMedicine() == null) continue;
            logsByMedicine.computeIfAbsent(l.getMedicine().getId(), k -> new ArrayList<>()).add(l);
        }

        LocalDate today = LocalDate.now();
        List<AdminDtos.Medication> result = new ArrayList<>();
        for (Medicine med : medicines) {
            List<MedicineLog> logs = logsByMedicine.getOrDefault(med.getId(), List.of());
            int taken = 0, missed = 0, skipped = 0, unconfirmed = 0;
            for (MedicineLog l : logs) {
                switch (String.valueOf(l.getStatus()).toUpperCase(Locale.ROOT)) {
                    case "TAKEN" -> taken++;
                    case "MISSED" -> missed++;
                    case "SKIPPED" -> skipped++;
                    case "PENDING" -> { if (isPastDue(l)) unconfirmed++; }
                    default -> { }
                }
            }
            int denominator = taken + missed + skipped + unconfirmed;
            Integer adherence = denominator > 0 ? (int) Math.round((taken * 100.0) / denominator) : null;

            List<String> times = med.getSchedules() == null ? List.of() :
                    med.getSchedules().stream()
                            .filter(sc -> sc.getIsEnabled() == null || sc.getIsEnabled())
                            .sorted(Comparator.comparing(MedicineSchedule::getTime))
                            .map(MedicineSchedule::getTime)
                            .toList();

            boolean active = Boolean.TRUE.equals(med.getIsActive())
                    && (med.getEndDate() == null || !med.getEndDate().isBefore(today));

            result.add(new AdminDtos.Medication(
                    med.getId(), med.getName(), med.getGenericName(), med.getDose(), med.getFrequency(),
                    med.getStartDate() != null ? med.getStartDate().toString() : null,
                    med.getEndDate() != null ? med.getEndDate().toString() : null,
                    active, times, logs.size(), taken, missed, skipped, unconfirmed, adherence));
        }
        return result;
    }

    private static boolean isPastDue(MedicineLog l) {
        LocalDateTime logDate = l.getLogDate();
        if (logDate == null) return true;
        if (logDate.toLocalDate().isBefore(LocalDate.now())) return true;
        if (logDate.toLocalDate().isEqual(LocalDate.now())) {
            LocalTime time = parseTime(l.getScheduledTime());
            return time == null || time.isBefore(LocalTime.now());
        }
        return false;
    }

    private List<AdminDtos.PrescriptionInfo> buildPrescriptions(User patient) {
        return prescriptionRepository.findByUserIdOrderByPrescriptionDateDesc(patient.getId()).stream()
                .map(p -> new AdminDtos.PrescriptionInfo(
                        p.getId(),
                        p.getDiagnosis(),
                        p.getDoctorName(),
                        p.getHospitalOrClinic(),
                        p.getPrescriptionDate() != null ? p.getPrescriptionDate().toString() : null,
                        prescriptionState(p),
                        p.getMedicines() == null ? List.of() :
                                p.getMedicines().stream().map(Medicine::getName).toList()))
                .toList();
    }

    /** ACTIVE | EXPIRING_SOON | EXPIRED — derived from the prescription's medicines. */
    private String prescriptionState(Prescription p) {
        LocalDate today = LocalDate.now();
        LocalDate warnEdge = today.plusDays(props.getPrescriptionExpiryWarningDays());

        boolean anyActive = false;
        boolean anyExpiring = false;
        boolean anyExpired = false;

        LocalDate end = null;
        for (Medicine m : p.getMedicines()) {
            if (m.getEndDate() != null && (end == null || m.getEndDate().isAfter(end))) {
                end = m.getEndDate();
            }
        }

        if (end == null) {
            boolean stillActive = p.getMedicines().stream().anyMatch(m -> Boolean.TRUE.equals(m.getIsActive()))
                    || p.getMedicines().isEmpty();
            if (stillActive) anyActive = true;
            else anyExpired = true;
        } else if (end.isBefore(today)) {
            anyExpired = true;
        } else if (!end.isAfter(warnEdge)) {
            anyExpiring = true;
            anyActive = true;
        } else {
            anyActive = true;
        }

        if (anyExpiring) return "EXPIRING_SOON";
        if (anyActive) return "ACTIVE";
        if (anyExpired) return "EXPIRED";
        return "NONE";
    }

    private String prescriptionStatus(User patient) {
        List<Prescription> prescriptions = prescriptionRepository.findByUserIdOrderByPrescriptionDateDesc(patient.getId());
        if (prescriptions.isEmpty()) return "NONE";
        boolean expiring = false, active = false, expired = false;
        for (Prescription p : prescriptions) {
            switch (prescriptionState(p)) {
                case "EXPIRING_SOON" -> expiring = true;
                case "ACTIVE" -> active = true;
                case "EXPIRED" -> expired = true;
                default -> { }
            }
        }
        if (expiring) return "EXPIRING_SOON";
        if (active) return "ACTIVE";
        if (expired) return "EXPIRED";
        return "NONE";
    }

    private AdminDtos.Activity buildActivity(User patient) {
        LocalDateTime lastMedication = medicineLogRepository.findFirstByUserIdOrderByLogDateDesc(patient.getId())
                .map(MedicineLog::getLogDate)
                .orElse(null);

        List<String> recent = medicineLogRepository.findTop20ByUserIdOrderByLogDateDesc(patient.getId()).stream()
                .map(l -> (l.getLogDate() != null ? LOG_TIME_FORMAT.format(l.getLogDate()) : "—")
                        + " — " + l.getMedicineName() + ": " + l.getStatus())
                .toList();

        return new AdminDtos.Activity(
                patient.getCreatedAt(),
                patient.getLastActiveAt(),
                lastMedication,
                recent);
    }

    // =====================================================================
    // Follow-up actions
    // =====================================================================

    @Transactional
    public List<AdminDtos.FollowUp> listFollowUps(String status) {
        Map<Long, AdminFollowUp> rows = refreshQueue();
        return rows.values().stream()
                .filter(r -> status == null || status.isBlank() || status.equalsIgnoreCase(r.getStatus()))
                .sorted(Comparator
                        .comparingInt((AdminFollowUp r) -> rankOf(r.getPriority())).reversed()
                        .thenComparing(AdminFollowUp::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toFollowUp)
                .toList();
    }

    private AdminDtos.FollowUp toFollowUp(AdminFollowUp row) {
        User patient = row.getUser();
        return new AdminDtos.FollowUp(
                row.getId(),
                patient != null ? patient.getId() : null,
                patient != null ? patient.getFullName() : null,
                row.getPriority(),
                row.getStatus(),
                row.getReason(),
                row.getInactiveDays(),
                row.getUnconfirmedDoses(),
                row.getAdherencePercent(),
                row.getCreatedAt(),
                row.getUpdatedAt(),
                row.getLastContactedAt(),
                row.getResolvedAt());
    }

    @Transactional
    public AdminDtos.FollowUp contactPatient(Long followUpId, AdminDtos.ContactRequest request, Long adminId) {
        AdminFollowUp row = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        AdminContactLog contact = new AdminContactLog();
        contact.setFollowUp(row);
        contact.setPatient(row.getUser());
        contact.setAdminUser(admin);
        contact.setType(normalizeContactType(request.getType()));
        contact.setResult(request.getResult());
        contact.setNote(request.getNote());
        contact.setSubject(request.getResult() != null ? abbreviate(request.getResult(), 200) : null);
        contactLogRepository.save(contact);

        if ("OPEN".equals(row.getStatus())) {
            row.setStatus("CONTACTED");
        }
        row.setLastContactedAt(LocalDateTime.now());
        AdminFollowUp saved = followUpRepository.save(row);

        audit(adminId, "CONTACT", row.getUser().getId(), "Marked follow-up as contacted (" + contact.getType() + ")");
        return toFollowUp(saved);
    }

    private static String normalizeContactType(String type) {
        if (type == null) return "PHONE";
        String t = type.toUpperCase(Locale.ROOT);
        return switch (t) {
            case "PHONE", "MESSAGE", "NOTIFICATION" -> t;
            default -> "PHONE";
        };
    }

    @Transactional
    public AdminDtos.FollowUp resolveFollowUp(Long followUpId, Long adminId) {
        AdminFollowUp row = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found"));
        row.setStatus("RESOLVED");
        row.setResolvedAt(LocalDateTime.now());
        AdminFollowUp saved = followUpRepository.save(row);
        audit(adminId, "CHANGE_STATUS", row.getUser().getId(), "Resolved follow-up");
        return toFollowUp(saved);
    }

    // =====================================================================
    // Notes & notifications
    // =====================================================================

    @Transactional
    public AdminDtos.Note addNote(Long patientId, String body, Long adminId) {
        User patient = requirePatient(patientId);
        if (body == null || body.isBlank()) {
            throw new com.meditalk.exceptions.BadRequestException("Note body is required");
        }
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        AdminNote note = new AdminNote();
        note.setPatient(patient);
        note.setAdminUser(admin);
        note.setBody(body.trim());
        AdminNote saved = noteRepository.save(note);

        audit(adminId, "ADD_NOTE", patientId, "Added internal note");
        return new AdminDtos.Note(saved.getId(), saved.getBody(), admin.getFullName(), saved.getCreatedAt());
    }

    /**
     * Sends an admin-authored notification to the patient's live sessions and
     * records the attempt in the contact history. Offline patients simply get
     * the contact record — nothing is queued or spam-retried.
     */
    @Transactional
    public AdminDtos.Contact sendNotification(Long patientId, AdminDtos.NotificationRequest request, Long adminId) {
        User patient = requirePatient(patientId);
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));
        if (request.getBody() == null || request.getBody().isBlank()) {
            throw new com.meditalk.exceptions.BadRequestException("Notification body is required");
        }
        String title = request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle() : "Message from Meditalk Admin";

        AdminContactLog contact = new AdminContactLog();
        contact.setPatient(patient);
        contact.setAdminUser(admin);
        contact.setType("NOTIFICATION");
        contact.setSubject(abbreviate(title, 200));
        contact.setNote(request.getBody());
        contact.setResult(realtimeHub.isOnline(patientId) ? "Delivered" : "Queued while offline");
        AdminContactLog saved = contactLogRepository.save(contact);

        realtimeHub.sendToUser(patientId, ChatEvent.of("admin.notification",
                Map.of("title", title, "body", request.getBody())));

        // A sent notification is a contact attempt: reflect it on the queue.
        followUpRepository.findByUserId(patientId).ifPresent(row -> {
            if ("OPEN".equals(row.getStatus())) row.setStatus("CONTACTED");
            row.setLastContactedAt(LocalDateTime.now());
            followUpRepository.save(row);
        });

        audit(adminId, "SEND_NOTIFICATION", patientId, "Sent in-app notification");
        return new AdminDtos.Contact(saved.getId(), saved.getType(), saved.getResult(), saved.getNote(),
                saved.getSubject(), admin.getFullName(), saved.getCreatedAt());
    }

    // =====================================================================
    // Help requests
    // =====================================================================

    @Transactional(readOnly = true)
    public List<AdminDtos.HelpRequest> listHelpRequests(String status) {
        List<AdminHelpRequest> requests = (status == null || status.isBlank())
                ? helpRequestRepository.findAllByOrderByCreatedAtDesc()
                : helpRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        return requests.stream().map(this::toHelpRequest).toList();
    }

    @Transactional
    public AdminDtos.HelpRequest updateHelpRequest(Long id, AdminDtos.HelpStatusRequest request, Long adminId) {
        AdminHelpRequest hr = helpRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Help request not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        if (request.getStatus() != null) {
            String status = request.getStatus().toUpperCase(Locale.ROOT);
            if (!List.of("NEW", "ACKNOWLEDGED", "CONTACTED", "RESOLVED").contains(status)) {
                throw new com.meditalk.exceptions.BadRequestException("Invalid help request status");
            }
            hr.setStatus(status);
        }
        if (request.getNote() != null && !request.getNote().isBlank()) {
            hr.setResolutionNote(request.getNote());
        }
        hr.setHandledBy(admin);
        AdminHelpRequest saved = helpRequestRepository.save(hr);

        audit(adminId, "CHANGE_STATUS", saved.getPatient().getId(),
                "Help request " + saved.getId() + " → " + saved.getStatus());
        return toHelpRequest(saved);
    }

    @Transactional
    public AdminDtos.HelpRequest createHelpRequest(Long patientId, AdminDtos.HelpRequestCreate request) {
        User patient = userRepository.findById(patientId)
                .filter(u -> ROLE_PATIENT.equals(u.getRole()))
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new com.meditalk.exceptions.BadRequestException("Please describe what you need help with");
        }
        AdminHelpRequest hr = new AdminHelpRequest();
        hr.setPatient(patient);
        hr.setType(sanitizeHelpType(request.getType()));
        hr.setMessage(request.getMessage().trim());
        hr.setStatus("NEW");
        AdminHelpRequest saved = helpRequestRepository.save(hr);
        log.info("Help request {} created by patient {}", saved.getId(), patientId);
        return toHelpRequest(saved);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.HelpRequest> myHelpRequests(Long patientId) {
        return helpRequestRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(this::toHelpRequest)
                .toList();
    }

    private static String sanitizeHelpType(String type) {
        if (type == null) return "GENERAL";
        String t = type.toUpperCase(Locale.ROOT);
        return List.of("MEDICATION", "APP_SUPPORT", "GENERAL", "EMERGENCY").contains(t) ? t : "GENERAL";
    }

    private AdminDtos.HelpRequest toHelpRequest(AdminHelpRequest hr) {
        User patient = hr.getPatient();
        return new AdminDtos.HelpRequest(
                hr.getId(),
                patient != null ? patient.getId() : null,
                patient != null ? patient.getFullName() : null,
                patient != null ? patient.getPhoneNumber() : null,
                hr.getType(),
                hr.getMessage(),
                hr.getStatus(),
                hr.getResolutionNote(),
                hr.getHandledBy() != null ? hr.getHandledBy().getFullName() : null,
                hr.getCreatedAt(),
                hr.getUpdatedAt());
    }

    // =====================================================================
    // Reports
    // =====================================================================

    @Transactional(readOnly = true)
    public AdminDtos.AdherenceReport adherenceReport(AdminDtos.ReportQuery query) {
        LocalDateTime[] range = resolveRange(query);
        int taken = 0, missed = 0, skipped = 0, unconfirmed = 0, scheduled = 0;
        for (Object[] row : medicineLogRepository.countStatusesBetween(range[0], range[1])) {
            String status = String.valueOf(row[0]).toUpperCase(Locale.ROOT);
            long count = (Long) row[1];
            scheduled += count;
            switch (status) {
                case "TAKEN" -> taken += count;
                case "MISSED" -> missed += count;
                case "SKIPPED" -> skipped += count;
                default -> unconfirmed += count;
            }
        }
        int denominator = taken + missed + skipped + unconfirmed;
        int adherence = denominator > 0 ? (int) Math.round((taken * 100.0) / denominator) : 0;
        long patients = medicineLogRepository.countDistinctUsersBetween(range[0], range[1]);
        return new AdminDtos.AdherenceReport(range[0], range[1], scheduled, taken, missed, skipped,
                unconfirmed, adherence, patients);
    }

    @Transactional(readOnly = true)
    public AdminDtos.ActivityReport activityReport(AdminDtos.ReportQuery query) {
        LocalDateTime[] range = resolveRange(query);
        long total = userRepository.countByRole(ROLE_PATIENT);
        long activeInPeriod = userRepository.countActiveBetween(ROLE_PATIENT, range[0], range[1]);
        long inactive2 = userRepository.countInactiveSince(ROLE_PATIENT, LocalDateTime.now().minusDays(props.getInactiveMonitorDays()));
        long inactive3 = userRepository.countInactiveSince(ROLE_PATIENT, LocalDateTime.now().minusDays(3));
        long created = userRepository.countCreatedBetween(ROLE_PATIENT, range[0], range[1]);
        return new AdminDtos.ActivityReport(range[0], range[1], total, activeInPeriod, inactive2, inactive3, created);
    }

    /** Parses yyyy-MM-dd from/to; defaults to the last 30 days. */
    private static LocalDateTime[] resolveRange(AdminDtos.ReportQuery query) {
        LocalDateTime to = LocalDateTime.now().plusDays(1);
        LocalDateTime from = to.minusDays(30);
        if (query != null) {
            if (query.getFrom() != null && !query.getFrom().isBlank()) {
                try {
                    from = LocalDate.parse(query.getFrom()).atStartOfDay();
                } catch (Exception ignored) {
                    // keep default
                }
            }
            if (query.getTo() != null && !query.getTo().isBlank()) {
                try {
                    to = LocalDate.parse(query.getTo()).plusDays(1).atStartOfDay();
                } catch (Exception ignored) {
                    // keep default
                }
            }
        }
        if (from.isAfter(to)) {
            LocalDateTime swap = from;
            from = to;
            to = swap;
        }
        return new LocalDateTime[]{from, to};
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.AuditEntry> auditLog() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(a -> new AdminDtos.AuditEntry(a.getId(),
                        a.getAdminUser() != null ? a.getAdminUser().getFullName() : null,
                        a.getAction(), a.getPatientId(), a.getDetail(), a.getCreatedAt()))
                .toList();
    }

    // =====================================================================
    // Audit
    // =====================================================================

    private void audit(Long adminId, String action, Long patientId, String detail) {
        try {
            userRepository.findById(adminId).ifPresent(admin -> {
                AdminAuditLog entry = new AdminAuditLog();
                entry.setAdminUser(admin);
                entry.setAction(action);
                entry.setPatientId(patientId);
                entry.setDetail(detail != null && detail.length() > 250 ? detail.substring(0, 249) : detail);
                auditLogRepository.save(entry);
            });
        } catch (Exception e) {
            // Audit must never break the admin's action.
            log.warn("Could not write admin audit entry ({}): {}", action, e.getMessage());
        }
    }
}
