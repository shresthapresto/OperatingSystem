package com.scheduling.OperatingSystem.model;

import java.util.List;

public class AlgoResult {
    private String key;
    private String label;
    private List<ProcessResult> metrics;
    private double avgWT;
    private double avgTAT;
    private int maxWT;
    private int maxTAT;

    public AlgoResult() {}

    public AlgoResult(String key, String label, List<ProcessResult> metrics) {
        this.key     = key;
        this.label   = label;
        this.metrics = metrics;
        int n = metrics.size();
        if (n > 0) {
            double aw  = metrics.stream().mapToInt(ProcessResult::getWt).average().orElse(0);
            double at  = metrics.stream().mapToInt(ProcessResult::getTat).average().orElse(0);
            this.avgWT  = Math.round(aw  * 100.0) / 100.0;
            this.avgTAT = Math.round(at  * 100.0) / 100.0;
            this.maxWT  = metrics.stream().mapToInt(ProcessResult::getWt).max().orElse(0);
            this.maxTAT = metrics.stream().mapToInt(ProcessResult::getTat).max().orElse(0);
        }
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public List<ProcessResult> getMetrics() { return metrics; }
    public void setMetrics(List<ProcessResult> metrics) { this.metrics = metrics; }

    public double getAvgWT() { return avgWT; }
    public void setAvgWT(double avgWT) { this.avgWT = avgWT; }

    public double getAvgTAT() { return avgTAT; }
    public void setAvgTAT(double avgTAT) { this.avgTAT = avgTAT; }

    public int getMaxWT() { return maxWT; }
    public void setMaxWT(int maxWT) { this.maxWT = maxWT; }

    public int getMaxTAT() { return maxTAT; }
    public void setMaxTAT(int maxTAT) { this.maxTAT = maxTAT; }
}
