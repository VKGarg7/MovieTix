export const ACCOMMODATION_OPTIONS = [
    { value: 'houseLightsUp', label: 'House lights not fully dimmed' },
    { value: 'lowerVolume', label: 'Volume capped below standard' },
    { value: 'noTrailers', label: 'No trailers or strobing pre-show content' },
    { value: 'movementTalkingOk', label: 'Movement & talking permitted' },
];

export const ACCOMMODATION_VALUES = ACCOMMODATION_OPTIONS.map(o => o.value);

export const ACCOMMODATION_LABELS = Object.fromEntries(ACCOMMODATION_OPTIONS.map(o => [o.value, o.label]));
