package com.scheduling.OperatingSystem.algorithms;

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
public class SjfAlgorithm implements SchedulingAlgorithm {

    @Override
    public ScheduleResponse run(List<ProcessInput> processes, int quantum) {
        List<ProcessInput> ps = new ArrayList<>(processes);
        ps.sort(Comparator.comparingInt(ProcessInput::getAt));

        List<GanttBlock> gantt = new ArrayList<>();
        List<ProcessResult> results = new ArrayList<>();
        List<List<String>> readyQueueSnapshots = new ArrayList<>();
        boolean[] finished = new boolean[ps.size()];
        int t = 0, done = 0, n = ps.size();

        // Ensure Gantt always starts at t=0
        int firstArrival = ps.stream().mapToInt(ProcessInput::getAt).min().orElse(0);
        if (firstArrival > 0) {
            gantt.add(new GanttBlock("IDLE", 0, firstArrival));
            readyQueueSnapshots.add(new ArrayList<>());
            t = firstArrival;
        }

        while (done < n) {
            final int currentT = t;
            // Collect available (arrived, not finished) processes
            List<ProcessInput> avail = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if (!finished[i] && ps.get(i).getAt() <= currentT) {
                    avail.add(ps.get(i));
                }
            }

            if (avail.isEmpty()) {
                // Jump to next arrival
                ProcessInput next = ps.stream()
                    .filter(p -> {
                        int idx = ps.indexOf(p);
                        return !finished[idx];
                    })
                    .min(Comparator.comparingInt(ProcessInput::getAt))
                    .orElse(null);
                if (next == null) break;
                gantt.add(new GanttBlock("IDLE", t, next.getAt()));
                readyQueueSnapshots.add(new ArrayList<>());
                t = next.getAt();
                continue;
            }

            // Pick shortest burst, break ties by arrival time
            avail.sort(Comparator.comparingInt(ProcessInput::getBt)
                                 .thenComparingInt(ProcessInput::getAt));
            ProcessInput p = avail.get(0);

            // Snapshot: all arrived, not finished, not the one about to run
            final String currentId = p.getId();
            List<String> snapshot = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if (!finished[i] && ps.get(i).getAt() <= currentT && !ps.get(i).getId().equals(currentId)) {
                    snapshot.add(ps.get(i).getId());
                }
            }
            readyQueueSnapshots.add(snapshot);

            gantt.add(new GanttBlock(p.getId(), t, t + p.getBt()));
            t += p.getBt();
            finished[ps.indexOf(p)] = true;
            results.add(new ProcessResult(p.getId(), p.getAt(), p.getBt(), t));
            done++;
        }

        ScheduleResponse resp = new ScheduleResponse(gantt, results);
        resp.setReadyQueueSnapshots(readyQueueSnapshots);
        return resp;
    }
}
