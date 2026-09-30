package com.meditalk.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.meditalk.dto.MedicalHistoryPdfRequest;
import com.meditalk.entities.*;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(PdfGeneratorService.class);

    private final UserRepository userRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;
    private final MedicalReportRepository reportRepository;
    private final DoctorRepository doctorRepository;

    public PdfGeneratorService(UserRepository userRepository,
                               PrescriptionRepository prescriptionRepository,
                               MedicineRepository medicineRepository,
                               MedicalReportRepository reportRepository,
                               DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicineRepository = medicineRepository;
        this.reportRepository = reportRepository;
        this.doctorRepository = doctorRepository;
    }

    public byte[] generateMedicalHistoryPdf(Long userId, MedicalHistoryPdfRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Prescription> prescriptions = prescriptionRepository.findByUserIdOrderByPrescriptionDateDesc(userId);
        List<Medicine> medicines = medicineRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
        List<MedicalReport> reports = reportRepository.findByUserIdOrderByTestDateDesc(userId);
        List<Doctor> doctors = doctorRepository.findByUserIdOrderByCreatedAtDesc(userId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            Color tealBrand = new Color(13, 148, 136);
            Color darkSlate = new Color(15, 23, 42);
            Color lightGray = new Color(241, 245, 249);
            Color borderGray = new Color(203, 213, 225);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, tealBrand);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, tealBrand);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkSlate);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkSlate);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9, darkSlate);
            Font mutedFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

            Paragraph appTitle = new Paragraph("MEDITALK", titleFont);
            appTitle.setAlignment(Element.ALIGN_LEFT);
            document.add(appTitle);

            Paragraph docSubtitle = new Paragraph("Comprehensive Patient Medical History Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkSlate));
            document.add(docSubtitle);

            String generatedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
            Paragraph genDate = new Paragraph("Generated on: " + generatedTime, mutedFont);
            genDate.setSpacingAfter(15);
            document.add(genDate);

            PdfPTable patientTable = new PdfPTable(2);
            patientTable.setWidthPercentage(100);
            patientTable.setSpacingAfter(15);

            PdfPCell cellHeader = new PdfPCell(new Phrase("PATIENT INFORMATION", headerFont));
            cellHeader.setColspan(2);
            cellHeader.setBackgroundColor(lightGray);
            cellHeader.setPadding(6);
            cellHeader.setBorderColor(borderGray);
            patientTable.addCell(cellHeader);

            addPatientField(patientTable, "Full Name:", user.getFullName(), boldFont, regularFont, borderGray);
            addPatientField(patientTable, "Email Address:", user.getEmail(), boldFont, regularFont, borderGray);
            addPatientField(patientTable, "Date of Birth:", user.getDateOfBirth() != null ? user.getDateOfBirth() : "N/A", boldFont, regularFont, borderGray);
            addPatientField(patientTable, "Blood Group:", user.getBloodGroup() != null ? user.getBloodGroup() : "N/A", boldFont, regularFont, borderGray);
            addPatientField(patientTable, "Emergency Contact:", (user.getEmergencyContactName() != null ? user.getEmergencyContactName() : "N/A") + " (" + (user.getEmergencyContactPhone() != null ? user.getEmergencyContactPhone() : "") + ")", boldFont, regularFont, borderGray);
            addPatientField(patientTable, "Allergies:", user.getAllergies() != null ? user.getAllergies() : "None reported", boldFont, regularFont, borderGray);
            addPatientField(patientTable, "Chronic Conditions:", user.getChronicConditions() != null ? user.getChronicConditions() : "None reported", boldFont, regularFont, borderGray);
            document.add(patientTable);

            if (request.isIncludeActiveMedicines() && !medicines.isEmpty()) {
                Paragraph medTitle = new Paragraph("ACTIVE MEDICATIONS & SCHEDULES", headerFont);
                medTitle.setSpacingAfter(6);
                document.add(medTitle);

                PdfPTable medTable = new PdfPTable(5);
                medTable.setWidthPercentage(100);
                medTable.setWidths(new float[]{2.5f, 1.2f, 1.5f, 2.0f, 2.8f});
                medTable.setSpacingAfter(15);

                String[] headers = {"Medicine Name", "Dose", "Frequency", "Food Timing", "Instructions"};
                for (String h : headers) {
                    PdfPCell hCell = new PdfPCell(new Phrase(h, subHeaderFont));
                    hCell.setBackgroundColor(lightGray);
                    hCell.setPadding(5);
                    hCell.setBorderColor(borderGray);
                    medTable.addCell(hCell);
                }

                for (Medicine m : medicines) {
                    addTableCell(medTable, m.getName(), regularFont, borderGray);
                    addTableCell(medTable, m.getDose(), regularFont, borderGray);
                    addTableCell(medTable, m.getFrequency().replace("_", " "), regularFont, borderGray);
                    addTableCell(medTable, m.getFoodInstruction().replace("_", " "), regularFont, borderGray);
                    addTableCell(medTable, m.getInstructions() != null ? m.getInstructions() : "Regular dosage", regularFont, borderGray);
                }
                document.add(medTable);
            }

            if (request.isIncludePrescriptions() && !prescriptions.isEmpty()) {
                Paragraph rxTitle = new Paragraph("PRESCRIPTION RECORDS", headerFont);
                rxTitle.setSpacingAfter(6);
                document.add(rxTitle);

                PdfPTable rxTable = new PdfPTable(4);
                rxTable.setWidthPercentage(100);
                rxTable.setWidths(new float[]{1.5f, 2.5f, 2.5f, 3.5f});
                rxTable.setSpacingAfter(15);

                String[] rxHeaders = {"Date", "Doctor", "Clinic / Facility", "Diagnosis & Prescribed Meds"};
                for (String h : rxHeaders) {
                    PdfPCell hCell = new PdfPCell(new Phrase(h, subHeaderFont));
                    hCell.setBackgroundColor(lightGray);
                    hCell.setPadding(5);
                    hCell.setBorderColor(borderGray);
                    rxTable.addCell(hCell);
                }

                for (Prescription p : prescriptions) {
                    addTableCell(rxTable, p.getPrescriptionDate().toString(), regularFont, borderGray);
                    addTableCell(rxTable, p.getDoctorName(), regularFont, borderGray);
                    addTableCell(rxTable, p.getHospitalOrClinic() != null ? p.getHospitalOrClinic() : "N/A", regularFont, borderGray);

                    StringBuilder medSummary = new StringBuilder();
                    if (p.getDiagnosis() != null) medSummary.append("Diagnosis: ").append(p.getDiagnosis()).append("\n");
                    for (Medicine pm : p.getMedicines()) {
                        medSummary.append("• ").append(pm.getName()).append(" (").append(pm.getDose()).append(")\n");
                    }
                    addTableCell(rxTable, medSummary.toString().trim(), regularFont, borderGray);
                }
                document.add(rxTable);
            }

            if (request.isIncludeReports() && !reports.isEmpty()) {
                Paragraph repTitle = new Paragraph("LAB & DIAGNOSTIC REPORTS", headerFont);
                repTitle.setSpacingAfter(6);
                document.add(repTitle);

                PdfPTable repTable = new PdfPTable(4);
                repTable.setWidthPercentage(100);
                repTable.setWidths(new float[]{1.5f, 2.5f, 2.0f, 4.0f});
                repTable.setSpacingAfter(15);

                String[] repHeaders = {"Date", "Test Title", "Category", "Lab / Clinical Notes"};
                for (String h : repHeaders) {
                    PdfPCell hCell = new PdfPCell(new Phrase(h, subHeaderFont));
                    hCell.setBackgroundColor(lightGray);
                    hCell.setPadding(5);
                    hCell.setBorderColor(borderGray);
                    repTable.addCell(hCell);
                }

                for (MedicalReport r : reports) {
                    addTableCell(repTable, r.getTestDate().toString(), regularFont, borderGray);
                    addTableCell(repTable, r.getTitle(), regularFont, borderGray);
                    addTableCell(repTable, r.getType().replace("_", " "), regularFont, borderGray);
                    addTableCell(repTable, (r.getHospitalOrLab() != null ? r.getHospitalOrLab() + ": " : "") + (r.getNotes() != null ? r.getNotes() : "Recorded in Meditalk"), regularFont, borderGray);
                }
                document.add(repTable);

                // Embed the exact uploaded report images beneath the summary table.
                boolean hasImages = reports.stream()
                        .anyMatch(r -> r.getFileData() != null && r.getFileData().length > 0);
                if (hasImages) {
                    Paragraph imgTitle = new Paragraph("UPLOADED REPORT IMAGES", headerFont);
                    imgTitle.setSpacingBefore(6);
                    imgTitle.setSpacingAfter(8);
                    document.add(imgTitle);

                    for (MedicalReport r : reports) {
                        byte[] bytes = r.getFileData();
                        if (bytes == null || bytes.length == 0) {
                            continue;
                        }
                        try {
                            Image reportImage = Image.getInstance(bytes);
                            reportImage.scaleToFit(460f, 340f);
                            reportImage.setAlignment(Element.ALIGN_CENTER);

                            Paragraph caption = new Paragraph(
                                    r.getTitle() + "  •  " + r.getTestDate(), subHeaderFont);
                            caption.setSpacingBefore(10);
                            caption.setSpacingAfter(4);
                            document.add(caption);
                            document.add(reportImage);
                            document.add(new Paragraph(" ", mutedFont));
                        } catch (Exception imgEx) {
                            log.warn("Skipping unreadable report image for report {}", r.getId());
                        }
                    }
                }
            }

            Paragraph disclaimer = new Paragraph("CONFIDENTIAL MEDICAL RECORD: This document contains protected health information generated by Meditalk. It is intended solely for the patient and their authorized healthcare providers. Meditalk does not replace professional medical advice.", mutedFont);
            disclaimer.setAlignment(Element.ALIGN_CENTER);
            disclaimer.setSpacingBefore(20);
            document.add(disclaimer);

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate medical history PDF", ex);
            throw new RuntimeException("Failed to generate medical history PDF", ex);
        }
    }

    private void addPatientField(PdfPTable table, String label, String value, Font labelFont, Font valueFont, Color borderColor) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setPadding(4);
        c1.setBorderColor(borderColor);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, valueFont));
        c2.setPadding(4);
        c2.setBorderColor(borderColor);
        table.addCell(c2);
    }

    private void addTableCell(PdfPTable table, String text, Font font, Color borderColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(5);
        cell.setBorderColor(borderColor);
        table.addCell(cell);
    }
}
