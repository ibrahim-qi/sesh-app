// Team colors
export type TeamColor = 'red' | 'blue' | 'white' | 'green' | 'purple' | 'yellow'

export const TEAM_COLORS: { value: TeamColor; label: string; hex: string }[] = [
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'white', label: 'White', hex: '#6B7280' },
  { value: 'green', label: 'Green', hex: '#10B981' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'yellow', label: 'Yellow', hex: '#F59E0B' },
]

export function getTeamColorClass(color: TeamColor): string {
  return `team-${color}`
}

export function getTeamColorHex(color: TeamColor | string): string {
  return TEAM_COLORS.find(c => c.value === color)?.hex || '#6B7280'
}
