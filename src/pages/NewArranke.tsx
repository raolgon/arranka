import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { User } from '@supabase/supabase-js';

interface Arranke {
    arranke_name: string | null;
    arranke_slogan: string | null;
    arranke_description: string | null;
    arranke_url: string | null;
    logo_url: string | null;
    owner_id: string | null;
    owner_name: string | null;
    arranke_category: string | null;
}

const NewArranke = () => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [arranke, setArranke] = useState<Arranke>({
        arranke_name: null,
        arranke_slogan: null,
        arranke_description: null,
        arranke_url: null,
        logo_url: null,
        owner_id: null,
        owner_name: null,
        arranke_category: null
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
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
                setArranke(prev => ({
                    ...prev,
                    owner_id: session.user.id,
                    owner_name: session.user.email?.split('@')[0] || 'user'
                }));
            } else {
                navigate('/login');
            }
        } catch (error: any) {
            console.error("Error getting session:", error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setLogoFile(file);

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setLogoPreview(previewUrl);
    };

    async function createArranke(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user) throw new Error('No user found');

            let logoUrl = arranke.logo_url;

            // Upload logo if a new file was selected
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const filePath = `${user.id}/${Math.random()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(filePath, logoFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('logos')
                    .getPublicUrl(filePath);

                logoUrl = publicUrl;
            }

            const { error } = await supabase
                .from('arrankes')
                .insert([{
                    arranke_name: arranke.arranke_name,
                    arranke_slogan: arranke.arranke_slogan,
                    arranke_description: arranke.arranke_description,
                    arranke_url: arranke.arranke_url,
                    arranke_category: arranke.arranke_category,
                    owner_id: user.id,
                    owner_name: user.user_metadata.username,
                    logo_url: logoUrl
                }]);

            if (error) throw error;

            showToast('Arranke created successfully!', 'success');
            setTimeout(() => {
                navigate('/projects');
            }, 1500);
        } catch (error: any) {
            console.error("Error creating arranke:", error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <section className="min-h-screen flex items-center justify-center bg-base-200 py-8 px-4">
            <div className="w-full max-w-2xl">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-6">crea un nuevo arranke</h2>
                        <form onSubmit={createArranke} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">nombre</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="nombre de tu arranke"
                                    className="input input-bordered w-full"
                                    value={arranke.arranke_name || ''}
                                    onChange={(e) => setArranke(prev => ({ ...prev, arranke_name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Eslogan</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="eslogan de tu arranke en 150 caracteres maximo"
                                    className="input input-bordered w-full"
                                    value={arranke.arranke_slogan || ''}
                                    onChange={(e) => setArranke(prev => ({ ...prev, arranke_slogan: e.target.value }))}
                                    maxLength={150}
                                    required
                                />
                                <label className="label">
                                    <span className="label-text-alt">{150 - (arranke.arranke_slogan?.length || 0)} caracteres restantes</span>
                                </label>
                                <div className="flex justify-end mt-1">
                                    <progress
                                        className={`progress w-full ${(arranke.arranke_slogan?.length || 0) > 120 ? 'progress-error' : 'progress-primary'}`}
                                        value={arranke.arranke_slogan?.length || 0}
                                        max="150"
                                    ></progress>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">link</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://your-arranke.com"
                                    className="input input-bordered w-full"
                                    value={arranke.arranke_url || ''}
                                    onChange={(e) => setArranke(prev => ({ ...prev, arranke_url: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">descripcion</span>
                                </label>
                                <textarea
                                    placeholder="describe tu arranke"
                                    className="textarea textarea-bordered h-32 w-full"
                                    value={arranke.arranke_description || ''}
                                    onChange={(e) => setArranke(prev => ({ ...prev, arranke_description: e.target.value }))}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">categoria</span>
                                </label>

                                <select
                                    className="select select-bordered w-full"
                                    value={arranke.arranke_category || ''}
                                    onChange={(e) => setArranke(prev => ({ ...prev, arranke_category: e.target.value }))}
                                    required
                                >
                                    <option value="" disabled>Selecciona una categoria</option>

                                    <optgroup label="Software">
                                        <option value="software_app_movil">Aplicación móvil</option>
                                        <option value="software_app_web">Aplicación web</option>
                                        <option value="software_saas">SaaS (Software como servicio)</option>
                                        <option value="software_herramienta_desarrollo">Herramienta de desarrollo</option>
                                        <option value="software_ia">Inteligencia artificial</option>
                                        <option value="software_blockchain">Blockchain / Web3</option>
                                        <option value="software_otro">Otro software</option>
                                    </optgroup>

                                    <optgroup label="Hardware">
                                        <option value="hardware_dispositivo">Dispositivo electrónico</option>
                                        <option value="hardware_iot">Internet de las cosas (IoT)</option>
                                        <option value="hardware_wearable">Wearable</option>
                                        <option value="hardware_robotica">Robótica</option>
                                        <option value="hardware_otro">Otro hardware</option>
                                    </optgroup>

                                    <optgroup label="Entretenimiento y juegos">
                                        <option value="entretenimiento_videojuego">Videojuego</option>
                                        <option value="entretenimiento_juego_movil">Juego móvil</option>
                                        <option value="entretenimiento_realidad_virtual">Realidad virtual/aumentada</option>
                                        <option value="entretenimiento_contenido">Plataforma de contenido</option>
                                        <option value="entretenimiento_otro">Otro entretenimiento</option>
                                    </optgroup>

                                    <optgroup label="Redes sociales y comunidades">
                                        <option value="social_red_social">Red social</option>
                                        <option value="social_comunidad">Plataforma de comunidad</option>
                                        <option value="social_comunicacion">Herramienta de comunicación</option>
                                        <option value="social_colaboracion">Plataforma colaborativa</option>
                                        <option value="social_otro">Otra red social</option>
                                    </optgroup>

                                    <optgroup label="Comercio y ventas">
                                        <option value="comercio_ecommerce">E-commerce</option>
                                        <option value="comercio_marketplace">Marketplace</option>
                                        <option value="comercio_fintech">Fintech</option>
                                        <option value="comercio_delivery">Servicio de entrega</option>
                                        <option value="comercio_suscripcion">Modelo de suscripción</option>
                                        <option value="comercio_otro">Otro comercio</option>
                                    </optgroup>

                                    <optgroup label="Experiencias y eventos">
                                        <option value="experiencia_evento">Plataforma de eventos</option>
                                        <option value="experiencia_turismo">Turismo y viajes</option>
                                        <option value="experiencia_educacion">Educación y aprendizaje</option>
                                        <option value="experiencia_salud">Salud y bienestar</option>
                                        <option value="experiencia_otro">Otra experiencia</option>
                                    </optgroup>

                                    <optgroup label="Otros">
                                        <option value="otros_sostenibilidad">Sostenibilidad y medio ambiente</option>
                                        <option value="otros_impacto_social">Impacto social</option>
                                        <option value="otros_investigacion">Investigación y ciencia</option>
                                        <option value="otros">Otro tipo de proyecto</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Logo</span>
                                </label>
                                <div className="w-full">
                                    <input
                                        type="file"
                                        className="file-input file-input-bordered w-full"
                                        onChange={handleLogoChange}
                                        accept="image/*"
                                    />
                                    {logoPreview && (
                                        <div className="mt-4 flex justify-center">
                                            <div className="avatar">
                                                <div className="w-32 h-32 rounded-xl">
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo preview"
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-actions mt-6">
                                <button
                                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Creando...' : 'Crear Arranke'}
                                </button>
                            </div>
                        </form>
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
        </section>
    );
}

export default NewArranke;