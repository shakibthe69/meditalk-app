package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "status", "UP",
                        "service", "Meditalk Healthcare Backend API",
                        "database", "MySQL (XAMPP: meditalk)",
                        "timestamp", LocalDateTime.now().toString(),
                        "version", "1.0.0"
                ),
                "Meditalk API is operational"
        ));
    }
}
