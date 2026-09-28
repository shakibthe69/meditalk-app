package com.meditalk.services;

import com.meditalk.dto.*;
import com.meditalk.entities.*;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.*;
import com.meditalk.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineScheduleRepository medicineScheduleRepository;
    private final MedicineLogRepository medicineLogRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       DoctorRepository doctorRepository,
                       PrescriptionRepository prescriptionRepository,
                       MedicineRepository medicineRepository,
                       MedicineScheduleRepository medicineScheduleRepository,
                       MedicineLogRepository medicineLogRepository,
                       MedicalReportRepository medicalReportRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicineRepository = medicineRepository;
        this.medicineScheduleRepository = medicineScheduleRepository;
        this.medicineLogRepository = medicineLogRepository;
        this.medicalReportRepository = medicalReportRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address is already in use.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth() != null ? request.getDateOfBirth() : "1990-01-01")
                .bloodGroup(request.getBloodGroup() != null ? request.getBloodGroup() : "O+")
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .allergies("Penicillin, Sulfa drugs")
                .chronicConditions("Hypertension, Acid Reflux")
                .role("ROLE_PATIENT")
                .build();

        User savedUser = userRepository.save(user);

        // Seed initial doctor, prescription, medicine schedule, and sample report
        seedInitialUserData(savedUser);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(mapToUserDto(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(mapToUserDto(user))
                .build();
    }

    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToUserDto(user);
    }

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getBloodGroup() != null) user.setBloodGroup(request.getBloodGroup());
        if (request.getEmergencyContactName() != null) user.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) user.setEmergencyContactPhone(request.getEmergencyContactPhone());
        if (request.getAllergies() != null) user.setAllergies(String.join(", ", request.getAllergies()));
        if (request.getChronicConditions() != null) user.setChronicConditions(String.join(", ", request.getChronicConditions()));

        User updatedUser = userRepository.save(user);
        return mapToUserDto(updatedUser);
    }

    public UserDto mapToUserDto(User user) {
        List<String> allergiesList = user.getAllergies() != null && !user.getAllergies().isBlank()
                ? Arrays.stream(user.getAllergies().split(",")).map(String::trim).collect(Collectors.toList())
                : Collections.emptyList();

        List<String> chronicList = user.getChronicConditions() != null && !user.getChronicConditions().isBlank()
                ? Arrays.stream(user.getChronicConditions().split(",")).map(String::trim).collect(Collectors.toList())
                : Collections.emptyList();

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .dateOfBirth(user.getDateOfBirth())
                .bloodGroup(user.getBloodGroup())
                .emergencyContactName(user.getEmergencyContactName())
                .emergencyContactPhone(user.getEmergencyContactPhone())
                .allergies(allergiesList)
                .chronicConditions(chronicList)
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastActiveAt(user.getLastActiveAt())
                .followUpCallsOptIn(user.getFollowUpCallsOptIn() != null && user.getFollowUpCallsOptIn())
                .build();
    }

    public void seedInitialUserData(User user) {
        try {
            Doctor doctor = Doctor.builder()
                    .user(user)
                    .name("Dr. Rahman, MD")
                    .specialization("Cardiology & Internal Medicine")
                    .hospitalOrClinic("Apollo Heart & General Clinic")
                    .phoneNumber("+1 (555) 902-1234")
                    .email("dr.rahman@apollohealth.org")
                    .chamberAddress("Suite 402, Medical Center Tower, NY")
                    .visitingHours("Mon - Fri (04:00 PM - 08:00 PM)")
                    .notes("Primary care physician and cardiologist")
                    .build();
            Doctor savedDoctor = doctorRepository.save(doctor);

            Prescription prescription = Prescription.builder()
                    .user(user)
                    .doctor(savedDoctor)
                    .doctorName(savedDoctor.getName())
                    .hospitalOrClinic(savedDoctor.getHospitalOrClinic())
                    .prescriptionDate(LocalDate.now().minusDays(2))
                    .diagnosis("Mild seasonal fever and gastric acid reflux")
                    .notes("Take Omeprazole before breakfast and Napa after meals as needed.")
                    .rawOcrText("Dr. Rahman\nOmeprazole 20mg 1+0+0 Before breakfast\nNapa 500mg 1+1+1 After meal 5 days")
                    .build();
            Prescription savedPrescription = prescriptionRepository.save(prescription);

            Medicine med1 = Medicine.builder()
                    .user(user)
                    .prescription(savedPrescription)
                    .name("Omeprazole")
                    .genericName("Omeprazole 20mg Capsule")
                    .dose("20mg")
                    .form("CAPSULE")
                    .frequency("ONCE_DAILY")
                    .foodInstruction("BEFORE_MEAL")
                    .startDate(LocalDate.now().minusDays(5))
                    .endDate(LocalDate.now().plusDays(25))
                    .durationDays(30)
                    .instructions("Take 30 minutes before morning breakfast")
                    .isActive(true)
                    .build();
            Medicine savedMed1 = medicineRepository.save(med1);

            MedicineSchedule sch1 = MedicineSchedule.builder()
                    .medicine(savedMed1)
                    .time("08:00 AM")
                    .label("MORNING")
                    .dosageAmount("1 Capsule")
                    .foodInstruction("BEFORE_MEAL")
                    .isEnabled(true)
                    .build();
            MedicineSchedule savedSch1 = medicineScheduleRepository.save(sch1);

            Medicine med2 = Medicine.builder()
                    .user(user)
                    .prescription(savedPrescription)
                    .name("Napa")
                    .genericName("Paracetamol 500mg")
                    .dose("500mg")
                    .form("TABLET")
                    .frequency("TWICE_DAILY")
                    .foodInstruction("AFTER_MEAL")
                    .startDate(LocalDate.now().minusDays(2))
                    .endDate(LocalDate.now().plusDays(5))
                    .durationDays(7)
                    .instructions("Take after meals for fever and pain")
                    .isActive(true)
                    .build();
            Medicine savedMed2 = medicineRepository.save(med2);

            MedicineSchedule sch2_1 = MedicineSchedule.builder()
                    .medicine(savedMed2)
                    .time("02:00 PM")
                    .label("AFTERNOON")
                    .dosageAmount("1 Tablet")
                    .foodInstruction("AFTER_MEAL")
                    .isEnabled(true)
                    .build();
            MedicineSchedule sch2_2 = MedicineSchedule.builder()
                    .medicine(savedMed2)
                    .time("10:00 PM")
                    .label("NIGHT")
                    .dosageAmount("1 Tablet")
                    .foodInstruction("AFTER_MEAL")
                    .isEnabled(true)
                    .build();
            MedicineSchedule savedSch2_1 = medicineScheduleRepository.save(sch2_1);
            MedicineSchedule savedSch2_2 = medicineScheduleRepository.save(sch2_2);

            MedicineLog log1 = MedicineLog.builder()
                    .user(user)
                    .medicine(savedMed1)
                    .scheduleId(savedSch1.getId())
                    .medicineName("Omeprazole 20mg")
                    .dose("1 Capsule")
                    .scheduledTime("08:00 AM")
                    .takenTime("08:05 AM")
                    .status("TAKEN")
                    .foodInstruction("BEFORE_MEAL")
                    .build();
            MedicineLog log2 = MedicineLog.builder()
                    .user(user)
                    .medicine(savedMed2)
                    .scheduleId(savedSch2_1.getId())
                    .medicineName("Napa 500mg")
                    .dose("1 Tablet")
                    .scheduledTime("02:00 PM")
                    .status("PENDING")
                    .foodInstruction("AFTER_MEAL")
                    .build();
            MedicineLog log3 = MedicineLog.builder()
                    .user(user)
                    .medicine(savedMed2)
                    .scheduleId(savedSch2_2.getId())
                    .medicineName("Napa 500mg")
                    .dose("1 Tablet")
                    .scheduledTime("10:00 PM")
                    .status("PENDING")
                    .foodInstruction("AFTER_MEAL")
                    .build();
            medicineLogRepository.save(log1);
            medicineLogRepository.save(log2);
            medicineLogRepository.save(log3);

            MedicalReport report = MedicalReport.builder()
                    .user(user)
                    .doctor(savedDoctor)
                    .doctorName(savedDoctor.getName())
                    .title("Complete Blood Count (CBC)")
                    .type("BLOOD_TEST")
                    .testDate(LocalDate.now().minusDays(1))
                    .hospitalOrLab("National Diagnostic Laboratory")
                    .notes("Hemoglobin 14.2 g/dL, Platelets 260,000/mcL. Normal range.")
                    .fileUrl("https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80")
                    .fileType("IMAGE")
                    .fileName("cbc_report_sept2026.jpg")
                    .fileSizeBytes(245000L)
                    .build();
            medicalReportRepository.save(report);

        } catch (Exception ex) {
            log.error("Error seeding initial user data", ex);
        }
    }
}
