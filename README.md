## 📄 Verification Report
📥 [Download Verification Report](docs/Shrestha_Prabhakar_Report_CPU.pdf)

---

# Operating System CPU Scheduler
A web-based CPU Scheduling Simulator that visualizes how operating systems allocate CPU time using animated Gantt charts, real-time step-by-step simulation, and side-by-side algorithm comparison. Built with a **Spring Boot** backend and a fully interactive **HTML/CSS/JavaScript** frontend.

---

## Description

This application lets you input process details, arrival time, burst time, and time quantum then simulate and visualize how different CPU scheduling algorithms handle those processes. It calculates key performance metrics like waiting time, turnaround time, and completion time, and renders everything as an animated Gantt chart with a live ready-queue display.

Designed as an educational tool for CS Operating Systems students and enthusiasts who want to see scheduling algorithms in action rather than just reading about them.

---

## Features

### Scheduling Algorithms
- **FCFS** – First Come First Serve
- **SJF** – Shortest Job First (Non-Preemptive)
- **Round Robin (RR)** – with configurable Time Quantum
- **SRTF** – Shortest Remaining Time First (Preemptive SJF)

### Visualization
-  Animated **Gantt Chart** with color-coded process blocks
- ️**Step-by-step simulation** mode with speed control and replay
-  **Ready Queue panel** that updates live during simulation
-  **Algorithm Analysis panel** with contextual insights and verdict

### Performance Metrics
- Waiting Time (WT) per process
- Turnaround Time (TAT) per process
- Completion Time (CT) per process
- Average WT, Average TAT, Max WT, Max TAT

### Comparison & Export
-  **Compare All** — runs all 4 algorithms on the same input and ranks them
-  Interactive line charts comparing average/max metrics across algorithms
-  Winner banner highlighting the best-performing algorithm
-  **Download CVS** — full results with Gantt chart
-  **Download Table** — results table only as a clean CVS

### UI/UX
- 🌙 / ☀️ Dark and Light theme toggle (warm creamy light theme)
- Animated CPU background with floating OS/scheduling nodes
- Responsive design for desktop and mobile
- Hover tooltips on Gantt blocks showing per-process metrics

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.4.1 |
| Backend | Java, Spring Boot |
| Build Tool | Maven |

---

## ⚙️ Installation & Setup

### Prerequisites
- Java 17+
- Maven 3.8+
- Any modern browser (Chrome, Firefox, Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/shresthapresto/OperatingSystem.git
cd OperatingSystem
```

### 2. Backend Setup (Spring Boot)

**Using terminal:**
```bash
./mvnw spring-boot:run
```

**Using IDE (IntelliJ / Eclipse):**
- Open the project
- Run the main `Application.java` class

The backend will start at `http://localhost:8080`

### 3. Frontend Setup

- Navigate to the frontend folder
- Open `index.html` directly in your browser

> ⚠️ Make sure the Spring Boot backend is running before using the app. A warning banner will appear if the backend is unreachable.

---

## ▶️ Usage

1. Click **Get Started** from the home screen
2. Set the **number of processes** and select a **scheduling algorithm**
3. For Round Robin, set the **Time Quantum**
4. Enter **Arrival Time** and **Burst Time** for each process
5. Click one of:
    - **▶ Run** — instantly generate the Gantt chart and results table
    - **⏱ Simulate Step-by-Step** — watch the CPU execute block by block
    - **⚡ Compare All** — run all algorithms and see which wins
6. Download results using **📄 Download CVS** or **📊 Download Table**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/schedule` | Run a single scheduling algorithm |
| POST | `/api/compare` | Run and compare all algorithms |

---

## 📁 Project Structure

```
OperatingSystem/
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── logoImg.png
├── src/
│   └── main/
│       └── java/
│           └── com/scheduling/OperatingSystem/
│               ├── OperatingSystemApplication.java
│               ├── controller/
│               │   └── SchedulerController.java
│               ├── model/
│               │   ├── Process.java
│               │   └── ScheduleRequest.java
│               └── service/
│                   ├── FCFSService.java
│                   ├── SJFService.java
│                   ├── RoundRobinService.java
│                   └── SRTFService.java
├── pom.xml
├── mvnw
├── mvnw.cmd
├── HELP.md
└── README.md
```
---

## 📄 License

This project is licensed under the **MIT License**, see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Prabhakar Shrestha**

- GitHub: [@shresthapresto](https://github.com/shresthapresto)

---

##  Future Improvements

- [ ] Add **Priority Scheduling** (preemptive and non-preemptive)
- [ ] Add **Multilevel Feedback Queue (MLFQ)**
- [ ] Add **Aging** to prevent starvation in priority scheduling
- [ ] Add unit tests for scheduling algorithms
- [ ] Export Gantt chart as image (PNG/SVG)
- [ ] Add user authentication and save simulation history
- [ ] Mobile-optimized Gantt chart view

---

> Built to support Computer Science students in understanding how CPU scheduling algorithms work & how a processor handles processes within an operating system through interactive algorithm visuals. Because seeing is understanding.