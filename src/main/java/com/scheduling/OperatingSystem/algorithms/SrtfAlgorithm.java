package com.scheduling.OperatingSystem.algorithms;

import com.scheduling.OperatingSystem.model.GanttBlock;
import com.scheduling.OperatingSystem.model.ProcessInput;
import com.scheduling.OperatingSystem.model.ProcessResult;
import com.scheduling.OperatingSystem.model.ScheduleResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SrtfAlgorithm implements SchedulingAlgorithm {

    @Override
    public ScheduleResponse run(List<ProcessInput> processes, int quantum) {
        int n = processes.size();
        int[] rem  = new int[n];
        int[] at   = new int[n];
        int[] bt   = new int[n];
        String[] ids = new String[n];
        for (int i = 0; i < n; i++) {
            ProcessInput p = processes.get(i);
            ids[i] = p.getId();
            at[i]  = p.getAt();
            bt[i]  = p.getBt();
            rem[i] = p.getBt();
        }

        List<GanttBlock> gantt = new ArrayList<>();
        List<ProcessResult> results = new ArrayList<>();
        List<List<String>> readyQueueSnapshots = new ArrayList<>();
        int t = 0, done = 0;
        String lastId = null;

        // Ensure Gantt always starts at t=0
        int firstArrival = Integer.MAX_VALUE;
        for (int i = 0; i < n; i++) if (at[i] < firstArrival) firstArrival = at[i];
        firstArrival = (firstArrival == Integer.MAX_VALUE) ? 0 : firstArrival;
        if (firstArrival > 0) {
            gantt.add(new GanttBlock("IDLE", 0, firstArrival));
            readyQueueSnapshots.add(new ArrayList<>());
            t = firstArrival;
            lastId = null;
        }

        while (done < n) {
            // Find process with shortest remaining time that has arrived
            int sel = -1;
            int minRem = Integer.MAX_VALUE;
            for (int i = 0; i < n; i++) {
                if (rem[i] > 0 && at[i] <= t) {
                    if (rem[i] < minRem || (rem[i] == minRem && at[i] < at[sel])) {
                        minRem = rem[i];
                        sel = i;
                    }
                }
            }

            if (sel == -1) {
                // CPU idle — jump to next arrival
                int minAt = Integer.MAX_VALUE;
                for (int i = 0; i < n; i++) {
                    if (rem[i] > 0 && at[i] < minAt) minAt = at[i];
                }
                gantt.add(new GanttBlock("IDLE", t, minAt));
                readyQueueSnapshots.add(new ArrayList<>());
                t = minAt;
                lastId = null;
                continue;
            }

            // Build snapshot: arrived, remaining > 0, not the selected process
            List<String> snapshot = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if (i != sel && rem[i] > 0 && at[i] <= t) {
                    snapshot.add(ids[i]);
                }
            }
            readyQueueSnapshots.add(snapshot);

            // Extend last block or create new one
            if (ids[sel].equals(lastId)) {
                gantt.get(gantt.size() - 1).setEnd(t + 1);
            } else {
                gantt.add(new GanttBlock(ids[sel], t, t + 1));
            }
            lastId = ids[sel];
            rem[sel]--;
            t++;

            if (rem[sel] == 0) {
                results.add(new ProcessResult(ids[sel], at[sel], bt[sel], t));
                done++;
            }
        }

        // Merge consecutive same-id blocks (they should already be merged above, but be safe)
        List<GanttBlock> merged = new ArrayList<>();
        for (GanttBlock b : gantt) {
            if (!merged.isEmpty() && merged.get(merged.size() - 1).getId().equals(b.getId())) {
                merged.get(merged.size() - 1).setEnd(b.getEnd());
            } else {
                merged.add(new GanttBlock(b.getId(), b.getStart(), b.getEnd()));
            }
        }

        ScheduleResponse resp = new ScheduleResponse(merged, results);
        resp.setReadyQueueSnapshots(readyQueueSnapshots);
        return resp;
    }
}
