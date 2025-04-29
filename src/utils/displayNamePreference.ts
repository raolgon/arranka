/**
 * Gets the display name preference for a specific arranke from localStorage
 * @param arrankeName The name of the arranke
 * @returns The display name preference ('full_name', 'username', or 'default')
 */
export function getDisplayNamePreference(arrankeName: string | null | undefined): 'full_name' | 'username' | 'default' {
    if (!arrankeName) return 'default';
    
    try {
        const preferences = JSON.parse(localStorage.getItem('arranke_display_preferences') || '{}');
        return preferences[arrankeName] || 'default';
    } catch (e) {
        console.error("Error getting display preference from localStorage:", e);
        return 'default';
    }
}

/**
 * Gets the display name for an arranke based on the preference
 * @param arrankeName The name of the arranke
 * @param ownerName The full name of the owner
 * @param ownerUsername The username of the owner
 * @param displayNamePreference Optional override for the preference
 * @returns The display name based on the preference
 */
export function getDisplayName(
    arrankeName: string | null | undefined,
    ownerName: string | null | undefined,
    ownerUsername: string | null | undefined,
    displayNamePreference?: 'full_name' | 'username' | 'default'
): string {
    const preference = displayNamePreference || getDisplayNamePreference(arrankeName);
    
    if (preference === 'full_name' && ownerName) {
        return ownerName;
    } else if (preference === 'username' && ownerUsername) {
        return ownerUsername;
    } else {
        // Default: use full name if available, otherwise username
        return ownerName || ownerUsername || "usuario";
    }
}
