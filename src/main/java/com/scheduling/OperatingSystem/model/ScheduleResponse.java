package com.scheduling.OperatingSystem.model;

import java.util.List;

public class ScheduleResponse {
    private List<GanttBlock> gantt;
    private List<ProcessResult> results;
    private double avgWT;
    private double avgTAT;
    private int maxWT;
    private int maxTAT;
    private List<List<String>> readyQueueSnapshots;

    public ScheduleResponse() {}

    public ScheduleResponse(List<GanttBlock> gantt, List<ProcessResult> results) {
        this.gantt   = gantt;
        this.results = results;
        int n = results.size();
        if (n > 0) {
            this.avgWT  = results.stream().mapToInt(ProcessResult::getWt).average().orElse(0);
            this.avgTAT = results.stream().mapToInt(ProcessResult::getTat).average().orElse(0);
            this.maxWT  = results.stream().mapToInt(ProcessResult::getWt).max().orElse(0);
            this.maxTAT = results.stream().mapToInt(ProcessResult::getTat).max().orElse(0);
            // Round to 2 decimals
            this.avgWT  = Math.round(this.avgWT  * 100.0) / 100.0;
            this.avgTAT = Math.round(this.avgTAT * 100.0) / 100.0;
        }
    }

    public List<GanttBlock> getGantt() { return gantt; }
    public void setGantt(List<GanttBlock> gantt) { this.gantt = gantt; }

    public List<ProcessResult> getResults() { return results; }
    public void setResults(List<ProcessResult> results) { this.results = results; }

    public double getAvgWT() { return avgWT; }
    public void setAvgWT(double avgWT) { this.avgWT = avgWT; }

    public double getAvgTAT() { return avgTAT; }
    public void setAvgTAT(double avgTAT) { this.avgTAT = avgTAT; }

    public int getMaxWT() { return maxWT; }
    public void setMaxWT(int maxWT) { this.maxWT = maxWT; }

    public int getMaxTAT() { return maxTAT; }
    public void setMaxTAT(int maxTAT) { this.maxTAT = maxTAT; }

    public List<List<String>> getReadyQueueSnapshots() { return readyQueueSnapshots; }
    public void setReadyQueueSnapshots(List<List<String>> readyQueueSnapshots) {
        this.readyQueueSnapshots = readyQueueSnapshots;
    }
}
