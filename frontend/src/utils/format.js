export const formatDate = value => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
export const initialsFor = name => (name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('')
