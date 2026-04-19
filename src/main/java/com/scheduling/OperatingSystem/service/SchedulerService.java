package com.scheduling.OperatingSystem.service;

import com.scheduling.OperatingSystem.algorithms.FcfsAlgorithm;
import com.scheduling.OperatingSystem.algorithms.RrAlgorithm;
import com.scheduling.OperatingSystem.algorithms.SjfAlgorithm;
import com.scheduling.OperatingSystem.algorithms.SrtfAlgorithm;
import com.scheduling.OperatingSystem.model.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SchedulerService {

    private final FcfsAlgorithm fcfs;
    private final SjfAlgorithm sjf;
    private final RrAlgorithm rr;
    private final SrtfAlgorithm srtf;

    public SchedulerService(FcfsAlgorithm fcfs, SjfAlgorithm sjf,
                            RrAlgorithm rr, SrtfAlgorithm srtf) {
        this.fcfs = fcfs;
        this.sjf  = sjf;
        this.rr   = rr;
        this.srtf = srtf;
    }

    public ScheduleResponse schedule(ScheduleRequest req) {
        List<ProcessInput> procs = req.getProcesses();
        int q = req.getQuantum() < 1 ? 2 : req.getQuantum();

        return switch (req.getAlgorithm().toLowerCase()) {
            case "sjf"  -> sjf.run(procs, q);
            case "rr"   -> rr.run(procs, q);
            case "srtf" -> srtf.run(procs, q);
            default     -> fcfs.run(procs, q);   // "fcfs" or unknown
        };
    }

    public CompareResponse compareAll(ScheduleRequest req) {
        List<ProcessInput> procs = req.getProcesses();
        int q = req.getQuantum() < 1 ? 2 : req.getQuantum();

        List<AlgoResult> results = List.of(
            toAlgoResult("fcfs", "FCFS",             fcfs.run(procs, q)),
            toAlgoResult("sjf",  "SJF",              sjf.run(procs, q)),
            toAlgoResult("rr",   "RR (q=" + q + ")", rr.run(procs, q)),
            toAlgoResult("srtf", "SRTF",             srtf.run(procs, q))
        );

        return new CompareResponse(results);
    }

    private AlgoResult toAlgoResult(String key, String label, ScheduleResponse resp) {
        return new AlgoResult(key, label, resp.getResults());
    }
}
