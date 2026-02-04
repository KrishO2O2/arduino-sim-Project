# Arduino Sim Project

A browser-based Arduino component simulator built with React.

## Overview
- Drag and drop Arduino Uno, LED, and Push Button components from a palette.
- Visually wire components in a workspace.
- Simulate LED/Button behavior.
- Generate downloadable Arduino `.ino` source code for your virtual circuit.

---

## Features

### Intuitive Drag‑and‑Drop Palette
- Drag Arduino Uno, LED, and Push Button directly from the left sidebar.
- Live ghost/preview supports precise placement.

### Component Simulation
- Components can be moved freely after placement.
- Constraint: only one Arduino Uno allowed.
- LED follows button state when simulation is running.

### Pin Calibration & Visualization
- Optional pin calibration for Arduino Uno layout accuracy.
- Wire rendering between components and Arduino pins.

### Auto‑Code Generation
- Instantly generates Arduino `.ino` code for the placed LED and Button.
- Updates automatically when pin assignments change.
- Download code with a single click.

> Note: Current logic/code generation supports one LED + one Button at a time.

---

## Usage

### Clone & Install
```bash
git clone https://github.com/KrishO2O2/arduino-sim-Project.git
cd arduino-sim-Project/arduino-sim
npm install
```

### Run Locally
```bash
npm run dev
```
Then open the local address (usually http://localhost:5173).

### Build
```bash
npm run build
```

---

## How to Use

### 1) Drag Components
- Grab an item from the Component Palette (left).
- Drop it into the workspace to add a new Arduino, LED, or Button.

### 2) Auto‑Wire
- Wires appear automatically between components and the Arduino using chosen pins.
- Only one Arduino Uno is allowed.

### 3) Simulate
- Click **Start** to run the simulation (LED and button will interact).
- Click **Stop** to pause simulation.

### 4) Pin Calibration (Optional)
- Calibrate pin layout for visual accuracy.

### 5) Download Arduino Code
- Switch to **Code View** to preview generated code.
- Click **Download .ino** to save and use in the Arduino IDE.

---

## Screenshots
<img width="1440" height="900" alt="Screenshot 2026-02-05 at 12 01 23 AM" src="https://github.com/user-attachments/assets/cdd4e402-f101-4902-9dc7-c0548dfbbdb5" />

---

## Project Structure
- `arduino-sim/src/App.jsx` – Main React component logic & drag‑and‑drop implementation
- `arduino-sim/public/` – Static assets
- `arduino-sim/` – App source code

---

## License
MIT

---

Made by **KrishO2O2**
