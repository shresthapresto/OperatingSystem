package com.scheduling.OperatingSystem.model;

public class ProcessInput {
    private String id;
    private int at;       // arrival time
    private int bt;       // burst time
    private Integer pr;   // priority (optional; lower = higher priority)

    public ProcessInput() {}

    public ProcessInput(String id, int at, int bt, Integer pr) {
        this.id = id;
        this.at = at;
        this.bt = bt;
        this.pr = pr;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getAt() { return at; }
    public void setAt(int at) { this.at = at; }

    public int getBt() { return bt; }
    public void setBt(int bt) { this.bt = bt; }

    public Integer getPr() { return pr; }
    public void setPr(Integer pr) { this.pr = pr; }
}
