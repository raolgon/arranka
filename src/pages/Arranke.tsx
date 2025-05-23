import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Arranke as ArrankeType } from "../types/arranke";
import { getDisplayName } from "../utils/displayNamePreference";
import LikeDislikeButtons from "../components/arrankes/LikeDislikeButtons";

// Helper functions for status display
function getStatusBadgeColor(status: string) {
    switch (status) {
        case 'approved':
            return 'badge-success';
        case 'pending':
            return 'badge-warning';
        case 'rejected':
            return 'badge-error';
        default:
            return 'badge-neutral';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'approved':
            return 'Aprobado';
        case 'pending':
            return 'Pendiente';
        case 'rejected':
            return 'Rechazado';
        default:
            return 'Desconocido';
    }
}

interface Arranke extends ArrankeType {
    // Extending the shared Arranke type to ensure compatibility
    likes_count?: number;
    dislikes_count?: number;
    visit_count?: number;
    clicks_count?: number;
}

function Arranke() {
    const {projectName} = useParams();
    const [arranke, setArranke] = useState<Arranke | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Stats are now handled by the LikeDislikeButtons component

    const handleUrlClick = async () => {
        if (arranke) {
            try {
                await supabase
                    .rpc('increment_clicks', { arranke_id: arranke.id });
            } catch (error) {
                console.error('Error incrementing URL clicks:', error);
            }
        }
    };

    useEffect(() => {
        const fetchArranke = async () => {
            try {
                // Fetch the arranke data
                const { data, error } = await supabase
                    .from('arrankes')
                    .select('*')
                    .eq('arranke_name', projectName)
                    .single();

                if (error) {
                    setError(error.message);
                    return;
                }

                // Fetch the stats data
                const { data: statsData, error: statsError } = await supabase
                    .from('arrankes_stats')
                    .select('likes_count, dislikes_count, visit_count, clicks_count')
                    .eq('id', data.id)
                    .single();

                if (statsError) {
                    console.error('Error fetching stats:', statsError);
                    // Still set the arranke data even if stats fail
                    setArranke(data);
                } else {
                    // Combine arranke and stats data
                    setArranke({
                        ...data,
                        likes_count: statsData?.likes_count || 0,
                        dislikes_count: statsData?.dislikes_count || 0,
                        visit_count: statsData?.visit_count || 0,
                        clicks_count: statsData?.clicks_count || 0
                    });

                    // Increment view count
                    try {
                        await supabase
                            .rpc('increment_visits', { arranke_id: data.id });
                    } catch (viewError) {
                        console.error('Error incrementing views:', viewError);
                    }
                }
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArranke();
    }, [projectName]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="alert alert-error max-w-md">
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!arranke) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="alert alert-warning max-w-md">
                    <span>Project not found</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="card bg-base-100 card-border border-primary shadow-2xs mb-8">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="avatar">
                                <div className="w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-xl">
                                    <img
                                        src={arranke.logo_url || 'https://placehold.co/400x400/blue/white?text=Arranke'}
                                        alt={arranke.arranke_name || "Project logo"}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                    <h1 className="text-4xl font-bold">{arranke.arranke_name}</h1>
                                    <div className="flex gap-2">
                                        <div className="badge badge-primary badge-lg">{arranke.arranke_category}</div>
                                        {arranke.status && (
                                            <div className={`badge ${getStatusBadgeColor(arranke.status)} badge-lg`}>
                                                {getStatusLabel(arranke.status)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xl text-base-content/70 mb-1">{arranke.arranke_slogan}</p>
                                <p className="text-sm text-base-content/50 mb-4">Created by <span className="font-semibold">{getDisplayName(arranke.arranke_name, arranke.owner_name, arranke.owner_username, arranke.display_name_preference)}</span></p>
                                <div className="flex gap-4 justify-center md:justify-start">
                                    <a
                                        href={arranke.arranke_url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        onClick={handleUrlClick}
                                    >
                                        Visit Project
                                    </a>
                                    {arranke.id && (
                                        <LikeDislikeButtons
                                            arrankeId={arranke.id.toString()}
                                            initialLikes={arranke.likes_count || 0}
                                            initialDislikes={arranke.dislikes_count || 0}
                                            size={24}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">About</h2>
                        <p className="text-lg whitespace-pre-line">{arranke.arranke_description}</p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title">Created</h3>
                            <p className="text-2xl">
                                {arranke.created_at ? new Date(arranke.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title">Last Updated</h3>
                            <p className="text-2xl">
                                {arranke.updated_at ? new Date(arranke.updated_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title">Project URL</h3>
                            <a
                                href={arranke.arranke_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary text-lg truncate"
                                onClick={handleUrlClick}
                            >
                                {arranke.arranke_url || 'No URL provided'}
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Arranke;