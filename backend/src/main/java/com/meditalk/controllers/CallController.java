package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.CallSessionResponse;
import com.meditalk.dto.IceServersResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.CallService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Call history for the signed-in user (works for both patients and doctors).
 * Live call control happens over {@code /ws/chat}.
 */
@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final CallService callService;

    public CallController(CallService callService) {
        this.callService = callService;
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<CallSessionResponse>>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(callService.getHistory(principal.getId())));
    }

    /** ICE servers (STUN, optional TURN) used to negotiate the media path. */
    @GetMapping("/ice-servers")
    public ResponseEntity<ApiResponse<IceServersResponse>> getIceServers() {
        return ResponseEntity.ok(ApiResponse.success(callService.getIceServers()));
    }
}
