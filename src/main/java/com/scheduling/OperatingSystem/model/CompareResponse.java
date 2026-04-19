package com.scheduling.OperatingSystem.model;

import java.util.List;

public class CompareResponse {
    private List<AlgoResult> algorithms;

    public CompareResponse() {}
    public CompareResponse(List<AlgoResult> algorithms) { this.algorithms = algorithms; }

    public List<AlgoResult> getAlgorithms() { return algorithms; }
    public void setAlgorithms(List<AlgoResult> algorithms) { this.algorithms = algorithms; }
}
