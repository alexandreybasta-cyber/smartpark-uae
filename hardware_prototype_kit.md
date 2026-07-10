# SpotSense — IoT Prototype Kit

> Edge mmWave sensor → WiFi → Backend → Live App  
> **Budget: ~AED 111 / ~$30 USD**  
> **Minimum viable: 1 sensor + 1 ESP32 + power bank = working demo**

---

## Shopping List — Ships to Dubai

### ESP32-C3 SuperMini (WiFi Brain)

| Item | Price | Delivery | Link |
|------|-------|----------|------|
| ESP32-C3 SuperMini Dev Board | AED 34 | Jul 12–13 (In Stock) | [Buy on Amazon.ae](https://www.amazon.ae/ESP32-C3-Development-Board-Bluetooth-SuperMini/dp/B0F5MXD9DH) |

### LD2410B mmWave Radar Sensor

| Item | Price | Delivery | Link |
|------|-------|----------|------|
| JESSINIE HLK-LD2410B-P (with cable) | AED 54 | ~5 days ⚠️ Only 1 left | [Buy on Amazon.ae](https://www.amazon.ae/JESSINIE-HLK-LD2410B-P-Presence-Bluetooth-LD2410B/dp/B0C36FRVHR) |
| EC Buying HLK-LD2410B (backup) | AED 137 | FREE delivery Jul 17–20 | [Buy on Amazon.ae](https://www.amazon.ae/EC-Buying-HLK-LD2410B-Intelligent-Bluetooth/dp/B0BXDP2C8L) |
| AEDIKO 4pcs LD2410B (multi-bay) | 4-pack | Check listing | [Buy on Amazon.ae](https://www.amazon.ae/AEDIKO-LD2410B-Presence-Bluetooth-HLK-LD2410/dp/B0GWM4TKJD) |

### Jumper Wires

| Item | Price | Delivery | Link |
|------|-------|----------|------|
| MMOBIEL 120pcs Dupont Wires | AED 23 | Next-Day delivery | [Buy on Amazon.ae](https://www.amazon.ae/MMOBIEL-120-Multicolored-Dupont-Breadboard/dp/B09CGZVLMQ) |

### Power
**Use any USB power bank you already have.** Plug USB-C into the ESP32. Done.

---

## ⚡ Fastest vs 💰 Cheapest

| | Fastest (Amazon.ae) | Cheapest (AliExpress) |
|---|---|---|
| **Total** | ~AED 111 | ~AED 40 (~$10) |
| ESP32-C3 | AED 34 — Jul 12–13 | [~$2 — 7-15 days](https://www.aliexpress.com/item/1005005877531694.html) |
| LD2410B | AED 54 — ~5 days | [~$4 — 7-15 days](https://www.aliexpress.com/item/1005005266032192.html) |
| Wires | AED 23 — tomorrow | [~$4 — 7-15 days](https://www.aliexpress.com/item/1005004229929779.html) |
| **Start building** | This weekend | In ~2 weeks |

---

## Wiring (4 wires only)

```
LD2410B          ESP32-C3 SuperMini
───────          ──────────────────
VCC    ────────→ 3.3V
GND    ────────→ GND
OUT    ────────→ GPIO 4  (digital: HIGH = car detected)
TX     ────────→ GPIO 5  (optional: distance data via UART)
```

> OUT pin goes HIGH when something is within range (car parked), LOW when bay is clear.

---

## How It Connects to the App

1. **LD2410B sensor** detects presence (car parked or not)
2. **ESP32** reads GPIO pin, connects to WiFi (or phone hotspot)
3. **HTTP POST** → `POST /api/sensors/{sensor_id}/heartbeat` with `{"occupied": true}`
4. **Backend** updates Spot status in database
5. **WebSocket broadcast** → all connected apps update in real-time
6. **iOS / Web / Mobile** — spot turns red (occupied) or green (free) live

---

## Future: 3G/4G Connectivity

For the demo, WiFi (or phone hotspot) is enough. For field deployment without WiFi, swap the ESP32-C3 for a **LilyGO T-SIM7600** (~AED 100–130) — it's an ESP32 with a built-in 4G modem. Insert any UAE SIM card and it works anywhere with cellular coverage.

---

## 3-Day Plan

| Day | You | Software (ready when hardware arrives) |
|-----|-----|---------------------------------------|
| **1** | Order parts on Amazon.ae | ESP32 firmware + backend endpoint written |
| **2** | Wire 4 cables, flash firmware via USB-C | Test full pipeline end-to-end |
| **3** | Place near parking spot, walk in/out | Watch app update live — demo ready |

---

## Checklist

- [ ] Order ESP32-C3 SuperMini on Amazon.ae
- [ ] Order LD2410B sensor on Amazon.ae
- [ ] Order jumper wires (or confirm you have some)
- [ ] Confirm USB-C cable + power bank on hand
- [ ] Backend: `/api/sensors/{id}/heartbeat` endpoint added
- [ ] Firmware: ESP32 Arduino .ino written and tested
- [ ] Wire sensor → ESP32 (4 wires)
- [ ] Flash firmware via USB
- [ ] Connect to WiFi / hotspot
- [ ] End-to-end test: sensor → backend → app shows live update
