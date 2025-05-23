export interface Arranke {
    id?: number;
    arranke_name: string | null;
    arranke_slogan: string | null;
    arranke_description: string | null;
    arranke_url: string | null;
    logo_url: string | null;
    owner_id: string | null;
    owner_name: string | null;
    owner_username: string | null;
    display_name_preference: 'full_name' | 'username' | 'default';
    arranke_category: string | null;
    // New fields
    status: 'pending' | 'approved' | 'rejected';
    submission_date: string;
    approval_date?: string;
    is_premium: boolean;
    // Stats fields
    likes_count?: number;
    dislikes_count?: number;
    visit_count?: number;
    clicks_count?: number;
    // Timestamp fields
    created_at?: string;
    updated_at?: string;
}
