// Care records come from the authenticated API. New workspaces intentionally start empty.
export const mothers = []
export const visits = []
export const activity = []

export function isDemoAccount() { return false }
export function getMother() { return null }
export function getMotherVisits() { return [] }
