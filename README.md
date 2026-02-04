# Arduino Sim Project

A browser-based Arduino component simulator built with React.

- **Drag and drop** Arduino Uno, LED, and Push Button components from a palette.
- Visually wire components virtually in a workspace.
- Simulate LED/Button behavior.
- Generate downloadable Arduino `.ino` source code for your virtual circuit.

## Features

- **Intuitive Drag-and-Drop Palette**  
  Drag Arduino Uno, LED, and Push Button directly from the left sidebar into your workspace.  
  Live ghost/preview supports precise placement.

- **Component Simulation**  
  - Components can be moved around freely once placed.
  - Unique constraints: Only one Arduino Uno per project.
  - LED follows button state when circuit is simulated.

- **Pin Calibration and Visualization**  
  - Virtual pin calibration for Arduino Uno physical layout.
  - Wire rendering between components and Arduino pins.

- **Auto-Code Generation**  
  - Instantly generates Arduino `.ino` code matching your virtual circuit.
  - Includes pin mappings for all placed LEDs and Buttons.
  - Download code with a single click.

## Usage

1. **Clone & Install**
   ```sh
   git clone https://github.com/KrishO2O2/arduino-sim-Project.git
   cd arduino-sim-Project/arduino-sim
   npm install
   ```
2. **Run Locally**
   ```sh
   npm run dev
   ```
   Then open the local address in your browser (usually `http://localhost:5173`).

3. **Build**
   ```sh
   npm run build
   ```

## How to Use

1. **Drag Components**:  
   - Grab an item from the **Component Palette** (left).
   - Drag it into the workspace to add and place a new Arduino, LED, or Button.
2. **Wire Up**:  
   - Wires appear automatically between components and the Arduino using chosen pins.
   - Only one Arduino Uno allowed.
3. **Simulate**:  
   - Click **Start** to run the simulation (LED and button will interact).
   - **Stop** to pause simulation.
4. **Pin Calibration**:  
   - Optionally calibrate pin layout for visual accuracy.
5. **Download Arduino Code**:  
   - Switch to **Code View** to preview generated code.
   - Click **Download .ino** to save and use in the Arduino IDE.

## Screenshots

![Uploading Screenshot 2026-02-04 at 10.55.14 PM.png…]()


## Project Structure

- `src/App.jsx` – Main React component logic & drag-and-drop implementation
- `public/` – Static assets
- `arduino-sim/` – App source code

## License

MIT

---

**Made by [KrishO2O2](https://github.com/KrishO2O2)**
