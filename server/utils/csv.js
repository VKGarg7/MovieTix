export const csvField = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const csvRow = (values) => values.map(csvField).join(',') + '\r\n';
