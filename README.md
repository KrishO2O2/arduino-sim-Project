Arduino Sim Project
===================

A browser-based Arduino component simulator built with React.  
Drag and drop components, wire them virtually, simulate LED/button behavior, and auto-generate Arduino code.

Features
--------

- Drag-and-drop Arduino Uno, LED, and Button components
- Auto-wire visualization between components and pins
- Component vs Code View toggle
- Arduino code generation + download (`.ino`)
- Pin calibration system for accurate wiring
- Simulation mode for LED/Button interaction

Tech Stack
----------

- React
- Vite
- @wokwi/elements
- react-draggable

Getting Started
---------------

1) Install dependencies
```bash
npm install
```

2) Run the app
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

Project Structure
-----------------

```
arduino-sim/
  src/
    App.jsx
    App.css
    main.jsx
  public/
```

Usage
-----

1. Click **+ Arduino**, **+ LED**, or **+ Button** from the palette.
2. Drag components around the canvas.
3. Use **Component View / Code View** to switch modes.
4. Click **Start** to simulate behavior.
5. Download auto-generated Arduino code with **Download .ino**.

Notes
-----

- Only one Arduino board can be added.
- Pin conflicts are prevented automatically.

Screenshot
----------

_Add a screenshot here if you want._

License
-------
MIT
