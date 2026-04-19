package com.scheduling.OperatingSystem.algorithms;

import com.scheduling.OperatingSystem.model.ProcessInput;
import com.scheduling.OperatingSystem.model.ScheduleResponse;

import java.util.List;

public interface SchedulingAlgorithm {
    ScheduleResponse run(List<ProcessInput> processes, int quantum);
}
