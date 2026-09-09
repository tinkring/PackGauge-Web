// Website-only illustrations. These are not scans of a physical battery.
const common = {
  banks: [3568, 3567, 3570, 3540, 3599],
  charges: 112,
  chargeTime: '34h 17m',
  discharge: 60,
};
export const samples = {
  full: { ...common, label: 'Fuller history', events: 36, load: [18, 32, 24, 16, 7, 3], startTemperature: 25, endTemperature: 31 },
  limited: { ...common, label: 'Limited history', events: null, load: null, startTemperature: null, endTemperature: null },
};
export function getSample(key) {
  if (!Object.hasOwn(samples, key)) throw new RangeError('Unknown sample profile');
  return samples[key];
}
export function bankSpread(banks) {
  if (!Array.isArray(banks) || banks.length !== 5 || !banks.every(Number.isFinite)) {
    throw new TypeError('Five finite cell-bank readings are required');
  }
  return Math.max(...banks) - Math.min(...banks);
}
export function displayValue(value, unit = '') {
  return value == null ? 'Unavailable' : `${value}${unit ? ` ${unit}` : ''}`;
}
export function sampleCsv(key) {
  const sample = getSample(key);
  const rows = [
    ['source', 'profile', 'field', 'value', 'unit'],
    ...sample.banks.map((value, index) => ['illustrative web sample', sample.label, `bank_${index + 1}`, value, 'mV']),
    ['illustrative web sample', sample.label, 'bank_spread', bankSpread(sample.banks), 'mV'],
    ['illustrative web sample', sample.label, 'charge_count', sample.charges, ''],
    ['illustrative web sample', sample.label, 'charge_time', sample.chargeTime, ''],
    ['illustrative web sample', sample.label, 'total_discharge', sample.discharge, 'Ah'],
    ['illustrative web sample', sample.label, 'low_voltage_charge_starts', sample.events ?? 'Unavailable', ''],
    ['illustrative web sample', sample.label, 'charge_start_temperature', sample.startTemperature ?? 'Unavailable', 'C'],
    ['illustrative web sample', sample.label, 'charge_end_temperature', sample.endTemperature ?? 'Unavailable', 'C'],
    ...Array.from({ length: 6 }, (_, index) => ['illustrative web sample', sample.label, `load_${index * 10}_${(index + 1) * 10}A`, sample.load?.[index] ?? 'Unavailable', '%']),
  ];
  return rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
}
