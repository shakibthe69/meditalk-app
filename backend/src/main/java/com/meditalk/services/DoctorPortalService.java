package com.meditalk.services;

import com.meditalk.dto.DoctorAccountResponse;
import com.meditalk.dto.DoctorMessageRequest;
import com.meditalk.dto.DoctorMessageResponse;
import com.meditalk.dto.DoctorPostRequest;
import com.meditalk.dto.DoctorPostResponse;
import com.meditalk.dto.DoctorProfileUpdateRequest;
import com.meditalk.entities.DoctorAccount;
import com.meditalk.entities.DoctorMessage;
import com.meditalk.entities.DoctorPost;
import com.meditalk.entities.User;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.DoctorAccountRepository;
import com.meditalk.repositories.DoctorMessageRepository;
import com.meditalk.repositories.DoctorPostRepository;
import com.meditalk.repositories.UserRepository;
import com.meditalk.websocket.RealtimeHub;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Doctor portal operations: availability status, patient threads, messaging and posts.
 */
@Service
public class DoctorPortalService {

    private final DoctorAccountRepository doctorAccountRepository;
    private final DoctorMessageRepository doctorMessageRepository;
    private final DoctorPostRepository doctorPostRepository;
    private final UserRepository userRepository;
    private final RealtimeHub hub;

    public DoctorPortalService(DoctorAccountRepository doctorAccountRepository,
                               DoctorMessageRepository doctorMessageRepository,
                               DoctorPostRepository doctorPostRepository,
                               UserRepository userRepository,
                               RealtimeHub hub) {
        this.doctorAccountRepository = doctorAccountRepository;
        this.doctorMessageRepository = doctorMessageRepository;
        this.doctorPostRepository = doctorPostRepository;
        this.userRepository = userRepository;
        this.hub = hub;
    }

    // ---------- Availability ----------

    @Transactional
    public DoctorAccountResponse setAvailability(Long doctorUserId, Boolean isAvailable) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        account.setIsAvailable(isAvailable);
        account.setLastActiveAt(LocalDateTime.now());
        return mapToAccountResponse(doctorAccountRepository.save(account));
    }

    public DoctorAccountResponse getMyAccount(Long doctorUserId) {
        return mapToAccountResponse(getAccountByUserId(doctorUserId));
    }

    /** Updates the doctor's professional profile (name is mirrored to the login user). */
    @Transactional
    public DoctorAccountResponse updateMyProfile(Long doctorUserId, DoctorProfileUpdateRequest request) {
        DoctorAccount account = getAccountByUserId(doctorUserId);

        if (hasText(request.getFullName())) account.setFullName(request.getFullName().trim());
        if (hasText(request.getSpecialization())) account.setSpecialization(request.getSpecialization().trim());
        if (hasText(request.getLicenseNumber())) account.setLicenseNumber(request.getLicenseNumber().trim());
        if (hasText(request.getHospitalOrClinic())) account.setHospitalOrClinic(request.getHospitalOrClinic().trim());
        if (hasText(request.getPhoneNumber())) account.setPhoneNumber(request.getPhoneNumber().trim());
        if (hasText(request.getChamberAddress())) account.setChamberAddress(request.getChamberAddress().trim());
        if (hasText(request.getVisitingHours())) account.setVisitingHours(request.getVisitingHours().trim());

        // Keep the login record in sync so patient-facing lists show one name.
        User user = account.getUser();
        if (user != null && hasText(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
        }
        if (user != null && hasText(request.getPhoneNumber())) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }

        account.setLastActiveAt(LocalDateTime.now());
        return mapToAccountResponse(doctorAccountRepository.save(account));
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    // ---------- Patients & messaging (doctor side) ----------

    public List<Map<String, Object>> getPatientThreads(Long doctorUserId) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        List<DoctorMessage> msgs = doctorMessageRepository.findByDoctorAccountIdOrderByCreatedAtAsc(account.getId());
        return msgs.stream()
                .collect(Collectors.groupingBy(m -> m.getPatient().getId()))
                .entrySet().stream()
                .map(e -> {
                    List<DoctorMessage> thread = e.getValue();
                    DoctorMessage last = thread.get(thread.size() - 1);
                    User patient = last.getPatient();
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("patientId", e.getKey());
                    m.put("patientName", patient.getFullName());
                    m.put("patientPhone", patient.getPhoneNumber());
                    m.put("lastMessage", last.getBody());
                    m.put("lastMessageFromDoctor", last.getFromDoctor());
                    m.put("lastMessageAt", last.getCreatedAt());
                    m.put("messageCount", thread.size());
                    return m;
                })
                .sorted((a, b) -> {
                    LocalDateTime ta = (LocalDateTime) a.get("lastMessageAt");
                    LocalDateTime tb = (LocalDateTime) b.get("lastMessageAt");
                    return tb.compareTo(ta);
                })
                .collect(Collectors.toList());
    }

    public List<DoctorMessageResponse> getThread(Long doctorUserId, Long patientId) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        return doctorMessageRepository
                .findByDoctorAccountIdAndPatientIdOrderByCreatedAtAsc(account.getId(), patientId)
                .stream()
                .map(DoctorPortalService::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorMessageResponse sendMessage(Long doctorUserId, DoctorMessageRequest request) {
        if (request.getPatientId() == null) {
            throw new BadRequestException("patientId is required.");
        }
        DoctorAccount account = getAccountByUserId(doctorUserId);
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        DoctorMessage message = DoctorMessage.builder()
                .doctorAccount(account)
                .patient(patient)
                .body(request.getBody())
                .fromDoctor(true)
                .build();

        return mapToMessageResponse(doctorMessageRepository.save(message));
    }

    // ---------- Messaging (patient side) ----------

    public List<DoctorMessageResponse> getMyInbox(Long patientUserId) {
        return doctorMessageRepository.findByPatientIdOrderByCreatedAtDesc(patientUserId)
                .stream()
                .map(DoctorPortalService::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    /** Patient's chat thread with one doctor, ordered oldest → newest. */
    public List<DoctorMessageResponse> getPatientThread(Long patientUserId, Long doctorAccountId) {
        return doctorMessageRepository
                .findByDoctorAccountIdAndPatientIdOrderByCreatedAtAsc(doctorAccountId, patientUserId)
                .stream()
                .map(DoctorPortalService::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long patientUserId) {
        return doctorMessageRepository.countByPatientIdAndFromDoctorTrueAndIsReadFalse(patientUserId);
    }

    public long getDoctorUnreadCount(Long doctorUserId) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        return doctorMessageRepository.countByDoctorAccountIdAndFromDoctorFalseAndIsReadFalse(account.getId());
    }

    /** Patient opens the chat with one doctor: mark that doctor's messages read. */
    @Transactional
    public void markThreadReadForPatient(Long patientUserId, Long doctorAccountId) {
        doctorMessageRepository.findByDoctorAccountIdAndPatientIdOrderByCreatedAtAsc(doctorAccountId, patientUserId)
                .forEach(m -> {
                    if (m.getFromDoctor() && !Boolean.TRUE.equals(m.getIsRead())) {
                        m.setIsRead(true);
                        doctorMessageRepository.save(m);
                    }
                });
    }

    /** Doctor opens a patient thread: mark patient messages read. */
    @Transactional
    public void markThreadReadForDoctor(Long doctorUserId, Long patientId) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        doctorMessageRepository.findByDoctorAccountIdAndPatientIdOrderByCreatedAtAsc(account.getId(), patientId)
                .forEach(m -> {
                    if (!m.getFromDoctor() && !Boolean.TRUE.equals(m.getIsRead())) unreadMark(m);
                });
    }

    private void unreadMark(DoctorMessage m) {
        m.setIsRead(true);
        doctorMessageRepository.save(m);
    }

    // ---------- Doctor directory (patient-facing) ----------

    /** Doctors a patient can contact: any doctor with a portal account. */
    public List<DoctorAccountResponse> getDoctorDirectory(Long patientUserId) {
        return doctorAccountRepository.findAll().stream()
                .map(this::mapToAccountResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorMessageResponse sendPatientMessage(Long patientUserId, DoctorMessageRequest request) {
        if (request.getDoctorAccountId() == null) {
            throw new BadRequestException("doctorAccountId is required.");
        }
        DoctorAccount account = doctorAccountRepository.findById(request.getDoctorAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor account not found"));
        User patient = userRepository.findById(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DoctorMessage message = DoctorMessage.builder()
                .doctorAccount(account)
                .patient(patient)
                .body(request.getBody())
                .fromDoctor(false)
                .build();

        return mapToMessageResponse(doctorMessageRepository.save(message));
    }

    // ---------- Posts ----------

    public List<DoctorPostResponse> getMyPosts(Long doctorUserId) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        return doctorPostRepository.findByDoctorAccountIdOrderByCreatedAtDesc(account.getId())
                .stream()
                .map(DoctorPortalService::mapToPostResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorPostResponse createPost(Long doctorUserId, DoctorPostRequest request) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        DoctorPost post = DoctorPost.builder()
                .doctorAccount(account)
                .title(request.getTitle())
                .body(request.getBody())
                .category(request.getCategory() != null ? request.getCategory() : "NOTICE")
                .imageUrl(request.getImageUrl())
                .build();
        return mapToPostResponse(doctorPostRepository.save(post));
    }

    @Transactional
    public void deletePost(Long doctorUserId, Long postId) {
        DoctorAccount account = getAccountByUserId(doctorUserId);
        DoctorPost post = doctorPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        if (!post.getDoctorAccount().getId().equals(account.getId())) {
            throw new BadRequestException("You can only delete your own posts.");
        }
        doctorPostRepository.delete(post);
    }

    /** Patient-facing feed of all doctor posts. */
    public List<DoctorPostResponse> getAllPosts() {
        return doctorPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(DoctorPortalService::mapToPostResponse)
                .collect(Collectors.toList());
    }

    // ---------- Helpers ----------

    public DoctorAccount getAccountByUserId(Long doctorUserId) {
        return doctorAccountRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor account not found for user: " + doctorUserId));
    }

    public static DoctorMessageResponse mapToMessageResponse(DoctorMessage m) {
        return DoctorMessageResponse.builder()
                .id(m.getId())
                .doctorAccountId(m.getDoctorAccount().getId())
                .doctorUserId(m.getDoctorAccount().getUser().getId())
                .doctorName(m.getDoctorAccount().getFullName())
                .patientId(m.getPatient().getId())
                .patientName(m.getPatient().getFullName())
                .body(m.getBody())
                .fromDoctor(m.getFromDoctor())
                .isRead(m.getIsRead())
                .createdAt(m.getCreatedAt())
                .build();
    }

    public static DoctorPostResponse mapToPostResponse(DoctorPost p) {
        return DoctorPostResponse.builder()
                .id(p.getId())
                .doctorAccountId(p.getDoctorAccount().getId())
                .doctorName(p.getDoctorAccount().getFullName())
                .doctorSpecialization(p.getDoctorAccount().getSpecialization())
                .title(p.getTitle())
                .body(p.getBody())
                .category(p.getCategory())
                .imageUrl(p.getImageUrl())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    public DoctorAccountResponse mapToAccountResponse(DoctorAccount account) {
        Long doctorUserId = account.getUser().getId();
        return DoctorAccountResponse.builder()
                .id(account.getId())
                .userId(doctorUserId)
                .isOnline(hub.isOnline(doctorUserId))
                .fullName(account.getFullName())
                .email(account.getUser().getEmail())
                .specialization(account.getSpecialization())
                .licenseNumber(account.getLicenseNumber())
                .hospitalOrClinic(account.getHospitalOrClinic())
                .phoneNumber(account.getPhoneNumber())
                .chamberAddress(account.getChamberAddress())
                .visitingHours(account.getVisitingHours())
                .isAvailable(account.getIsAvailable())
                .lastActiveAt(account.getLastActiveAt())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
