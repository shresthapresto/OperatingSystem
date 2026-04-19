package com.scheduling.OperatingSystem.algorithms;

import com.scheduling.OperatingSystem.algorithms.SchedulingAlgorithm;
import com.scheduling.OperatingSystem.model.GanttBlock;
import com.scheduling.OperatingSystem.model.ProcessInput;
import com.scheduling.OperatingSystem.model.ProcessResult;
import com.scheduling.OperatingSystem.model.ScheduleResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class FcfsAlgorithm implements SchedulingAlgorithm {

    @Override
    public ScheduleResponse run(List<ProcessInput> processes, int quantum) {
        List<ProcessInput> ps = new ArrayList<>(processes);
        ps.sort(Comparator.comparingInt(ProcessInput::getAt)
                .thenComparing(ProcessInput::getId));

        List<GanttBlock> gantt = new ArrayList<>();
        List<ProcessResult> results = new ArrayList<>();
        List<List<String>> readyQueueSnapshots = new ArrayList<>();
        int t = 0;

        // Ensure Gantt always starts at t=0
        int firstArrival = ps.stream().mapToInt(ProcessInput::getAt).min().orElse(0);
        if (firstArrival > 0) {
            gantt.add(new GanttBlock("IDLE", 0, firstArrival));
            // Snapshot for the idle block — queue is empty since no one has arrived
            readyQueueSnapshots.add(new ArrayList<>());
            t = firstArrival;
        }

        for (int idx = 0; idx < ps.size(); idx++) {
            ProcessInput p = ps.get(idx);
            if (t < p.getAt()) {
                gantt.add(new GanttBlock("IDLE", t, p.getAt()));
                // Snapshot for this idle gap — no processes waiting
                readyQueueSnapshots.add(new ArrayList<>());
                t = p.getAt();
            }
            // Snapshot before this process runs: everyone arrived and not yet finished, excluding current
            final int currentTime = t;
            final String currentId = p.getId();
            List<String> snapshot = ps.subList(idx + 1, ps.size()).stream()
                    .filter(q2 -> q2.getAt() <= currentTime)
                    .map(ProcessInput::getId)
                    .collect(Collectors.toList());
            readyQueueSnapshots.add(snapshot);

            gantt.add(new GanttBlock(p.getId(), t, t + p.getBt()));
            t += p.getBt();
            results.add(new ProcessResult(p.getId(), p.getAt(), p.getBt(), t));
        }

        ScheduleResponse resp = new ScheduleResponse(gantt, results);
        resp.setReadyQueueSnapshots(readyQueueSnapshots);
        return resp;
    }
}
