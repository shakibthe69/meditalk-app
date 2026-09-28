package com.meditalk.services;

import com.meditalk.entities.DoctorAccount;
import com.meditalk.entities.User;
import com.meditalk.repositories.DoctorAccountRepository;
import com.meditalk.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class UserDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserDataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final DoctorAccountRepository doctorAccountRepository;

    public UserDataInitializer(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuthService authService,
                               DoctorAccountRepository doctorAccountRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.doctorAccountRepository = doctorAccountRepository;
    }

    @Override
    public void run(String... args) {
        seedUserIfNotExists("john.doe@meditalk.com", "SecurePass123!", "John Doe", "+8801711223344", "A+");
        seedUserIfNotExists("shakib@meditalk.com", "password123", "Shakib Ahmed", "+8801811223344", "O+");
        seedDoctorIfNotExists(
                "doctor@meditalk.com", "DoctorPass123!", "Dr. Ayesha Rahman", "+8801911223344",
                "Cardiology & Internal Medicine", "BD-MED-2019-4482",
                "Apollo Heart & General Clinic", "Suite 402, Medical Center Tower, Dhaka",
                "Mon - Fri (04:00 PM - 08:00 PM)", true);
        seedDoctorIfNotExists(
                "nusrat.jahan@meditalk.com", "DoctorPass123!", "Dr. Nusrat Jahan", "+8801812334455",
                "Pediatrics & Child Health", "BD-MED-2020-7731",
                "Square Children's Hospital", "Level 5, Square Hospital, Panthapath, Dhaka",
                "Sat - Thu (10:00 AM - 02:00 PM)", true);
        seedDoctorIfNotExists(
                "imran.hossain@meditalk.com", "DoctorPass123!", "Dr. Imran Hossain", "+8801712334455",
                "Dermatology & Skin Care", "BD-MED-2018-3390",
                "Popular Diagnostic Centre", "House 16, Rd 2, Dhanmondi, Dhaka",
                "Sun - Wed (06:00 PM - 09:00 PM)", false);
    }

    private void seedUserIfNotExists(String email, String rawPassword, String fullName, String phone, String bloodGroup) {
        if (!userRepository.existsByEmail(email.toLowerCase().trim())) {
            User user = User.builder()
                    .fullName(fullName)
                    .email(email.toLowerCase().trim())
                    .password(passwordEncoder.encode(rawPassword))
                    .phoneNumber(phone)
                    .dateOfBirth("1992-05-15")
                    .bloodGroup(bloodGroup)
                    .emergencyContactName("Dr. Rafiq Ahmed")
                    .emergencyContactPhone("+8801999887766")
                    .allergies("Penicillin, Sulfa drugs")
                    .chronicConditions("Hypertension, Seasonal Allergies")
                    .role("ROLE_PATIENT")
                    .build();

            User savedUser = userRepository.save(user);
            authService.seedInitialUserData(savedUser);
            log.info("Demo user successfully seeded: {}", email);
        }
    }

    private void seedDoctorIfNotExists(String email,
                                       String rawPassword,
                                       String fullName,
                                       String phone,
                                       String specialization,
                                       String licenseNumber,
                                       String hospitalOrClinic,
                                       String chamberAddress,
                                       String visitingHours,
                                       boolean isAvailable) {
        if (userRepository.existsByEmail(email.toLowerCase().trim())) {
            return;
        }
        User user = User.builder()
                .fullName(fullName)
                .email(email.toLowerCase().trim())
                .password(passwordEncoder.encode(rawPassword))
                .phoneNumber(phone)
                .role("ROLE_DOCTOR")
                .build();

        User savedUser = userRepository.save(user);

        DoctorAccount account = DoctorAccount.builder()
                .user(savedUser)
                .fullName(fullName)
                .specialization(specialization)
                .licenseNumber(licenseNumber)
                .hospitalOrClinic(hospitalOrClinic)
                .phoneNumber(phone)
                .chamberAddress(chamberAddress)
                .visitingHours(visitingHours)
                .isAvailable(isAvailable)
                .build();
        doctorAccountRepository.save(account);

        log.info("Demo doctor account successfully seeded: {}", email);
    }
}
