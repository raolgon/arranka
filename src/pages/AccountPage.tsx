import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { User } from '@supabase/supabase-js';
import UploadAvatarWidget from '../components/arrankes/UploadAvatarWidget';

interface Profile {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
}

interface Arranke {
    id: string
    arranke_name: string | null;
    arranke_slogan: string | null;
    arranke_description: string | null;
    arranke_url: string | null;
    logo_url: string | null;
    owner_id: string | null;
    owner_name: string | null;
    owner_username?: string | null;
    display_name_preference?: 'full_name' | 'username' | 'default';
    arranke_category: string | null;
    views?: number;
    likes?: number;
    dislikes?: number;
    url_clicks?: number;
}

const AccountPage = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile>({
        username: null,
        full_name: null,
        avatar_url: null,
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const [arrankes, setArrankes] = useState<Arranke[]>([]);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });
    const navigate = useNavigate();

    useEffect(() => {
        getSession();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    async function getSession() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
                await getProfile(session.user.id);
                await getArrankes(session.user.id);
            } else {
                navigate('/login');
            }
        } catch (error: any) {
            console.error("Error al obtener la sesión:", error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    async function getProfile(userId: string) {
        try {
            let { data, error, status } = await supabase
                .from('profiles')
                .select(`username, full_name, avatar_url`)
                .eq('id', userId)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setProfile({
                    username: data.username,
                    full_name: data.full_name,
                    avatar_url: data.avatar_url
                });
            }
        } catch (error: any) {
            console.error("Error al obtener el perfil:", error);
            showToast(error.message, 'error');
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
                // Add views property if it doesn't exist
                const arrankeWithViews = data.map(arranke => ({
                    ...arranke,
                    views: arranke.views || 0
                }));
                setArrankes(arrankeWithViews);
            }
        } catch (error: any) {
            console.error("Error al obtener los arrankes:", error);
            showToast(error.message, 'error');
        }
    }

    async function updateProfile(e: React.FormEvent) {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            if (!user) throw new Error('No se encontró usuario');

            const updates = {
                id: user.id,
                ...profile,
                updated_at: new Date(),
            };

            let { error } = await supabase.from('profiles').upsert(updates);
            if (error) {
                throw error;
            }
            showToast('¡Perfil actualizado con éxito!', 'success');
        } catch (error: any) {
            console.error("Error al actualizar el perfil:", error);
            showToast(error.message, 'error');
        } finally {
            setUpdateLoading(false);
        }
    }



    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [arrankeToDelete, setArrankeToDelete] = useState<string | null>(null);

    function openDeleteModal(arrankeId: string) {
        setArrankeToDelete(arrankeId);
        setIsDeleteModalOpen(true);
    }

    async function deleteArranke() {
        if (!arrankeToDelete) return;
        setUpdateLoading(true);

        try {
            const { error } = await supabase
                .from('arrankes')
                .delete()
                .eq('id', arrankeToDelete);

            if (error) throw error;

            showToast('¡Arranke eliminado con éxito!', 'success');
            setArrankes(arrankes.filter(arranke => arranke.id !== arrankeToDelete));
            setIsDeleteModalOpen(false);
        } catch (error: any) {
            console.error("Error al eliminar el arranke:", error);
            showToast(error.message, 'error');
        } finally {
            setUpdateLoading(false);
        }
    }

    /* function openEditModal(arranke: Arranke) {
        setCurrentArranke(arranke);
        setIsModalOpen(true);
    } */

    async function signOut() {
        await supabase.auth.signOut();
        navigate('/');
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 mb-12">
                    {/* Profile Card */}
                    <div className="card card-border border-primary bg-base-100 w-full lg:w-96">
                        <div className="card-body">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="avatar">
                                    <div className="w-24 rounded-xl">
                                        {profile.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt="Avatar"
                                            />
                                        ) : (
                                            <span className="text-xl">{user?.email?.[0].toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="card-title text-2xl">{profile.username || user?.email?.split('@')[0] || 'Usuario'}</h2>
                                    <p className="text-sm opacity-70">{user?.email || 'usuario@ejemplo.com'}</p>
                                    <p className="text-sm opacity-70">id: {user?.id}</p>
                                    <p>nombre completo: {profile.full_name}</p>
                                </div>
                            </div>

                            <div className="stats shadow mb-4">
                                <div className="stat">
                                    <div className="stat-title">Proyectos</div>
                                    <div className="stat-value">{arrankes.length}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Vistas Totales</div>
                                    <div className="stat-value">{arrankes.reduce((sum, arranke) => sum + (arranke.views || 0), 0)}</div>
                                </div>
                            </div>

                            <div className="card-actions justify-end">
                                <button className="btn btn-warning" onClick={signOut}>Cerrar sesión</button>
                            </div>
                        </div>
                    </div>

                    {/* Update Profile Form */}
                    <div className="card card-border border-primary bg-base-100 w-full lg:w-96">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6">Actualizar perfil</h2>
                            <form onSubmit={updateProfile}>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Nombre de usuario</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Tu nombre de usuario"
                                        className="input input-bordered"
                                        value={profile.username || ''}
                                        onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                                    />
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Nombre completo</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        className="input input-bordered"
                                        value={profile.full_name || ''}
                                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                                    />
                                </div>

                                <div className="form-control mt-4">
                                    <UploadAvatarWidget
                                        currentAvatarUrl={profile.avatar_url}
                                        userId={user?.id || ''}
                                        onAvatarUpdate={(newUrl) => setProfile(prev => ({ ...prev, avatar_url: newUrl }))}
                                    />
                                </div>

                                <div className="form-control mt-6">
                                    <button
                                        className={`btn btn-primary ${updateLoading ? 'loading' : ''}`}
                                        type="submit"
                                        disabled={updateLoading}
                                    >
                                        {updateLoading ? 'Actualizando...' : 'Actualizar perfil'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div className="card bg-base-100 shadow-xl mt-8">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="card-title text-2xl">Tus Arrankes</h2>
                            <Link to="/newArranke" className="btn btn-primary">
                                + Nuevo Arranke
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Logo</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Vistas</th>
                                        <th>Ajustes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {arrankes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-4">
                                                    <p className="text-lg">no hay arrankes</p>
                                                    <p className="text-base-content/70">Crea tu arranke ya</p>
                                                    <Link to="/newArranke" className="btn btn-primary">
                                                        + crear arranke
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        arrankes.map((arranke) => (
                                            <tr key={arranke.id}>
                                                <td>
                                                    {arranke.logo_url ? (
                                                        <div className="avatar">
                                                            <div className="w-12 h-12 rounded-xl">
                                                                <img
                                                                    src={arranke.logo_url}
                                                                    alt={arranke.arranke_name || 'Project logo'}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-base-300 flex items-center justify-center">
                                                            <span className="text-base-content/50">Sin logo</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{arranke.arranke_name}</td>
                                                <td className="max-w-md">
                                                    <div className="truncate">
                                                        {arranke.arranke_description}
                                                    </div>
                                                </td>
                                                <td>{arranke.views || 0}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Link to="/dashboard" className="btn btn-sm btn-ghost">
                                                            Editar
                                                        </Link>
                                                        <button
                                                            className="btn btn-sm btn-error"
                                                            onClick={() => openDeleteModal(arranke.id)}
                                                        >
                                                            eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Confirmar eliminación</h3>
                        <p>¿Estás seguro de que quieres eliminar este arranke?</p>
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
    );
};

export default AccountPage;