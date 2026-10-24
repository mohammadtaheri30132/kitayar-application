/**
 * Air Conditioner dynamic state frame pulse generator.
 * Encodes full-state frames (Power, Mode, Target Temperature, Fan Speed, Swing)
 * into raw microsecond pulse arrays for ConsumerIrManager.
 */

export interface AcDesiredState {
  power: boolean;
  temperature: number; // 16..30
  mode: 'cool' | 'heat' | 'dry' | 'fan' | 'auto';
  fanSpeed: 'auto' | 'low' | 'med' | 'high';
  swing: boolean;
}

/**
 * Generate Gree YB0F2 / YAC compliant 38kHz pulse sequence.
 * Widely used by Gree, General, O General, Zaneti, and OEM derivatives in Iran.
 */
export function generateGreeAcRawPattern(state: AcDesiredState): number[] {
  const pulses: number[] = [];

  // Header
  pulses.push(9000);
  pulses.push(4500);

  // Mode mapping: 0=Auto, 1=Cool, 2=Dry, 3=Fan, 4=Heat
  let modeBits = 1; // Default Cool
  switch (state.mode) {
    case 'auto': modeBits = 0; break;
    case 'cool': modeBits = 1; break;
    case 'dry': modeBits = 2; break;
    case 'fan': modeBits = 3; break;
    case 'heat': modeBits = 4; break;
  }

  const powerBit = state.power ? 1 : 0;

  // Fan speed: 0=Auto, 1=Low, 2=Med, 3=High
  let fanBits = 0;
  switch (state.fanSpeed) {
    case 'auto': fanBits = 0; break;
    case 'low': fanBits = 1; break;
    case 'med': fanBits = 2; break;
    case 'high': fanBits = 3; break;
  }

  const swingBit = state.swing ? 1 : 0;
  const tempBits = Math.max(0, Math.min(14, state.temperature - 16)); // 16°C = 0, 30°C = 14

  // Helper to append bits (LSB first)
  const appendBits = (value: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const isOne = ((value >> i) & 1) === 1;
      pulses.push(620); // Mark
      pulses.push(isOne ? 1600 : 540); // Space
    }
  };

  // Block 1 (35 bits):
  // 3 bits Mode
  appendBits(modeBits, 3);
  // 1 bit Power
  appendBits(powerBit, 1);
  // 2 bits Fan
  appendBits(fanBits, 2);
  // 1 bit Swing
  appendBits(swingBit, 1);
  // 1 bit Sleep (0)
  appendBits(0, 1);
  // 4 bits Temp (Temp - 16)
  appendBits(tempBits, 4);
  // 15 bits Timer (0)
  appendBits(0, 15);
  // 8 bits zeros / reserved
  appendBits(0, 8);

  // Block separator
  pulses.push(620);
  pulses.push(20000);

  // Block 2 (32 bits):
  // 3 bits Swing details (0)
  appendBits(0, 3);
  // 1 bit Turbo (0)
  appendBits(0, 1);
  // 1 bit Light (1 = display on)
  appendBits(1, 1);
  // 1 bit Health (0)
  appendBits(0, 1);
  // 1 bit X-Fan (0)
  appendBits(0, 1);
  // 1 bit reserved (0)
  appendBits(0, 1);
  // 16 bits zeros
  appendBits(0, 16);

  // Checksum calculation:
  // Checksum = (Mode - 1) + (Temp - 16) + 5 + (Power ? 1 : 0) + (Fan) mod 16
  let checksum = ((modeBits - 1) + tempBits + 5 + powerBit + fanBits) & 0x0F;
  if (checksum < 0) checksum += 16;
  appendBits(checksum, 4);
  appendBits(0, 4); // high nibble

  // Final stop bit
  pulses.push(620);

  return pulses;
}

/**
 * Generate LG Air Conditioner 28-bit 38kHz pulse sequence.
 */
export function generateLgAcRawPattern(state: AcDesiredState): number[] {
  const pulses: number[] = [];

  // Header: 8500us mark, 4200us space
  pulses.push(8500);
  pulses.push(4200);

  // Byte 1: Fixed LG AC ID = 0x88
  const byte1 = 0x88;

  // Byte 2: Power and Mode
  // If powering off: byte2 = 0xC0
  // If powering on: 0x00 for Cool, 0x04 for Heat, 0x01 for Dry, 0x02 for Fan
  let byte2 = 0x00;
  if (!state.power) {
    byte2 = 0xC0;
  } else {
    switch (state.mode) {
      case 'cool': byte2 = 0x00; break;
      case 'dry': byte2 = 0x01; break;
      case 'fan': byte2 = 0x02; break;
      case 'heat': byte2 = 0x04; break;
      case 'auto': byte2 = 0x03; break;
    }
  }

  // Byte 3: Temperature (Temp - 15) in high nibble, Fan speed in low nibble
  const tempVal = Math.max(1, Math.min(15, state.temperature - 15));
  let fanVal = 0; // 0=Low, 2=Med, 4=High, 5=Auto
  switch (state.fanSpeed) {
    case 'low': fanVal = 0; break;
    case 'med': fanVal = 2; break;
    case 'high': fanVal = 4; break;
    case 'auto': fanVal = 5; break;
  }
  const byte3 = ((tempVal & 0x0F) << 4) | (fanVal & 0x0F);

  // Checksum: sum of nibbles mod 16
  const n1 = (byte1 >> 4) & 0x0F;
  const n2 = byte1 & 0x0F;
  const n3 = (byte2 >> 4) & 0x0F;
  const n4 = byte2 & 0x0F;
  const n5 = (byte3 >> 4) & 0x0F;
  const n6 = byte3 & 0x0F;
  const checksum = (n1 + n2 + n3 + n4 + n5 + n6) & 0x0F;

  // Send 28 bits (MSB first for LG)
  const fullWord = (byte1 << 20) | (byte2 << 12) | (byte3 << 4) | checksum;

  for (let i = 27; i >= 0; i--) {
    const isOne = ((fullWord >> i) & 1) === 1;
    pulses.push(550);
    pulses.push(isOne ? 1600 : 550);
  }

  // Stop bit
  pulses.push(550);

  return pulses;
}
