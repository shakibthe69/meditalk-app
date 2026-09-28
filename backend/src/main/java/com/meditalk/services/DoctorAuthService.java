package com.meditalk.services;

import com.meditalk.dto.AuthResponse;
import com.meditalk.dto.DoctorRegistrationRequest;
import com.meditalk.entities.DoctorAccount;
import com.meditalk.entities.User;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.DoctorAccountRepository;
import com.meditalk.repositories.UserRepository;
import com.meditalk.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Doctor account registration and login.
 * Reuses the same security primitives as {@link AuthService}:
 * PasswordEncoder, AuthenticationManager and JwtTokenProvider.
 */
@Service
public class DoctorAuthService {

    private final UserRepository userRepository;
    private final DoctorAccountRepository doctorAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public DoctorAuthService(UserRepository userRepository,
                             DoctorAccountRepository doctorAccountRepository,
                             PasswordEncoder passwordEncoder,
                             AuthenticationManager authenticationManager,
                             JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.doctorAccountRepository = doctorAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse registerDoctor(DoctorRegistrationRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email address is already in use.");
        }
        if (doctorAccountRepository.existsByLicenseNumber(request.getLicenseNumber().trim())) {
            throw new BadRequestException("This medical license number is already registered.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role("ROLE_DOCTOR")
                .build();

        User savedUser = userRepository.save(user);

        DoctorAccount account = DoctorAccount.builder()
                .user(savedUser)
                .fullName(request.getFullName())
                .specialization(request.getSpecialization())
                .licenseNumber(request.getLicenseNumber().trim())
                .hospitalOrClinic(request.getHospitalOrClinic())
                .phoneNumber(request.getPhoneNumber())
                .chamberAddress(request.getChamberAddress())
                .visitingHours(request.getVisitingHours())
                .isAvailable(false)
                .build();

        doctorAccountRepository.save(account);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(mapToUserDto(savedUser, account))
                .build();
    }

    public AuthResponse loginDoctor(com.meditalk.dto.LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!"ROLE_DOCTOR".equals(user.getRole())) {
            throw new BadRequestException("This account is not a doctor account.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        DoctorAccount account = doctorAccountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor account not found"));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(mapToUserDto(user, account))
                .build();
    }

    private com.meditalk.dto.UserDto mapToUserDto(User user, DoctorAccount account) {
        return com.meditalk.dto.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
