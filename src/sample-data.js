/** Public, invented web-demo fixtures. No firmware source or real scan data. */
export const samples = {
  detailed: {
    label: 'Fuller history', banks: [3568, 3567, 3570, 3540, 3599],
    charges: 128, chargeMinutes: 2057, lowStarts: 3,
    dischargeAh: 60, nominalAh: 5, faults: 2,
    load: [40, 95, 70, 43, 30, 14, 7, 2],
    conditions: { startTemp: 22, endTemp: 29, startBank: 3250, endBank: 4180 },
  },
  limited: {
    label: 'Limited history', banks: [3810, 3808, 3812, 3809, 3811],
    charges: 42, chargeMinutes: 1110, lowStarts: null,
    dischargeAh: 40, nominalAh: 12, faults: null, load: null, conditions: null,
  },
};

export function summarize(banks) {
  if (!Array.isArray(banks) || banks.length !== 5 || banks.some(v => !Number.isFinite(v) || v < 0)) {
    throw new TypeError('A sample must contain five finite, nonnegative millivolt readings.');
  }
  const low = Math.min(...banks);
  const high = Math.max(...banks);
  return { voltage: banks.reduce((sum, v) => sum + v, 0) / 1000, low, high, spread: high - low };
}

const available = (value, format = String) => value == null ? 'Unavailable' : format(value);

export function displayValues(sample) {
  const summary = summarize(sample.banks);
  return {
    voltage: summary.voltage.toFixed(2), spread: String(summary.spread),
    charges: available(sample.charges),
    chargeTime: available(sample.chargeMinutes, m => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`),
    lowStarts: available(sample.lowStarts),
    discharge: available(sample.dischargeAh, v => v.toFixed(2)),
    cycles: sample.dischargeAh == null || !Number.isFinite(sample.nominalAh) || sample.nominalAh <= 0
      ? 'Unavailable' : (sample.dischargeAh / sample.nominalAh).toFixed(1),
    faults: available(sample.faults),
    startTemp: available(sample.conditions?.startTemp, v => `${v} °C`),
    endTemp: available(sample.conditions?.endTemp, v => `${v} °C`),
    startBank: available(sample.conditions?.startBank, v => `${(v / 1000).toFixed(3)} V`),
    endBank: available(sample.conditions?.endBank, v => `${(v / 1000).toFixed(3)} V`),
  };
}

export function csvCell(value) {
  let text = value == null ? '' : String(value);
  // Defense in depth if future fixtures ever include spreadsheet formula text.
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function sampleCsv(profile) {
  if (!Object.hasOwn(samples, profile)) throw new RangeError('Unknown sample profile.');
  const s = samples[profile], summary = summarize(s.banks);
  const rows = [
    ['source', 'profile', 'field', 'value', 'unit', 'availability', 'kind'],
  ];
  const add = (field, value, unit = '', kind = 'illustrative pack-reported field') => rows.push([
    'ILLUSTRATIVE WEB DEMO — NOT A REAL SCAN', s.label, field, value, unit,
    value == null ? 'unavailable' : 'available', kind,
  ]);
  s.banks.forEach((v, i) => add(`cell_bank_${i + 1}`, v, 'mV'));
  add('bank_voltage_sum', summary.voltage.toFixed(3), 'V', 'calculated from sample banks');
  add('cell_bank_spread', summary.spread, 'mV', 'calculated');
  add('charge_count', s.charges);
  add('charge_time', s.chargeMinutes, 'minutes');
  add('low_voltage_charge_starts', s.lowStarts);
  add('cumulative_discharge', s.dischargeAh, 'Ah');
  add('nominal_capacity', s.nominalAh, 'Ah', 'illustrative nominal capacity');
  add('estimated_equivalent_cycles', s.dischargeAh == null || !s.nominalAh ? null : (s.dischargeAh / s.nominalAh).toFixed(3), 'cycles', 'estimate, not remaining capacity');
  add('fault_events', s.faults);
  for (let i = 0; i < 8; i++) add(`illustrative_load_band_${i + 1}`, s.load?.[i] ?? null, 'relative units', 'simplified web chart, not firmware bins');
  add('charge_start_temperature', s.conditions?.startTemp, '°C');
  add('charge_end_temperature', s.conditions?.endTemp, '°C');
  add('lowest_charge_start_bank', s.conditions?.startBank, 'mV');
  add('highest_charge_end_bank', s.conditions?.endBank, 'mV');
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
