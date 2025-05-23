import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Arranke } from "../types/arranke";
import { Check, X, Eye, Search, ArrowUpDown, ExternalLink, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [pendingArrankes, setPendingArrankes] = useState<Arranke[]>([]);
    const [filteredArrankes, setFilteredArrankes] = useState<Arranke[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof Arranke>('submission_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [stats, setStats] = useState({
        totalPending: 0,
        oldestPending: null as Arranke | null,
        pendingByCategory: {} as Record<string, number>
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    
    const navigate = useNavigate();
    
    useEffect(() => {
        checkAdminAccess();
    }, []);
    
    useEffect(() => {
        if (isAdmin && !authChecking) {
            fetchPendingArrankes();
        }
    }, [isAdmin, authChecking]);
    
    async function checkAdminAccess() {
        try {
            // First check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                // Not logged in, redirect to login
                navigate('/login');
                return;
            }
            
            // Check if user has admin role in profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
                
            if (profileError) {
                console.error("Error checking admin status:", profileError);
                showToast("Error verificando permisos de administrador", 'error');
                navigate('/');
                return;
            }
            
            // Check if user is admin
            if (!profileData || !profileData.is_admin) {
                showToast("No tienes permisos de administrador", 'error');
                navigate('/');
                return;
            }
            
            // User is admin
            setIsAdmin(true);
        } catch (error) {
            console.error("Error checking admin access:", error);
            showToast("Error verificando permisos de administrador", 'error');
            navigate('/');
        } finally {
            setAuthChecking(false);
        }
    }
    
    useEffect(() => {
        // Apply filters and sorting
        let result = [...pendingArrankes];

        // Filter by search term
        if (searchTerm) {
            result = result.filter(arranke =>
                arranke.arranke_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                arranke.arranke_description?.toLowerCase().includes(searchTerm.toLowerCase())
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
    }, [pendingArrankes, searchTerm, sortField, sortDirection, selectedCategory]);

    useEffect(() => {
        if (pendingArrankes.length > 0) {
            calculateStats();
        }
    }, [pendingArrankes]);
    
    async function fetchPendingArrankes() {
        try {
            const { data, error } = await supabase
                .from('arrankes')
                .select('*')
                .eq('status', 'pending')
                .order('submission_date', { ascending: true });
                
            if (error) throw error;
            setPendingArrankes(data || []);
        } catch (error) {
            console.error("Error fetching pending arrankes:", error);
            showToast("Error fetching pending arrankes", 'error');
        } finally {
            setLoading(false);
        }
    }
    
    async function approveArranke(id: number) {
        try {
            const { error } = await supabase
                .from('arrankes')
                .update({ 
                    status: 'approved',
                    approval_date: new Date().toISOString()
                })
                .eq('id', id);
                
            if (error) throw error;
            showToast("Arranke approved successfully", 'success');
            fetchPendingArrankes();
        } catch (error) {
            console.error("Error approving arranke:", error);
            showToast("Error approving arranke", 'error');
        }
    }

    async function rejectArranke(id: number) {
        try {
            const { error } = await supabase
                .from('arrankes')
                .update({ 
                    status: 'rejected',
                    approval_date: new Date().toISOString()
                })
                .eq('id', id);
                
            if (error) throw error;
            showToast("Arranke rejected", 'success');
            fetchPendingArrankes();
        } catch (error) {
            console.error("Error rejecting arranke:", error);
            showToast("Error rejecting arranke", 'error');
        }
    }

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    }

    function handleSort(field: keyof Arranke) {
        if (field === sortField) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    }

    function formatDate(dateString: string) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function calculateStats() {
        const totalPending = pendingArrankes.length;
        
        // Find oldest pending arranke
        const oldestPending = [...pendingArrankes].sort((a, b) => 
            new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime()
        )[0] || null;
        
        // Count by category
        const pendingByCategory: Record<string, number> = {};
        pendingArrankes.forEach(arranke => {
            const category = arranke.arranke_category || 'uncategorized';
            pendingByCategory[category] = (pendingByCategory[category] || 0) + 1;
        });
        
        setStats({
            totalPending,
            oldestPending,
            pendingByCategory
        });
    }

    function getCategoryColor(categoryValue: string) {
        if (!categoryValue) return 'badge-neutral';
        
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

    function getCategoryLabel(category: string) {
        if (!category) return 'Sin categoría';
        
        const labels: Record<string, string> = {
            'software_app_movil': 'App Móvil',
            'software_app_web': 'App Web',
            'software_saas': 'SaaS',
            'hardware_dispositivo': 'Hardware',
            'entretenimiento_videojuego': 'Videojuego',
            'social_red_social': 'Red Social',
            'comercio_ecommerce': 'E-commerce',
            'experiencia_evento': 'Eventos',
            'otros': 'Otros'
        };

        return labels[category] || category;
    }
    
    // Show loading state while checking auth and loading data
    if (authChecking || (loading && isAdmin)) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="text-lg">Cargando panel de administración...</p>
                </div>
            </div>
        );
    }
    
    // Show access denied if not admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body items-center text-center">
                        <ShieldAlert size={64} className="text-error mb-4" />
                        <h2 className="card-title text-2xl">Acceso Denegado</h2>
                        <p className="mb-4">No tienes permisos para acceder al panel de administración.</p>
                        <div className="card-actions">
                            <Link to="/" className="btn btn-primary">
                                Volver al Inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-base-200 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="card-title text-2xl mb-2">Panel de Administración</h2>
                                <p className="text-base-content/70">Gestiona y aprueba los proyectos pendientes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="stats shadow mb-8 w-full stats-vertical lg:stats-horizontal">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <Check size={24} />
                        </div>
                        <div className="stat-title">Proyectos Pendientes</div>
                        <div className="stat-value text-primary">{stats.totalPending}</div>
                        {stats.oldestPending && (
                            <div className="stat-desc">
                                Más antiguo: {formatDate(stats.oldestPending.submission_date)}
                            </div>
                        )}
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <div className="flex gap-2">
                                {Object.entries(stats.pendingByCategory).slice(0, 3).map(([category, count], index) => (
                                    <div key={index} className={`badge ${getCategoryColor(category)}`}>
                                        {count}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="stat-title">Por Categoría</div>
                        <div className="stat-value text-secondary">
                            {Object.keys(stats.pendingByCategory).length}
                        </div>
                        <div className="stat-desc">
                            Categorías con proyectos pendientes
                        </div>
                    </div>
                </div>

                {/* Pending Projects Table */}
                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h2 className="card-title text-2xl">Proyectos Pendientes</h2>

                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                {/* Search */}
                                <div className="form-control w-full sm:w-auto">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder="Buscar proyectos..."
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

                        {filteredArrankes.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-lg">No hay proyectos pendientes</p>
                                    <p className="text-base-content/70">Todos los proyectos han sido revisados</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>Proyecto</th>
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
                                                    onClick={() => handleSort('submission_date')}
                                                >
                                                    Enviado
                                                    <ArrowUpDown size={14} />
                                                </button>
                                            </th>
                                            <th>Creador</th>
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
                                                                    alt={arranke.arranke_name || ''}
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
                                                    <div className={`badge ${getCategoryColor(arranke.arranke_category || '')} badge-sm`}>
                                                        {getCategoryLabel(arranke.arranke_category || '')}
                                                    </div>
                                                </td>
                                                <td>
                                                    {formatDate(arranke.submission_date)}
                                                </td>
                                                <td>
                                                    {arranke.owner_name || 'Anónimo'}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Link to={`/${arranke.arranke_name}`} className="btn btn-sm btn-ghost">
                                                            <Eye size={16} />
                                                        </Link>
                                                        <a
                                                            href={arranke.arranke_url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-ghost"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                        <button 
                                                            onClick={() => approveArranke(arranke.id!)}
                                                            className="btn btn-sm btn-success"
                                                        >
                                                            <Check size={16} className="mr-1" /> Aprobar
                                                        </button>
                                                        <button 
                                                            onClick={() => rejectArranke(arranke.id!)}
                                                            className="btn btn-sm btn-error"
                                                        >
                                                            <X size={16} className="mr-1" /> Rechazar
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

            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast toast-top toast-end`}>
                    <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
