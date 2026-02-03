import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import "@wokwi/elements";

class Errorboundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Errorboundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#b91c1c" }}>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#111" }}>{String(this.state.error)}</pre>
          <p>Open DevTools console for full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [components, setComponents] = useState([]);
  const [viewMode, setViewMode] = useState("components");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isLedOn, setIsLedOn] = useState(false);
  const [arduinoVisualMetrics, setArduinoVisualMetrics] = useState(null);

  const workspaceRef = useRef(null);

  // Calibration state
  const calClicksRef = useRef([]);
  const [calMarkers, setCalMarkers] = useState([]);
  const [calMapping, setCalMapping] = useState(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calOverlayVisible, setCalOverlayVisible] = useState(false);

  const PIN_ORDER = ["GND", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2"]; 

  const BASE_PIN_GEOMETRY = {
    width: 300,
    height: 200,
    startX: 115.5,
    spacing: 10.2,
    gap: 18.0,
    y: 35
  };

  const DEFAULT_PIN_NUDGE = {
    x: 16,
    y: 2
  };

  // Default pin offsets (scale to actual Arduino element size)
  const generatePinOffsets = () => {
    const metrics = arduinoVisualMetrics;
    const scaleX = metrics ? metrics.width / BASE_PIN_GEOMETRY.width : 1;
    const scaleY = metrics ? metrics.height / BASE_PIN_GEOMETRY.height : 1;
    const startX = BASE_PIN_GEOMETRY.startX * scaleX + (metrics?.offsetX || 0) + DEFAULT_PIN_NUDGE.x;
    const spacing = BASE_PIN_GEOMETRY.spacing * scaleX;
    const gap = BASE_PIN_GEOMETRY.gap * scaleX;
    const y = BASE_PIN_GEOMETRY.y * scaleY + (metrics?.offsetY || 0) + DEFAULT_PIN_NUDGE.y;
    const mapping = {};
    PIN_ORDER.forEach((pin, i) => {
      let xPos = startX + i * spacing;
      if (i > 6) xPos += gap;
      mapping[pin] = { x: xPos, y };
    });
    return mapping;
  };
  const pinOffsetsRaw = generatePinOffsets();

  // Helpers
  const findArduino = () => components.find((c) => c.type === "ARDUINO");
  const addComponent = (type) => {
    if (components.find((c) => c.type === type)) {
      alert(`You can only have one ${type} in this exercise.`);
      return;
    }
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    let pin = undefined;
    if (type === "LED") pin = "10";
    if (type === "BUTTON") pin = "2";
    setComponents((prev) => [
      ...prev,
      { id: newId, type, x: 100 + prev.length * 20, y: 100 + prev.length * 20, pin }
    ]);
  };

  const updatePosition = (id, x, y) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const updatePin = (id, newPin) => {
    const conflict = components.find((c) => c.id !== id && c.pin === newPin);
    if (conflict) {
      alert(`Pin ${newPin} is already used by another component.`);
      return;
    }
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, pin: newPin } : c)));
  };

  const getAvailablePins = (currentComponentId) => {
    const allPins = ["13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const usedPins = components.filter((c) => c.id !== currentComponentId).map((c) => c.pin).filter(Boolean);
    return allPins.filter((p) => !usedPins.includes(p));
  };

  // LED follows button press when running
  useEffect(() => {
    if (isSimulating) {
      const btn = components.find((c) => c.type === "BUTTON");
      const led = components.find((c) => c.type === "LED");
      if (btn && led && isButtonPressed) setIsLedOn(true);
      else setIsLedOn(false);
    } else {
      setIsLedOn(false);
    }
  }, [isSimulating, isButtonPressed, components]);

  // Calibration
  const startCalibration = () => {
    if (!workspaceRef.current) {
      alert("Workspace not ready.");
      return;
    }
    const arduinoComp = findArduino();
    if (!arduinoComp) {
      alert("Place an Arduino first, then calibrate.");
      return;
    }
    calClicksRef.current = [];
    setCalMarkers([]);
    setCalMapping(null);
    setCalOverlayVisible(false);
    setCalibrating(true);
  };

  const onCalibrationPointerDown = (e) => {
    if (!calibrating || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    calClicksRef.current.push({ x, y });
    setCalMarkers((prev) => [...prev, { x, y, n: calClicksRef.current.length }]);
    if (calClicksRef.current.length === 3) finalizeCalibrationFromRef();
    e.stopPropagation();
    e.preventDefault();
  };

  const finalizeCalibrationFromRef = () => {
    const clicks = calClicksRef.current.slice();
    const arduinoComp = findArduino();
    if (!arduinoComp) {
      alert("Arduino missing during calibration.");
      setCalibrating(false);
      return;
    }
    const P0 = clicks[0].x,
      P6 = clicks[1].x,
      P12 = clicks[2].x;
    const startX = P0;
    const spacing = (P6 - P0) / 6;
    const gap = P12 - (startX + 12 * spacing);
    const yAvg = (clicks[0].y + clicks[1].y + clicks[2].y) / 3;
    const mappingLocal = {};
    PIN_ORDER.forEach((pin, i) => {
      let xAbs = startX + i * spacing;
      if (i > 6) xAbs += gap;
      mappingLocal[pin] = { x: xAbs - arduinoComp.x, y: yAvg - arduinoComp.y };
    });
    setCalMapping(mappingLocal);
    setCalOverlayVisible(true);
    setCalibrating(false);
    setCalMarkers([]);
  };

  const clearCalibration = () => {
    calClicksRef.current = [];
    setCalMarkers([]);
    setCalMapping(null);
    setCalOverlayVisible(false);
    setCalibrating(false);
  };

  // Code generation and download
  const generateCode = () => {
    const led = components.find((c) => c.type === "LED");
    const btn = components.find((c) => c.type === "BUTTON");
    const ledPin = led ? led.pin || "10" : "10";
    const btnPin = btn ? btn.pin || "2" : "2";
    return `// Auto-Generated Code\nconst int buttonPin = ${btnPin};\nconst int ledPin = ${ledPin};\n\nvoid setup() {\n  pinMode(buttonPin, INPUT);\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  int buttonState = digitalRead(buttonPin);\n  if (buttonState == HIGH) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n}`;
  };

  const downloadCode = () => {
    const code = generateCode();
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.ino";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const arduino = findArduino();

  // Geometry helper
  const intersectLineRect = (cx, cy, ex, ey, rect) => {
    const dx = ex - cx;
    const dy = ey - cy;
    const candidates = [];

    if (Math.abs(dx) > 1e-6) {
      const tLeft = (rect.left - cx) / dx;
      if (tLeft > 0 && tLeft <= 1) {
        const y = cy + tLeft * dy;
        if (y >= rect.top - 0.001 && y <= rect.top + rect.height + 0.001) candidates.push({ t: tLeft, x: rect.left, y });
      }
      const tRight = (rect.left + rect.width - cx) / dx;
      if (tRight > 0 && tRight <= 1) {
        const y = cy + tRight * dy;
        if (y >= rect.top - 0.001 && y <= rect.top + rect.height + 0.001) candidates.push({ t: tRight, x: rect.left + rect.width, y });
      }
    }
    if (Math.abs(dy) > 1e-6) {
      const tTop = (rect.top - cy) / dy;
      if (tTop > 0 && tTop <= 1) {
        const x = cx + tTop * dx;
        if (x >= rect.left - 0.001 && x <= rect.left + rect.width + 0.001) candidates.push({ t: tTop, x, y: rect.top });
      }
      const tBottom = (rect.top + rect.height - cy) / dy;
      if (tBottom > 0 && tBottom <= 1) {
        const x = cx + tBottom * dx;
        if (x >= rect.left - 0.001 && x <= rect.left + rect.width + 0.001) candidates.push({ t: tBottom, x, y: rect.top + rect.height });
      }
    }

    if (candidates.length === 0) {
      return { x: cx, y: cy };
    }
    candidates.sort((a, b) => a.t - b.t);
    return { x: candidates[0].x, y: candidates[0].y };
  };

  const styles = {
    layout: { display: "flex", height: "100vh", fontFamily: "sans-serif", overflow: "hidden" },
    palette: { width: "250px", backgroundColor: "#e5e7eb", borderRight: "2px solid #9ca3af", padding: "20px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 20 },
    paletteItem: { padding: "15px", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "5px", cursor: "pointer", textAlign: "center", fontWeight: "bold", boxShadow: "0 2px 2px rgba(0,0,0,0.1)" },
    workspace: { flex: 1, position: "relative", backgroundColor: "#f3f4f6" },
    toolbar: { position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", backgroundColor: "white", padding: "10px 20px", borderRadius: "8px", display: "flex", gap: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 100 },
    btn: { padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: "bold" },
    codePanel: { position: "absolute", bottom: 0, width: "100%", height: "220px", backgroundColor: "#1e1e1e", color: "#00ff00", padding: "20px", fontFamily: "monospace", borderTop: "4px solid #444", zIndex: 50, display: viewMode === "code" ? "block" : "none" },
    svgLayer: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }
  };

  // safe fallbacks for Wokwi elements
  const hasWokwiArduino = typeof customElements !== "undefined" && !!customElements.get("wokwi-arduino-uno");
  const hasWokwiLed = typeof customElements !== "undefined" && !!customElements.get("wokwi-led");
  const hasWokwiButton = typeof customElements !== "undefined" && !!customElements.get("wokwi-pushbutton");

  return (
    <Errorboundary>
      <div style={styles.layout}>
        <div style={styles.palette}>
          <h3>Component Palette</h3>
          <p style={{ fontSize: "11px", color: "#666" }}>Arduino, LED, Push Button</p>
          <div style={styles.paletteItem} onClick={() => addComponent("ARDUINO")}>+ Arduino Uno</div>
          <div style={styles.paletteItem} onClick={() => addComponent("LED")}>+ LED (Red)</div>
          <div style={styles.paletteItem} onClick={() => addComponent("BUTTON")}>+ Push Button</div>
        </div>

        <div ref={workspaceRef} style={styles.workspace}>
          <svg style={styles.svgLayer}>
            {components
              .filter((comp) => comp.type !== "ARDUINO" && comp.pin)
              .map((comp) => {
                if (!arduino) return null;
                const pin = comp.pin;
                if (!pin) return null;

                let endX, endY;
                if (calMapping && calMapping[pin]) {
                  endX = arduino.x + calMapping[pin].x;
                  endY = arduino.y + calMapping[pin].y;
                } else {
                  const pinOffset = pinOffsetsRaw[pin] || pinOffsetsRaw["13"];  
                  endX = arduino.x + pinOffset.x;
                  endY = arduino.y + pinOffset.y;
                }

                const cardWidth = 110;
                const cardHeight = 100;
                const rect = { left: comp.x, top: comp.y, width: cardWidth, height: cardHeight };

                const cx = rect.left + rect.width / 2;
                const cy = rect.top + (comp.type === "LED" ? 22 : 40);

                const intersect = intersectLineRect(cx, cy, endX, endY, rect);

                let dx = endX - intersect.x;
                let dy = endY - intersect.y;
                let dist = Math.hypot(dx, dy) || 1;

                const compShort = 6;
                const ardShort = 3;

                const startX = intersect.x + (dx * (compShort / dist));
                const startY = intersect.y + (dy * (compShort / dist));
                const endXVis = endX - (dx * (ardShort / dist));
                const endYVis = endY - (dy * (ardShort / dist));

                const color = comp.type === "BUTTON" ? "blue" : "green";

                return (
                  <g key={`wire-${comp.id}`}> 
                    <line x1={startX} y1={startY} x2={endXVis} y2={endYVis} stroke={color} strokeWidth="3" strokeLinecap="round" />
                    {(comp.type === "LED" || comp.type === "BUTTON") && (
                      <g pointerEvents="none">
                        <circle cx={intersect.x} cy={intersect.y} r={6} fill="#fff" />
                        <circle cx={intersect.x} cy={intersect.y} r={3} fill={color} />
                      </g>
                    )}
                  </g>
                );
              })}
            {arduino && (() => {
              const arefOffset = pinOffsetsRaw["GND"] || { x: 115.5, y: 35 };
              const maskCX = arduino.x + arefOffset.x;
              const maskCY = arduino.y + arefOffset.y;
              return (
                <g key="aref-mask" pointerEvents="none">
                  <circle cx={maskCX} cy={maskCY} r={4} fill="#fff" stroke="#d1d5db" strokeWidth="0.6" />
                </g>
              );
            })()}
            {calibrating &&
              calMarkers.map((m) => (
                <g key={`tmp-${m.n}`} transform={`translate(${m.x}, ${m.y})`} pointerEvents="none">
                  <circle r="6" fill="rgba(255,128,0,0.95)" />
                  <text x="0" y="4" fontSize="10" fontFamily="Arial" fill="#fff" textAnchor="middle" alignmentBaseline="middle">{m.n}</text>
                </g>
              ))}
            {calOverlayVisible && calMapping && arduino &&
              Object.entries(calMapping).map(([name, local]) => {
                const cx = arduino.x + local.x;
                const cy = arduino.y + local.y;
                return (
                  <g key={`pinmark-${name}`} transform={`translate(${cx}, ${cy})`} pointerEvents="none">
                    <circle r="4" fill="rgba(0,160,60,0.95)" stroke="#083" strokeWidth="0.8" />
                  </g>
                );
              })}
          </svg>

          <div style={styles.toolbar}>
            <button style={{ ...styles.btn, backgroundColor: isSimulating ? "#fca5a5" : "#86efac" }} onClick={() => setIsSimulating(!isSimulating)}>
              {isSimulating ? "■ Stop" : "▶ Start"}
            </button>

            <div style={{ display: "flex", border: "1px solid #cbd5f5", borderRadius: 6, overflow: "hidden" }}>
              <button
                style={{ ...styles.btn, borderRadius: 0, backgroundColor: viewMode === "components" ? "#bfdbfe" : "#e5e7eb" }}
                onClick={() => setViewMode("components")}
              >
                Component View
              </button>
              <button
                style={{ ...styles.btn, borderRadius: 0, backgroundColor: viewMode === "code" ? "#bfdbfe" : "#e5e7eb" }}
                onClick={() => setViewMode("code")}
              >
                Code View
              </button>
            </div>

            <button style={{ ...styles.btn, backgroundColor: calibrating ? "#fde68a" : "#c7f9cc" }} onClick={() => startCalibration()}>
              {calibrating ? "Click GND → 8 → 2" : "Calibrate Pins"}
            </button>

            <button style={{ ...styles.btn, backgroundColor: "#fee2e2" }} onClick={() => clearCalibration()}> 
              Clear Calibration
            </button>

            <button style={{ ...styles.btn, backgroundColor: "#d1fae5" }} onClick={downloadCode}>
              Download .ino
            </button>
          </div>

          {calibrating && (
            <div
              onPointerDown={onCalibrationPointerDown}
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 99999,
                background: "rgba(255,255,255,0.01)",
                pointerEvents: "auto",
                userSelect: "none",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center"
              }}
            >
              <div style={{ marginTop: 12, padding: "6px 10px", background: "rgba(0,0,0,0.65)", color: "#fff", borderRadius: 6, fontSize: 13 }}>
                Calibration active — click GND → Pin 8 → Pin 2 (shield)
              </div>
            </div>
          )}

          {components.map((comp) => (
            <DraggableComponent
              key={comp.id}
              data={comp}
              updatePosition={updatePosition}
              updatePin={updatePin}
              isLedOn={isLedOn}
              setIsButtonPressed={setIsButtonPressed}
              availablePins={getAvailablePins(comp.id)}
              dragDisabled={calibrating}
              hasWokwiArduino={hasWokwiArduino}
              hasWokwiLed={hasWokwiLed}
              hasWokwiButton={hasWokwiButton}
              onArduinoMeasure={comp.type === "ARDUINO" ? setArduinoVisualMetrics : undefined}
            />
          ))}

          <div style={styles.codePanel}>
            <h3 style={{ color: "#00ff6a", marginTop: 0 }}>Arduino Code (Generated)</h3>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{generateCode()}</pre>
          </div>
        </div>
      </div>
    </Errorboundary>
} 

// Draggable component UI (controlled Draggable)
function DraggableComponent({
  data,
  updatePosition,
  updatePin,
  isLedOn,
  setIsButtonPressed,
  availablePins,
  dragDisabled,
  hasWokwiArduino,
  hasWokwiLed,
  hasWokwiButton,
  onArduinoMeasure
}) {
  const nodeRef = useRef(null);
  const arduinoRef = useRef(null);

  useEffect(() => {
    if (data.type !== "ARDUINO" || !onArduinoMeasure || !arduinoRef.current || !nodeRef.current) return;
    const update = () => {
      if (!arduinoRef.current || !nodeRef.current) return;
      const cardRect = nodeRef.current.getBoundingClientRect();
      const arduinoRect = arduinoRef.current.getBoundingClientRect();
      onArduinoMeasure({
        width: arduinoRect.width,
        height: arduinoRect.height,
        offsetX: arduinoRect.left - cardRect.left,
        offsetY: arduinoRect.top - cardRect.top
      });
    };
    update();
    const raf = requestAnimationFrame(update);
    const timeout = setTimeout(update, 300);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      window.removeEventListener("resize", update);
    };
  }, [data.type, onArduinoMeasure]);

  // numeric sort for pins, keep non-numeric like "GND" first
  const pinValue = (p) => {
    if (p === undefined || p === null) return Number.POSITIVE_INFINITY;
    if (p === "GND") return -1;
    const n = parseInt(p, 10);
    return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
  };

  const dropdownOptions = [...new Set([...(availablePins || []), data.pin].filter(Boolean))].sort((a, b) => pinValue(a) - pinValue(b));

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      position={{ x: data.x, y: data.y }}
      onDrag={(e, d) => updatePosition(data.id, d.x, d.y)}
      onStop={(e, d) => updatePosition(data.id, d.x, d.y)}
      disabled={!!dragDisabled}
    >
      <div
        ref={nodeRef}
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: 6,
          boxShadow: "0 6px 12px rgba(0,0,0,0.12)"
        }}
      >
        <div className="drag-handle" style={{ width: "100%", height: 20, backgroundColor: "#4b5563", borderTopLeftRadius: 6, borderTopRightRadius: 6, cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 30, height: 4, backgroundColor: "#9ca3af", borderRadius: 2 }} />
        </div>

        <div style={{ padding: 10, minWidth: 90 }}>
          {data.type === "ARDUINO" && (
            <div ref={arduinoRef} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {hasWokwiArduino ? (
                <wokwi-arduino-uno></wokwi-arduino-uno>
              ) : (
                <div style={{ width: 120, height: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #ddd" }}>Arduino</div>
              )}
            </div>
          )}

          {data.type === "LED" && (
            <>
              {hasWokwiLed ? <wokwi-led color="red" value={isLedOn ? 1 : 0}></wokwi-led> : <div style={{ width: 20, height: 20, borderRadius: 10, background: isLedOn ? "red" : "#420000" }} />}
              <select value={data.pin || ""} onChange={(e) => updatePin(data.id, e.target.value)} style={{ marginTop: 6, fontSize: 12, width: "100%" }}>
                {dropdownOptions.map((p) => (
                  <option key={p} value={p}>Pin {p}</option>
                ))}
              </select>
            </>
          )}

          {data.type === "BUTTON" && (
            <>
              <div
                onPointerDown={() => setIsButtonPressed(true)}
                onPointerUp={() => setIsButtonPressed(false)}
                onPointerLeave={() => setIsButtonPressed(false)}
                style={{ cursor: "pointer", display: "inline-block" }}
              >
                {hasWokwiButton ? <wokwi-pushbutton></wokwi-pushbutton> : <div style={{ width: 36, height: 24, background: "#ddd", borderRadius: 4 }} />}
              </div>
              <select value={data.pin || ""} onChange={(e) => updatePin(data.id, e.target.value)} style={{ marginTop: 6, fontSize: 12, width: "100%" }}>
                {dropdownOptions.map((p) => (
                  <option key={p} value={p}>Pin {p}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>
    </Draggable>
  );
}