package com.scheduling.OperatingSystem.controller;

import com.scheduling.OperatingSystem.model.CompareResponse;
import com.scheduling.OperatingSystem.model.ScheduleRequest;
import com.scheduling.OperatingSystem.service.SchedulerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ComparisonController {

    private final SchedulerService service;

    public ComparisonController(SchedulerService service) {
        this.service = service;
    }

    @PostMapping("/compare")
    public ResponseEntity<CompareResponse> compare(@RequestBody ScheduleRequest req) {
        if (req.getProcesses() == null || req.getProcesses().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.compareAll(req));
    }
}
