/**
 * AutoDiag - Top Essential & High-Frequency OBD-II DTC Codes
 * Extracted from the 12,128 deduplicated DTC database.
 * Used for instant frontend autocomplete & offline lookup.
 */

export interface CommonDtcCode {
  code: string;
  type: 'P' | 'C' | 'B' | 'U';
  system: string;
  subsystem: string;
  is_generic: boolean;
  description: string;
  urgency: 'Urgent / Danger' | 'High' | 'Moderate';
  possible_causes: string[];
  garage_advice: string;
}

export const COMMON_DTC_CODES: CommonDtcCode[] = [
  // ================= POWERTRAIN (P) =================
  {
    code: 'P0300',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Ignition System or Misfire',
    is_generic: true,
    description: 'Random or Multiple Cylinder Misfire Detected',
    urgency: 'Urgent / Danger',
    possible_causes: [
      'Worn or fouled spark plugs',
      'Defective ignition coil pack',
      'Clogged or leaking fuel injector',
      'Low cylinder compression or vacuum leak'
    ],
    garage_advice: 'Avoid high engine loads or highway driving. Unburned fuel entering the exhaust will destroy the catalytic converter.'
  },
  {
    code: 'P0301',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Ignition System or Misfire',
    is_generic: true,
    description: 'Cylinder 1 Misfire Detected',
    urgency: 'Urgent / Danger',
    possible_causes: [
      'Cylinder 1 spark plug or coil boot failure',
      'Cylinder 1 ignition coil pack defective',
      'Cylinder 1 fuel injector clogged or wiring open'
    ],
    garage_advice: 'Swap coil 1 with coil 2; if misfire moves to cylinder 2, replace the ignition coil.'
  },
  {
    code: 'P0302',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Ignition System or Misfire',
    is_generic: true,
    description: 'Cylinder 2 Misfire Detected',
    urgency: 'Urgent / Danger',
    possible_causes: [
      'Cylinder 2 spark plug or coil boot failure',
      'Cylinder 2 ignition coil pack defective',
      'Cylinder 2 fuel injector clogged'
    ],
    garage_advice: 'Swap coil 2 with another cylinder to verify component failure.'
  },
  {
    code: 'P0420',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Auxiliary Emissions Controls (EGR, EVAP, Cat)',
    is_generic: true,
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    urgency: 'High',
    possible_causes: [
      'Aged or damaged catalytic converter substrate',
      'Exhaust leak before downstream O2 sensor',
      'Defective heated downstream oxygen sensor'
    ],
    garage_advice: 'Inspect exhaust flex pipe for leaks. If downstream O2 voltage oscillates like upstream, catalytic converter must be replaced.'
  },
  {
    code: 'P0171',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Fuel and Air Metering',
    is_generic: true,
    description: 'System Too Lean (Bank 1)',
    urgency: 'High',
    possible_causes: [
      'Intake manifold gasket or vacuum hose leak',
      'Dirty Mass Air Flow (MAF) sensor wire',
      'Weak fuel pump or clogged fuel filter',
      'Cracked PCV breather hose'
    ],
    garage_advice: 'Perform smoke test on intake system to pinpoint unmetered air leaks. Clean MAF sensor with dedicated cleaner.'
  },
  {
    code: 'P0172',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Fuel and Air Metering',
    is_generic: true,
    description: 'System Too Rich (Bank 1)',
    urgency: 'High',
    possible_causes: [
      'Leaking fuel injector pintle',
      'Excessive fuel pressure (faulty regulator)',
      'Restricted engine air intake filter',
      'EVAP purge valve stuck open'
    ],
    garage_advice: 'Check fuel pressure regulator vacuum hose for gasoline and inspect air filter element.'
  },
  {
    code: 'P0128',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Fuel and Air Metering',
    is_generic: true,
    description: 'Coolant Thermostat (Coolant Temp Below Thermostat Regulating Temp)',
    urgency: 'Moderate',
    possible_causes: [
      'Engine thermostat stuck open',
      'Defective engine coolant temperature (ECT) sensor',
      'Low coolant level or trapped air pocket'
    ],
    garage_advice: 'Engine is running cold and inefficiently. Replace thermostat assembly and fresh coolant.'
  },
  {
    code: 'P0455',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Auxiliary Emissions Controls (EGR, EVAP, Cat)',
    is_generic: true,
    description: 'Evaporative Emission Control System Leak Detected (Gross Leak)',
    urgency: 'Moderate',
    possible_causes: [
      'Fuel tank gas filler cap loose, cracked, or missing',
      'Disconnected or split EVAP charcoal canister vapor hose',
      'EVAP vent solenoid stuck open'
    ],
    garage_advice: 'Tighten gas cap until it clicks 3 times. If code returns, smoke test fuel tank EVAP circuit.'
  },
  {
    code: 'P0102',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Fuel and Air Metering',
    is_generic: true,
    description: 'Mass or Volume Air Flow Circuit Low Input',
    urgency: 'High',
    possible_causes: [
      'Contaminated MAF hot platinum wire',
      'Air leak between MAF and throttle body',
      'Open circuit in MAF harness or disconnected plug'
    ],
    garage_advice: 'Inspect intake ducting for splits and clean MAF sensor.'
  },
  {
    code: 'P0700',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Transmission Controls',
    is_generic: true,
    description: 'Transmission Control System (MIL Request)',
    urgency: 'High',
    possible_causes: [
      'Transmission Control Module (TCM) detected an internal fault',
      'Low transmission fluid level or dirty ATF',
      'Faulty shift solenoid or speed sensor'
    ],
    garage_advice: 'Scan TCM specifically for P07xx subcodes (e.g. shift solenoid or torque converter lockup).'
  },
  {
    code: 'P1120',
    type: 'P',
    system: 'Powertrain (Engine & Transmission)',
    subsystem: 'Manufacturer Specific Powertrain',
    is_generic: false,
    description: 'Throttle Position (TP) Sensor 1 Circuit / Pedal Position',
    urgency: 'Moderate',
    possible_causes: [
      'Throttle Position Sensor (TPS) potentiometer track worn',
      'Accelerator pedal sensor voltage mismatch',
      'Corroded harness connector pins'
    ],
    garage_advice: 'Manufacturer specific: Ford (TP sensor out of range), Lexus/Toyota (Accelerator pedal position sensor), BMW (Pedal sensor).'
  },

  // ================= CHASSIS (C) =================
  {
    code: 'C0035',
    type: 'C',
    system: 'Chassis (Braking, ABS, Suspension)',
    subsystem: 'ABS & Wheel Speed Sensors',
    is_generic: true,
    description: 'Left Front Wheel Speed Sensor Circuit',
    urgency: 'Moderate',
    possible_causes: [
      'Severed wheel speed sensor cable from road debris',
      'Metallic brake dust coating magnetic sensor tip',
      'Cracked or corroded tone reluctor ring on wheel hub'
    ],
    garage_advice: 'Inspect sensor wire in wheel well and clean tone ring with brake cleaner.'
  },
  {
    code: 'C0040',
    type: 'C',
    system: 'Chassis (Braking, ABS, Suspension)',
    subsystem: 'ABS & Wheel Speed Sensors',
    is_generic: true,
    description: 'Right Front Wheel Speed Sensor Circuit',
    urgency: 'Moderate',
    possible_causes: [
      'Sensor connector unplugged or pins oxidized',
      'Sensor internal coil open circuit',
      'Reluctor ring damaged'
    ],
    garage_advice: 'Measure sensor resistance (standard: 800-1500 ohms) and check harness.'
  },
  {
    code: 'C0245',
    type: 'C',
    system: 'Chassis (Braking, ABS, Suspension)',
    subsystem: 'ABS & Wheel Speed Sensors',
    is_generic: true,
    description: 'Wheel Speed Sensor Frequency Error',
    urgency: 'Moderate',
    possible_causes: [
      'Mismatched tire sizes on axle',
      'Wheel bearing excessive play causing air gap variation',
      'Reluctor ring missing teeth'
    ],
    garage_advice: 'Verify tire rolling circumference and check wheel bearing for play.'
  },

  // ================= BODY (B) =================
  {
    code: 'B0001',
    type: 'B',
    system: 'Body (Safety, Airbags, Comfort)',
    subsystem: 'Airbags & Passive Restraints (SRS)',
    is_generic: true,
    description: 'Driver Frontal Stage 1 Deployment Control',
    urgency: 'Urgent / Danger',
    possible_causes: [
      'Steering column clockspring spiral cable broken',
      'Driver airbag squib connector loose or oxidized',
      'Airbag control module circuit fault'
    ],
    garage_advice: 'Airbag system is disabled while fault light is illuminated. Check steering clockspring.'
  },
  {
    code: 'B0028',
    type: 'B',
    system: 'Body (Safety, Airbags, Comfort)',
    subsystem: 'Airbags & Passive Restraints (SRS)',
    is_generic: true,
    description: 'Right Side Airbag Deployment Control',
    urgency: 'Urgent / Danger',
    possible_causes: [
      'Yellow connector under passenger seat kicked or dislodged',
      'High resistance in side squib wiring harness',
      'Passenger seat weight pressure sensor'
    ],
    garage_advice: 'Inspect and re-seat the yellow airbag connector under passenger seat.'
  },

  // ================= NETWORK (U) =================
  {
    code: 'U0100',
    type: 'U',
    system: 'Network (CAN Bus, ECU Communication)',
    subsystem: 'Lost Communication with Modules',
    is_generic: true,
    description: 'Lost Communication With ECM/PCM A',
    urgency: 'High',
    possible_causes: [
      'CAN bus wiring open circuit or short to ground',
      'Blown main engine management fuse',
      'Low battery voltage or bad engine ground strap',
      'Engine Control Module (ECU) internal failure'
    ],
    garage_advice: 'Check 12V battery health, main power relays, and measure 60-ohm CAN bus termination resistance.'
  },
  {
    code: 'U0101',
    type: 'U',
    system: 'Network (CAN Bus, ECU Communication)',
    subsystem: 'Lost Communication with Modules',
    is_generic: true,
    description: 'Lost Communication with Transmission Control Module (TCM)',
    urgency: 'High',
    possible_causes: [
      'TCM power harness connector wet or loose',
      'Transmission fuse blown',
      'CAN communication lines interrupted'
    ],
    garage_advice: 'Check transmission harness round plug on gearbox casing for water or oil ingress.'
  },
  {
    code: 'U0121',
    type: 'U',
    system: 'Network (CAN Bus, ECU Communication)',
    subsystem: 'Lost Communication with Modules',
    is_generic: true,
    description: 'Lost Communication With Anti-Lock Brake System (ABS) Control Module',
    urgency: 'High',
    possible_causes: [
      'ABS pump 40A fuse blown',
      'ABS module connector multi-pin latch loose or corroded',
      'CAN bus wiring fault'
    ],
    garage_advice: 'Check main ABS fuses in engine bay box and inspect ABS multi-pin connector.'
  }
];
