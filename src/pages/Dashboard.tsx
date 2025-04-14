import { useState, useEffect } from 'react';
import { Rocket, Eye, ThumbsUp, ThumbsDown, ArrowUpDown, Search, Plus, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
// Using alert instead of toast for simplicity
const toast = {
    error: (message: string) => alert(`Error: ${message}`),
    success: (message: string) => alert(`Success: ${message}`)
};

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
    likes: number;
    dislikes: number;
    views: number;
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
}

const Dashboard = () => {
    const [arrankes, setArrankes] = useState<Arranke[]>([]);
    const [filteredArrankes, setFilteredArrankes] = useState<Arranke[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile>({ id: '', username: '', full_name: '', avatar_url: '' });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof Arranke>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
            toast.error(error.message);
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
                    avatar_url: data.avatar_url || ''
                });
            }
        } catch (error: any) {
            console.error("Error al obtener el perfil:", error);
            toast.error(error.message);
        }
    }

    async function getArrankes(userId: string) {
        try {
            let { data, error } = await supabase
                .from('arrankes')
                .select('*')
                .eq('owner_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Add default values for any missing properties
                const arrankeWithDefaults = data.map(arranke => ({
                    ...arranke,
                    views: arranke.views || 0,
                    likes: arranke.likes || 0,
                    dislikes: arranke.dislikes || 0
                }));
                setArrankes(arrankeWithDefaults);
            }
        } catch (error: any) {
            console.error("Error al obtener los arrankes:", error);
            toast.error(error.message);
        }
    }

    async function deleteArranke(arrankeId: number) {
        if (!confirm('¿Estás seguro de que quieres eliminar este arranke?')) return;

        try {
            if (!user) throw new Error('No se encontró usuario');

            const { error } = await supabase
                .from('arrankes')
                .delete()
                .eq('id', arrankeId)
                .eq('owner_id', user.id); // Security check to ensure user owns the arranke

            if (error) throw error;

            // Update the local state to remove the deleted arranke
            setArrankes(prev => prev.filter(arranke => arranke.id !== arrankeId));
            toast.success('¡Arranke eliminado con éxito!');
        } catch (error: any) {
            console.error("Error al eliminar el arranke:", error);
            toast.error(error.message);
        }
    }

    function calculateStats() {
        const totalArrankes = arrankes.length;
        const totalViews = arrankes.reduce((sum, arranke) => sum + (arranke.views || 0), 0);
        const totalLikes = arrankes.reduce((sum, arranke) => sum + (arranke.likes || 0), 0);
        const totalDislikes = arrankes.reduce((sum, arranke) => sum + (arranke.dislikes || 0), 0);

        // Find most viewed arranke
        const mostViewedArranke = [...arrankes].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || null;

        // Find most liked arranke
        const mostLikedArranke = [...arrankes].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] || null;

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
                                                    <p className="text-sm text-base-content/70">{stats.mostViewedArranke.views} vistas</p>
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
                                                    <p className="text-sm text-base-content/70">{stats.mostLikedArranke.likes} likes</p>
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
                                                    onClick={() => handleSort('views')}
                                                >
                                                    Vistas
                                                    <ArrowUpDown size={14} />
                                                </button>
                                            </th>
                                            <th>
                                                <button
                                                    className="flex items-center gap-1"
                                                    onClick={() => handleSort('likes')}
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
                                                        <span>{arranke.views}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <ThumbsUp size={16} />
                                                            <span>{arranke.likes}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <ThumbsDown size={16} />
                                                            <span>{arranke.dislikes}</span>
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
                                                        <Link to={`/arranke/${arranke.arranke_name}`} className="btn btn-sm btn-ghost">
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
                                                        <Link to={`/profile?edit=${arranke.id}`} className="btn btn-sm btn-ghost">
                                                            Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => deleteArranke(arranke.id)}
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
        </div>
    )
}

export default Dashboard