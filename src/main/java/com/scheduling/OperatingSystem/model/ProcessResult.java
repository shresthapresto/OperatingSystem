package com.scheduling.OperatingSystem.model;

public class ProcessResult {
    private String id;
    private int at;
    private int bt;
    private int ct;   // completion time
    private int tat;  // turnaround time = ct - at
    private int wt;   // waiting time    = tat - bt

    public ProcessResult() {}

    public ProcessResult(String id, int at, int bt, int ct) {
        this.id = id;
        this.at = at;
        this.bt = bt;
        this.ct = ct;
        this.tat = ct - at;
        this.wt  = this.tat - bt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getAt() { return at; }
    public void setAt(int at) { this.at = at; }

    public int getBt() { return bt; }
    public void setBt(int bt) { this.bt = bt; }

    public int getCt() { return ct; }
    public void setCt(int ct) { this.ct = ct; }

    public int getTat() { return tat; }
    public void setTat(int tat) { this.tat = tat; }

    public int getWt() { return wt; }
    public void setWt(int wt) { this.wt = wt; }
}
