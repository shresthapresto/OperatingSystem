package com.scheduling.OperatingSystem.model;

public class GanttBlock {
    private String id;
    private int start;
    private int end;

    public GanttBlock() {}

    public GanttBlock(String id, int start, int end) {
        this.id = id;
        this.start = start;
        this.end = end;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getStart() { return start; }
    public void setStart(int start) { this.start = start; }

    public int getEnd() { return end; }
    public void setEnd(int end) { this.end = end; }
}
