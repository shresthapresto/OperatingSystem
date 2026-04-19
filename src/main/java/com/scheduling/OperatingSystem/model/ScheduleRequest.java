package com.scheduling.OperatingSystem.model;

import java.util.List;

public class ScheduleRequest {
    private List<ProcessInput> processes;
    private String algorithm;
    private int quantum = 2;

    public List<ProcessInput> getProcesses() { return processes; }
    public void setProcesses(List<ProcessInput> processes) { this.processes = processes; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public int getQuantum() { return quantum; }
    public void setQuantum(int quantum) { this.quantum = quantum; }
}
