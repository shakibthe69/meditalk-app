package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.services.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "fileUrl", fileUrl,
                        "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "document",
                        "fileSizeBytes", file.getSize(),
                        "contentType", file.getContentType() != null ? file.getContentType() : "application/octet-stream"
                ),
                "File uploaded successfully"
        ));
    }
}
