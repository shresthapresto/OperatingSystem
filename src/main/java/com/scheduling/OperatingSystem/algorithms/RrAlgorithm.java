package com.scheduling.OperatingSystem.algorithms;

import com.scheduling.OperatingSystem.model.GanttBlock;
import com.scheduling.OperatingSystem.model.ProcessInput;
import com.scheduling.OperatingSystem.model.ProcessResult;
import com.scheduling.OperatingSystem.model.ScheduleResponse;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class RrAlgorithm implements SchedulingAlgorithm {

    @Override
    public ScheduleResponse run(List<ProcessInput> processes, int quantum) {
        // Build mutable list sorted by arrival time, with remaining burst
        List<int[]> ps = new ArrayList<>(); // [at, bt, rem, originalIdx]
        List<String> ids = new ArrayList<>();
        List<ProcessInput> sorted = new ArrayList<>(processes);
        sorted.sort(Comparator.comparingInt(ProcessInput::getAt));
        for (ProcessInput p : sorted) {
            ps.add(new int[]{p.getAt(), p.getBt(), p.getBt()});
            ids.add(p.getId());
        }

        List<GanttBlock> gantt = new ArrayList<>();
        List<ProcessResult> results = new ArrayList<>();
        List<List<String>> readyQueueSnapshots = new ArrayList<>();

        Queue<Integer> queue = new LinkedList<>();
        Set<Integer> inQueue = new HashSet<>();
        int t = 0, n = ps.size();
        boolean[] done = new boolean[n];
        int completedCount = 0;

        // Ensure Gantt always starts at t=0
        int firstArrival = ps.isEmpty() ? 0 : ps.get(0)[0];
        if (firstArrival > 0) {
            gantt.add(new GanttBlock("IDLE", 0, firstArrival));
            readyQueueSnapshots.add(new ArrayList<>());
            t = firstArrival;
        }

        // Seed: add processes that arrive at t
        for (int i = 0; i < n; i++) {
            if (ps.get(i)[0] <= t) { queue.add(i); inQueue.add(i); }
        }
        if (queue.isEmpty() && n > 0) {
            queue.add(0); inQueue.add(0);
            t = ps.get(0)[0];
        }

        while (!queue.isEmpty()) {
            int idx = queue.poll();
            inQueue.remove(idx);
            int[] p = ps.get(idx);

            // Snapshot: everyone in queue (not currently running)
            List<String> snapshot = new ArrayList<>();
            for (int qi : queue) {
                snapshot.add(ids.get(qi));
            }
            readyQueueSnapshots.add(snapshot);

            int slice = Math.min(quantum, p[2]); // rem
            int start = t;
            t += slice;
            p[2] -= slice;
            gantt.add(new GanttBlock(ids.get(idx), start, t));

            // Add newly arrived processes
            for (int i = 0; i < n; i++) {
                if (!done[i] && !inQueue.contains(i) && i != idx &&
                    ps.get(i)[0] > start && ps.get(i)[0] <= t && ps.get(i)[2] > 0) {
                    queue.add(i);
                    inQueue.add(i);
                }
            }

            if (p[2] > 0) {
                queue.add(idx);
                inQueue.add(idx);
            } else {
                done[idx] = true;
                completedCount++;
                results.add(new ProcessResult(ids.get(idx), p[0], p[1], t));
            }

            // Handle idle: queue empty but processes remain
            if (queue.isEmpty() && completedCount < n) {
                // Find next unfinished process by arrival
                int nextIdx = -1;
                int minAt = Integer.MAX_VALUE;
                for (int i = 0; i < n; i++) {
                    if (!done[i] && !inQueue.contains(i) && ps.get(i)[2] > 0 && ps.get(i)[0] < minAt) {
                        minAt = ps.get(i)[0];
                        nextIdx = i;
                    }
                }
                if (nextIdx >= 0) {
                    gantt.add(new GanttBlock("IDLE", t, minAt));
                    readyQueueSnapshots.add(new ArrayList<>());
                    t = minAt;
                    queue.add(nextIdx);
                    inQueue.add(nextIdx);
                }
            }
        }

        ScheduleResponse resp = new ScheduleResponse(gantt, results);
        resp.setReadyQueueSnapshots(readyQueueSnapshots);
        return resp;
    }
}
