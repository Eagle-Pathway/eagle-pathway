// Utility to export objects to CSV securely in the browser
export function exportToCSV<T extends object>(data: T[], filename: string) {
  if (!data || !data.length) return;
  
  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Format rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName as keyof T];
        // Handle nested objects or arrays gracefully
        if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value) as any;
        }
        // Sanitize formula injection: prefix dangerous leading chars with a tab
        const raw = String(value ?? '');
        const sanitized = /^[=+\-@\t\r]/.test(raw) ? `\t${raw}` : raw;
        // Escape embedded quotes and wrap in quotes for CSV
        const safeValue = sanitized.replace(/"/g, '""');
        return `"${safeValue}"`;
      }).join(',')
    )
  ];
  
  // Create Blob and trigger download
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
