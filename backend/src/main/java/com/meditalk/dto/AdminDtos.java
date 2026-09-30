package com.meditalk.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for the Admin Panel.
 *
 * <p>Grouped in one container to keep the admin surface easy to scan; response
 * types are records (immutable, Jackson-friendly) and request types are small
 * mutable classes so field validation and binding behave exactly like the rest
 * of the API.
 *
 * <p>Nothing here is exposed to non-admin clients: every endpoint returning
 * these types is behind {@code hasRole("ADMIN")}.
 */
public final class AdminDtos {

    private AdminDtos() {}

    // ---------- Dashboard ----------

    public record Dashboard(
            long totalPatients,
            long activeToday,
            long inactive2PlusDays,
            long missedMedicationAlerts,
            long highPriorityFollowUps,
            long openFollowUps,
            long openSupportRequests,
            List<Alert> alerts,
            Thresholds thresholds) {}

    /** A derived, non-medical attention signal for the dashboard feed. */
    public record Alert(
            String type,
            Long patientId,
            String patientName,
            String priority,
            String message,
            LocalDateTime at) {}

    /** Current inactivity/adherence thresholds (configuration, not constants). */
    public record Thresholds(
            int inactiveMonitorDays,
            int inactiveFollowUpDays,
            int inactiveHighPriorityDays,
            int unconfirmedDosesFollowUp,
            int unconfirmedDosesHighPriority,
            int lowAdherencePercent,
            int prescriptionExpiryWarningDays,
            int missedDoseAlertAggregation) {}

    // ---------- Patient monitoring ----------

    public record PatientSummary(
            Long id,
            String name,
            String email,
            String phone,
            String bloodGroup,
            LocalDateTime createdAt,
            LocalDateTime lastActiveAt,
            Long inactiveDays,
            int scheduledDoses,
            int takenDoses,
            int missedDoses,
            int skippedDoses,
            int unconfirmedDoses,
            Integer adherencePercent,
            String followUpPriority,
            String followUpStatus,
            Long followUpId,
            String prescriptionStatus,
            boolean followUpCallsOptIn) {}

    public record PatientDetail(
            PatientSummary summary,
            String dateOfBirth,
            String allergies,
            String chronicConditions,
            String emergencyContactName,
            String emergencyContactPhone,
            boolean helpRequestsOptIn,
            List<Medication> medications,
            List<PrescriptionInfo> prescriptions,
            Activity activity,
            List<Note> notes,
            List<Contact> contacts,
            FollowUp followUp) {}

    public record Medication(
            Long id,
            String name,
            String genericName,
            String dose,
            String frequency,
            String startDate,
            String endDate,
            boolean active,
            List<String> scheduleTimes,
            int scheduled,
            int taken,
            int missed,
            int skipped,
            int pending,
            Integer adherencePercent) {}

    public record PrescriptionInfo(
            Long id,
            String diagnosis,
            String doctorName,
            String hospitalOrClinic,
            String prescriptionDate,
            String status,
            List<String> medicines) {}

    public record Activity(
            LocalDateTime accountCreatedAt,
            LocalDateTime lastAppActivity,
            LocalDateTime lastMedicationInteraction,
            List<String> recentActions) {}

    // ---------- Registered doctors ----------

    /** A doctor account as seen by an administrator (no credentials exposed). */
    public record DoctorSummary(
            Long id,
            Long userId,
            String fullName,
            String email,
            String specialization,
            String licenseNumber,
            String hospitalOrClinic,
            String phoneNumber,
            String chamberAddress,
            String visitingHours,
            boolean available,
            LocalDateTime createdAt,
            LocalDateTime lastActiveAt) {}

    // ---------- Follow-up queue ----------

    public record FollowUp(
            Long id,
            Long patientId,
            String patientName,
            String priority,
            String status,
            String reason,
            int inactiveDays,
            int unconfirmedDoses,
            Integer adherencePercent,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            LocalDateTime lastContactedAt,
            LocalDateTime resolvedAt) {}

    public record Contact(
            Long id,
            String type,
            String result,
            String note,
            String subject,
            String adminName,
            LocalDateTime createdAt) {}

    public record Note(Long id, String body, String adminName, LocalDateTime createdAt) {}

    // ---------- Help / emergency requests ----------

    public record HelpRequest(
            Long id,
            Long patientId,
            String patientName,
            String patientPhone,
            String type,
            String message,
            String status,
            String resolutionNote,
            String handledBy,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {}

    // ---------- Reports ----------

    public record AdherenceReport(
            LocalDateTime from,
            LocalDateTime to,
            int scheduled,
            int taken,
            int missed,
            int skipped,
            int unconfirmed,
            int adherencePercent,
            long patientsWithRecords) {}

    public record ActivityReport(
            LocalDateTime from,
            LocalDateTime to,
            long totalPatients,
            long activeInPeriod,
            long inactive2PlusDays,
            long inactive3PlusDays,
            long newPatients) {}

    public record AuditEntry(
            Long id,
            String adminName,
            String action,
            Long patientId,
            String detail,
            LocalDateTime createdAt) {}

    // ---------- Request payloads ----------

    /** Body for POST /api/admin/follow-ups/{id}/contact. */
    public static class ContactRequest {
        private String type = "PHONE";
        private String result;
        private String note;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    /** Body for POST /api/admin/patients/{id}/notes. */
    public static class NoteRequest {
        private String body;

        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
    }

    /** Body for POST /api/admin/patients/{id}/notification. */
    public static class NotificationRequest {
        private String title;
        private String body;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
    }

    /** Body for POST /api/help-requests (patient side). */
    public static class HelpRequestCreate {
        private String type = "GENERAL";
        private String message;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    /** Body for PATCH /api/admin/help-requests/{id}. */
    public static class HelpStatusRequest {
        private String status;
        private String note;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    /** Query wrapper for the patient list. */
    public static class PatientQuery {
        private String search;
        private String status;      // ACTIVE | INACTIVE
        private String adherence;   // OK | LOW
        private String priority;    // NORMAL | MONITOR | FOLLOW_UP | HIGH_PRIORITY
        private Integer minMissedDoses;
        private Integer limit;

        public String getSearch() { return search; }
        public void setSearch(String search) { this.search = search; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getAdherence() { return adherence; }
        public void setAdherence(String adherence) { this.adherence = adherence; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public Integer getMinMissedDoses() { return minMissedDoses; }
        public void setMinMissedDoses(Integer minMissedDoses) { this.minMissedDoses = minMissedDoses; }
        public Integer getLimit() { return limit; }
        public void setLimit(Integer limit) { this.limit = limit; }
    }

    /** Query wrapper for report date ranges. */
    public static class ReportQuery {
        private String from; // ISO date (yyyy-MM-dd)
        private String to;

        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
    }
}
