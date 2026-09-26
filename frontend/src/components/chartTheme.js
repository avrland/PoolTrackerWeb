// ApexCharts needs concrete colors for SVG strokes and tooltip/legend options.
export function chartTheme(theme) {
  return theme === 'dark' ? {
    text: '#c1c6d6', muted: '#8b90a0', grid: '#414754',
    series: ['#60a5fa', '#fb923c', '#34d399'],
  } : {
    text: '#424655', muted: '#727787', grid: '#e1e2ee',
    series: ['#0D6EFD', '#FF771D', '#20C997'],
  }
}
