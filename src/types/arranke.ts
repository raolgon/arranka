export interface Arranke {
    id: string | number;
    arranke_name: string;
    arranke_slogan?: string;
    arranke_description?: string;
    arranke_url?: string;
    arranke_category?: string;
    logo_url?: string;
    owner_id?: string;
    owner_name?: string; // Full name from profile
    owner_username?: string; // Username from profile
    display_name_preference?: 'full_name' | 'username' | 'default'; // Which name to display in cards and pages
    likes?: number;
    dislikes?: number;
    views?: number;
    // Stats from arrankes_stats table
    likes_count?: number;
    dislikes_count?: number;
    visit_count?: number;
    clicks_count?: number;
    created_at?: string;
    updated_at?: string;
}
