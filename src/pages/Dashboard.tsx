import { useState, useEffect } from 'react';
import { Rocket, Eye, ThumbsUp, ThumbsDown, ArrowUpDown, Search, Plus, ExternalLink, Trash2, Edit, X } from "lucide-react";
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

interface Arranke {
    id: number;
    arranke_name: string;
    arranke_slogan: string;
    arranke_description: string;
    arranke_url: string;
    arranke_category: string;
    logo_url: string;
    owner_id: string;
    owner_name: string;
    owner_username?: string | null;
    display_name_preference?: 'full_name' | 'username' | 'default';
    // Stats from arrankes_stats table
    likes_count: number;
    dislikes_count: number;
    visit_count: number;
    clicks_count: number;
    created_at: string;
    updated_at: string;
}

interface User {
    id: string;
    email: string;
}

interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    arrankes?: string[];
}

const Dashboard = () => {
    const [arrankes, setArrankes] = useState<Arranke[]>([]);
    const [filteredArrankes, setFilteredArrankes] = useState<Arranke[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile>({ id: '', username: '', full_name: '', avatar_url: '' });
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof Arranke>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentArranke, setCurrentArranke] = useState<Arranke | null>(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [stats, setStats] = useState({
        totalArrankes: 0,
        totalViews: 0,
        totalLikes: 0,
        totalDislikes: 0,
        mostViewedArranke: null as Arranke | null,
        mostLikedArranke: null as Arranke | null,
        recentArranke: null as Arranke | null
    });

    const navigate = useNavigate();

    useEffect(() => {
        getSession();
    }, []);

    useEffect(() => {
        if (user) {
            getProfile(user.id);
            getArrankes(user.id);
        }
    }, [user]);

    useEffect(() => {
        // Apply filters and sorting
        let result = [...arrankes];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(arranke =>
                arranke.arranke_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arranke.arranke_description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            result = result.filter(arranke => arranke.arranke_category === selectedCategory);
        }

        // Sort
        result.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                // Handle numbers and other types
                return sortDirection === 'asc'
                    ? (aValue as any) - (bValue as any)
                    : (bValue as any) - (aValue as any);
            }
        });

        setFilteredArrankes(result);
    }, [arrankes, searchTerm, sortField, sortDirection, selectedCategory]);

    useEffect(() => {
        if (arrankes.length > 0) {
            calculateStats();
        }
    }, [arrankes]);

    async function getSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUser({
                id: session.user.id,
                email: session.user.email || ''
            });
        } catch (error: any) {
            console.error("Error al obtener la sesión:", error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function getProfile(userId: string) {
        try {
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setProfile({
                    id: data.id,
                    username: data.username || '',
                    full_name: data.full_name || '',
                    avatar_url: data.avatar_url || '',
                    arrankes: data.arrankes || []
                });
            }
        } catch (error: any) {
            console.error("Error al obtener el perfil:", error);
            showToast(error.message, 'error');
        }
    }

    async function getArrankes(userId: string) {
        try {
            // First, get all arrankes for this user
            let { data: arrankeData, error: arrankeError } = await supabase
                .from('arrankes')
                .select('*')
                .eq('owner_id', userId)
                .order('created_at', { ascending: false });

            if (arrankeError) throw arrankeError;

            if (arrankeData && arrankeData.length > 0) {
                // Get stats for all arrankes
                const arrankeIds = arrankeData.map(arranke => arranke.id);

                let { data: statsData, error: statsError } = await supabase
                    .from('arrankes_stats')
                    .select('*')
                    .in('id', arrankeIds);

                if (statsError) {
                    console.error("Error fetching arranke stats:", statsError);
                    // Continue with default values if stats fetch fails
                }

                // Create a map of stats by arranke id for quick lookup
                const statsMap: Record<string, any> = {};
                if (statsData) {
                    statsData.forEach(stat => {
                        statsMap[stat.id] = stat;
                    });
                }

                // Combine arranke data with stats
                const arrankeWithStats = arrankeData.map(arranke => {
                    const stats = statsMap[arranke.id] || {};
                    return {
                        ...arranke,
                        // Use stats data if available, otherwise default to 0
                        likes_count: stats.likes_count || 0,
                        dislikes_count: stats.dislikes_count || 0,
                        visit_count: stats.visit_count || 0,
                        clicks_count: stats.clicks_count || 0
                    };
                });

                setArrankes(arrankeWithStats);
            } else {
                setArrankes([]);
            }
        } catch (error: any) {
            console.error("Error al obtener los arrankes:", error);
            showToast(error.message, 'error');
        }
    }

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }

    function openDeleteModal(arranke: Arranke) {
        setCurrentArranke(arranke);
        setIsDeleteModalOpen(true);
    }

    function openEditModal(arranke: Arranke) {
        setCurrentArranke(arranke);
        setIsEditModalOpen(true);
    }

    async function updateArranke(e: React.FormEvent) {
        e.preventDefault();
        if (!currentArranke || !user) return;
        setUpdateLoading(true);

        try {
            const { error } = await supabase
                .from('arrankes')
                .update({
                    arranke_name: currentArranke.arranke_name,
                    arranke_slogan: currentArranke.arranke_slogan,
                    arranke_description: currentArranke.arranke_description,
                    arranke_url: currentArranke.arranke_url,
                    logo_url: currentArranke.logo_url,
                    updated_at: new Date()
                })
                .eq('id', currentArranke.id);

            // Store display name preference in localStorage
            if (!error && currentArranke.display_name_preference && currentArranke.arranke_name) {
                try {
                    // Store preference for this specific arranke
                    const preferences = JSON.parse(localStorage.getItem('arranke_display_preferences') || '{}');
                    preferences[currentArranke.arranke_name] = currentArranke.display_name_preference;
                    localStorage.setItem('arranke_display_preferences', JSON.stringify(preferences));
                } catch (e) {
                    console.error("Error saving display preference to localStorage:", e);
                }
            }

            if (error) throw error;

            // Update the arranke in the local state
            setArrankes(prev => prev.map(arranke =>
                arranke.id === currentArranke.id ? currentArranke : arranke
            ));

            showToast('¡Arranke actualizado con éxito!', 'success');
            setIsEditModalOpen(false);
        } catch (error: any) {
            console.error("Error al actualizar el arranke:", error);
            showToast(error.message, 'error');
        } finally {
            setUpdateLoading(false);
        }
    }

    async function deleteArranke() {
        if (!currentArranke || !user) return;
        setUpdateLoading(true);

        try {
            // 1. Delete the arranke stats FIRST (due to foreign key constraint)
            try {
                const { error: statsError } = await supabase
                    .from('arrankes_stats')
                    .delete()
                    .eq('id', currentArranke.id);

                if (statsError) {
                    console.error("Error deleting arranke stats:", statsError);
                    // This is critical - if we can't delete stats, we can't delete the arranke
                    throw statsError;
                }
            } catch (statsError: any) {
                console.error("Exception deleting arranke stats:", statsError);
                // Rethrow the error to stop the deletion process
                throw new Error(`Failed to delete arranke stats: ${statsError.message}`);
            }

            // 2. Delete user votes for this arranke
            try {
                const { error: votesError } = await supabase
                    .from('user_votes')
                    .delete()
                    .eq('arranke_id', currentArranke.id);

                if (votesError) {
                    console.error("Error deleting user votes:", votesError);
                    // Continue even if votes deletion fails
                }
            } catch (votesError) {
                console.error("Exception deleting user votes:", votesError);
                // Continue even if votes deletion fails
            }

            // 3. Delete the logo image from Supabase storage if it exists
            if (currentArranke.logo_url) {
                try {
                    // Extract the file path from the URL
                    // The URL format is typically like: https://[supabase-project].supabase.co/storage/v1/object/public/logos/[user-id]/[random-id].[ext]
                    const logoUrl = new URL(currentArranke.logo_url);
                    const pathParts = logoUrl.pathname.split('/');

                    // Find the part of the path after 'logos/'
                    const logosBucketIndex = pathParts.findIndex(part => part === 'logos');
                    if (logosBucketIndex !== -1 && logosBucketIndex < pathParts.length - 1) {
                        // Construct the file path relative to the 'logos' bucket
                        const filePath = pathParts.slice(logosBucketIndex + 1).join('/');

                        // Delete the file from storage
                        const { error: storageError } = await supabase.storage
                            .from('logos')
                            .remove([filePath]);

                        if (storageError) {
                            console.error("Error deleting logo from storage:", storageError);
                            // Continue even if logo deletion fails
                        } else {
                            console.log("Successfully deleted logo from storage:", filePath);
                        }
                    }
                } catch (storageError) {
                    console.error("Exception deleting logo from storage:", storageError);
                    // Continue even if logo deletion fails
                }
            }

            // 4. Remove the arranke ID from the user's profile
            if (profile.arrankes && profile.arrankes.includes(currentArranke.id.toString())) {
                // Filter out the deleted arranke ID
                const updatedArrankes = profile.arrankes.filter(id => id !== currentArranke.id.toString());

                // Update the profile in Supabase
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ arrankes: updatedArrankes })
                    .eq('id', user.id);

                if (profileError) {
                    console.error("Error updating profile arrankes:", profileError);
                    // Continue even if profile update fails
                } else {
                    // Update the local profile state
                    setProfile(prev => ({
                        ...prev,
                        arrankes: updatedArrankes
                    }));
                }
            }

            // 5. Finally, delete the arranke from the arrankes table
            const { error: deleteError } = await supabase
                .from('arrankes')
                .delete()
                .eq('id', currentArranke.id)
                .eq('owner_id', user.id); // Security check to ensure user owns the arranke

            if (deleteError) throw deleteError;

            // Update the local state to remove the deleted arranke
            setArrankes(prev => prev.filter(arranke => arranke.id !== currentArranke.id));
            showToast('¡Arranke eliminado con éxito!', 'success');
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Error al eliminar el arranke:", error);
            showToast(error.message, 'error');
        } finally {
            setUpdateLoading(false);
        }
    }

    function calculateStats() {
        const totalArrankes = arrankes.length;
        const totalViews = arrankes.reduce((sum, arranke) => sum + (arranke.visit_count || 0), 0);
        const totalLikes = arrankes.reduce((sum, arranke) => sum + (arranke.likes_count || 0), 0);
        const totalDislikes = arrankes.reduce((sum, arranke) => sum + (arranke.dislikes_count || 0), 0);

        // Find most viewed arranke
        const mostViewedArranke = [...arrankes].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))[0] || null;

        // Find most liked arranke
        const mostLikedArranke = [...arrankes].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))[0] || null;

        // Find most recent arranke
        const recentArranke = [...arrankes].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] || null;

        setStats({
            totalArrankes,
            totalViews,
            totalLikes,
            totalDislikes,
            mostViewedArranke,
            mostLikedArranke,
            recentArranke
        });
    }

    function handleSort(field: keyof Arranke) {
        if (field === sortField) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to descending
            setSortField(field);
            setSortDirection('desc');
        }
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getCategoryLabel(categoryValue: string) {
        // Extract the main category from the value (e.g., "software_app_web" -> "Software")
        const mainCategory = categoryValue.split('_')[0];

        const categories: Record<string, string> = {
            'software': 'Software',
            'hardware': 'Hardware',
            'entretenimiento': 'Entretenimiento',
            'social': 'Redes Sociales',
            'comercio': 'Comercio',
            'experiencia': 'Experiencias',
            'otros': 'Otros'
        };

        return categories[mainCategory] || categoryValue;
    }

    function getCategoryColor(categoryValue: string) {
        const mainCategory = categoryValue.split('_')[0];

        const colors: Record<string, string> = {
            'software': 'badge-primary',
            'hardware': 'badge-secondary',
            'entretenimiento': 'badge-accent',
            'social': 'badge-info',
            'comercio': 'badge-success',
            'experiencia': 'badge-warning',
            'otros': 'badge-neutral'
        };

        return colors[mainCategory] || 'badge-neutral';
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="text-lg">Cargando tu dashboard...</p>
                </div>
            </div>
        );
    }

    return(
        <div className="min-h-screen bg-base-200 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="card-title text-2xl mb-2">Bienvenido a tu Dashboard, {profile.username || user?.email?.split('@')[0] || 'Usuario'}</h2>
                                <p className="text-base-content/70">Aquí puedes gestionar y analizar todos tus arrankes</p>
                            </div>
                            <Link to="/newArranke" className="btn btn-primary">
                                <Plus size={18} />
                                Nuevo Arranke
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="stats shadow mb-8 w-full stats-vertical lg:stats-horizontal">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <Rocket size={24} />
                        </div>
                        <div className="stat-title">Total Arrankes</div>
                        <div className="stat-value text-primary">{stats.totalArrankes}</div>
                        {stats.recentArranke && (
                            <div className="stat-desc">
                                Último: {formatDate(stats.recentArranke.created_at)}
                            </div>
                        )}
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <Eye size={24} />
                        </div>
                        <div className="stat-title">Vistas Totales</div>
                        <div className="stat-value text-secondary">{stats.totalViews}</div>
                        {stats.mostViewedArranke && (
                            <div className="stat-desc">
                                Más visto: {stats.mostViewedArranke.arranke_name}
                            </div>
                        )}
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <div className="flex gap-2">
                                <ThumbsUp size={20} />
                                <ThumbsDown size={20} />
                            </div>
                        </div>
                        <div className="stat-title">Interacciones</div>
                        <div className="stat-value text-accent">{stats.totalLikes + stats.totalDislikes}</div>
                        <div className="stat-desc">
                            {stats.totalLikes} likes / {stats.totalDislikes} dislikes
                        </div>
                    </div>
                </div>

                {/* Featured Arrankes */}
                {arrankes.length > 0 && (
                    <div className="card bg-base-100 shadow-xl mb-8">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6">Arrankes Destacados</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {stats.mostViewedArranke && (
                                    <div className="card bg-base-200 shadow-md">
                                        <div className="card-body">
                                            <h3 className="card-title text-lg">Más Visto</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="avatar">
                                                    <div className="w-12 h-12 rounded-xl">
                                                        <img
                                                            src={stats.mostViewedArranke.logo_url || '/placeholder-logo.png'}
                                                            alt="Logo"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold">{stats.mostViewedArranke.arranke_name}</p>
                                                    <p className="text-sm text-base-content/70">{stats.mostViewedArranke.visit_count} vistas</p>
                                                </div>
                                            </div>
                                            <div className="card-actions justify-end mt-2">
                                                <Link to={`/arranke/${stats.mostViewedArranke.arranke_name}`} className="btn btn-sm btn-ghost">
                                                    Ver detalles
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {stats.mostLikedArranke && (
                                    <div className="card bg-base-200 shadow-md">
                                        <div className="card-body">
                                            <h3 className="card-title text-lg">Más Gustado</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="avatar">
                                                    <div className="w-12 h-12 rounded-xl">
                                                        <img
                                                            src={stats.mostLikedArranke.logo_url || '/placeholder-logo.png'}
                                                            alt="Logo"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold">{stats.mostLikedArranke.arranke_name}</p>
                                                    <p className="text-sm text-base-content/70">{stats.mostLikedArranke.likes_count} likes</p>
                                                </div>
                                            </div>
                                            <div className="card-actions justify-end mt-2">
                                                <Link to={`/arranke/${stats.mostLikedArranke.arranke_name}`} className="btn btn-sm btn-ghost">
                                                    Ver detalles
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {stats.recentArranke && (
                                    <div className="card bg-base-200 shadow-md">
                                        <div className="card-body">
                                            <h3 className="card-title text-lg">Más Reciente</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="avatar">
                                                    <div className="w-12 h-12 rounded-xl">
                                                        <img
                                                            src={stats.recentArranke.logo_url || '/placeholder-logo.png'}
                                                            alt="Logo"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold">{stats.recentArranke.arranke_name}</p>
                                                    <p className="text-sm text-base-content/70">{formatDate(stats.recentArranke.created_at)}</p>
                                                </div>
                                            </div>
                                            <div className="card-actions justify-end mt-2">
                                                <Link to={`/arranke/${stats.recentArranke.arranke_name}`} className="btn btn-sm btn-ghost">
                                                    Ver detalles
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Arrankes Table Section */}
                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h2 className="card-title text-2xl">Tus Arrankes</h2>

                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                {/* Search */}
                                <div className="form-control w-full sm:w-auto">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder="Buscar arrankes..."
                                            className="input input-bordered w-full"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <button className="btn btn-square">
                                            <Search size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <select
                                    className="select select-bordered w-full sm:w-auto"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="all">Todas las categorías</option>
                                    <option value="software_app_movil">App Móvil</option>
                                    <option value="software_app_web">App Web</option>
                                    <option value="software_saas">SaaS</option>
                                    <option value="hardware_dispositivo">Hardware</option>
                                    <option value="entretenimiento_videojuego">Videojuego</option>
                                    <option value="social_red_social">Red Social</option>
                                    <option value="comercio_ecommerce">E-commerce</option>
                                    <option value="experiencia_evento">Eventos</option>
                                    <option value="otros">Otros</option>
                                </select>
                            </div>
                        </div>

                        {arrankes.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-lg">No tienes arrankes todavía</p>
                                    <p className="text-base-content/70">¡Crea tu primer arranke ahora!</p>
                                    <Link to="/newArranke" className="btn btn-primary mt-4">
                                        <Plus size={18} />
                                        Crear Arranke
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Arranke</th>
                                            <th>
                                                <button
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleSort('arranke_category')}
                                                >
                                                    Categoría
                                                    <ArrowUpDown size={14} />
                                                </button>
                                            </th>
                                            <th>
                                                <button
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleSort('visit_count')}
                                                >
                                                    Vistas
                                                    <ArrowUpDown size={14} />
                                                </button>
                                            </th>
                                            <th>
                                                <button
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleSort('likes_count')}
                                                >
                                                    Likes
                                                    <ArrowUpDown size={14} />
                                                </button>
                                            </th>
                                            <th>
                                                <button
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleSort('created_at')}
                                                >
                                                    Fecha
                                                    <ArrowUpDown size={14} />
                                                </button>
                                            </th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredArrankes.map((arranke) => (
                                            <tr key={arranke.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar">
                                                            <div className="w-12 h-12 rounded-xl">
                                                                <img
                                                                    src={arranke.logo_url || '/placeholder-logo.png'}
                                                                    alt={arranke.arranke_name}
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">{arranke.arranke_name}</div>
                                                            <div className="text-sm opacity-70 truncate max-w-[200px]">{arranke.arranke_slogan}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`badge ${getCategoryColor(arranke.arranke_category)} badge-sm`}>
                                                        {getCategoryLabel(arranke.arranke_category)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1">
                                                        <Eye size={16} />
                                                        <span>{arranke.visit_count}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <ThumbsUp size={16} />
                                                            <span>{arranke.likes_count}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ThumbsDown size={16} />
                                                            <span>{arranke.dislikes_count}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span>{formatDate(arranke.created_at)}</span>
                                                        <span className="text-xs opacity-70">
                                                            {new Date(arranke.updated_at).getTime() > new Date(arranke.created_at).getTime() &&
                                                                `Actualizado: ${formatDate(arranke.updated_at)}`
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Link to={`/${arranke.arranke_name}`} className="btn btn-sm btn-ghost">
                                                            <Eye size={16} />
                                                        </Link>
                                                        <a
                                                            href={arranke.arranke_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-ghost"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                        <button
                                                            onClick={() => openEditModal(arranke)}
                                                            className="btn btn-sm btn-ghost"
                                                        >
                                                            <Edit size={16} className="mr-1" /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(arranke)}
                                                            className="btn btn-sm btn-ghost text-error"
                                                            aria-label="Eliminar arranke"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Arranke Modal */}
            {isEditModalOpen && currentArranke && (
                <div className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Editar Proyecto</h3>
                            <button
                                className="btn btn-sm btn-circle"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={updateArranke} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Nombre del Proyecto</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre del proyecto"
                                    className="input input-bordered w-full"
                                    value={currentArranke.arranke_name || ''}
                                    onChange={(e) => setCurrentArranke({...currentArranke, arranke_name: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Eslogan</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Eslogan del proyecto"
                                    className="input input-bordered w-full"
                                    value={currentArranke.arranke_slogan || ''}
                                    onChange={(e) => setCurrentArranke({...currentArranke, arranke_slogan: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">URL del Proyecto</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://tu-proyecto.com"
                                    className="input input-bordered w-full"
                                    value={currentArranke.arranke_url || ''}
                                    onChange={(e) => setCurrentArranke({...currentArranke, arranke_url: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Descripción</span>
                                </label>
                                <textarea
                                    placeholder="Descripción del proyecto"
                                    className="textarea textarea-bordered h-32 w-full"
                                    value={currentArranke.arranke_description || ''}
                                    onChange={(e) => setCurrentArranke({...currentArranke, arranke_description: e.target.value})}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Preferencia de nombre a mostrar</span>
                                </label>
                                <div className="flex flex-col gap-2">
                                    <div className="form-control">
                                        <label className="label cursor-pointer justify-start gap-2">
                                            <input
                                                type="radio"
                                                name="display_name_preference"
                                                className="radio radio-primary"
                                                checked={currentArranke.display_name_preference === 'default'}
                                                onChange={() => setCurrentArranke({...currentArranke, display_name_preference: 'default'})}
                                            />
                                            <span className="label-text">Por defecto (nombre completo si está disponible, de lo contrario nombre de usuario)</span>
                                        </label>
                                    </div>
                                    <div className="form-control">
                                        <label className="label cursor-pointer justify-start gap-2">
                                            <input
                                                type="radio"
                                                name="display_name_preference"
                                                className="radio radio-primary"
                                                checked={currentArranke.display_name_preference === 'full_name'}
                                                onChange={() => setCurrentArranke({...currentArranke, display_name_preference: 'full_name'})}
                                            />
                                            <span className="label-text">Nombre completo: {currentArranke.owner_name || 'No disponible'}</span>
                                        </label>
                                    </div>
                                    <div className="form-control">
                                        <label className="label cursor-pointer justify-start gap-2">
                                            <input
                                                type="radio"
                                                name="display_name_preference"
                                                className="radio radio-primary"
                                                checked={currentArranke.display_name_preference === 'username'}
                                                onChange={() => setCurrentArranke({...currentArranke, display_name_preference: 'username'})}
                                            />
                                            <span className="label-text">Nombre de usuario: {currentArranke.owner_username || 'No disponible'}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Logo</span>
                                </label>
                                <input
                                    type="file"
                                    className="file-input file-input-bordered w-full"
                                    onChange={async (e) => {
                                        if (!e.target.files || e.target.files.length === 0 || !user) return;

                                        const file = e.target.files[0];
                                        const fileExt = file.name.split('.').pop();
                                        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

                                        const { error: uploadError } = await supabase.storage
                                            .from('logos')
                                            .upload(filePath, file);

                                        if (uploadError) {
                                            console.error('Error al subir el logo:', uploadError);
                                            showToast('Error al subir el logo: ' + uploadError.message, 'error');
                                            return;
                                        }

                                        const { data: { publicUrl } } = supabase.storage
                                            .from('logos')
                                            .getPublicUrl(filePath);

                                        setCurrentArranke({...currentArranke, logo_url: publicUrl});
                                        showToast('¡Logo subido con éxito!', 'success');
                                    }}
                                />
                                {currentArranke.logo_url && (
                                    <div className="mt-2">
                                        <p className="text-sm mb-1">Logo actual:</p>
                                        <img
                                            src={currentArranke.logo_url}
                                            alt="Logo"
                                            className="h-16 w-16 object-cover rounded"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-primary ${updateLoading ? 'loading' : ''}`}
                                    disabled={updateLoading}
                                >
                                    {updateLoading ? 'Actualizando...' : 'Actualizar Proyecto'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}></div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && currentArranke && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Confirmar eliminación</h3>
                        <p>¿Estás seguro de que quieres eliminar el arranke <span className="font-bold">{currentArranke.arranke_name}</span>?</p>
                        <p className="text-sm text-base-content/70 mt-2">Esta acción no se puede deshacer.</p>

                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className={`btn btn-error ${updateLoading ? 'loading' : ''}`}
                                onClick={deleteArranke}
                                disabled={updateLoading}
                            >
                                {updateLoading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}></div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast toast-top toast-end`}>
                    <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard