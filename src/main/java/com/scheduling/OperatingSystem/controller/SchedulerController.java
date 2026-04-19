package com.scheduling.OperatingSystem.controller;

import com.scheduling.OperatingSystem.model.ScheduleRequest;
import com.scheduling.OperatingSystem.model.ScheduleResponse;
import com.scheduling.OperatingSystem.service.SchedulerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SchedulerController {

    private final SchedulerService service;

    public SchedulerController(SchedulerService service) {
        this.service = service;
    }

    @PostMapping("/schedule")
    public ResponseEntity<ScheduleResponse> schedule(@RequestBody ScheduleRequest req) {
        if (req.getProcesses() == null || req.getProcesses().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.schedule(req));
    }
}
