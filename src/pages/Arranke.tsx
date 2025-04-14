import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { ThumbsUp, ThumbsDown } from "lucide-react";

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
    created_at: string;
    updated_at: string;
}

function Arranke() {
    const {projectName} = useParams();
    const [arranke, setArranke] = useState<Arranke | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArranke = async () => {
            try {
                const { data, error } = await supabase
                    .from('arrankes')
                    .select('*')
                    .eq('arranke_name', projectName)
                    .single();

                if (error) {
                    setError(error.message);
                } else {
                    setArranke(data);
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
                                <div className="w-32 h-32 rounded-xl">
                                    <img
                                        src={arranke.logo_url || '/placeholder-logo.png'}
                                        alt={arranke.arranke_name}
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                    <h1 className="text-4xl font-bold">{arranke.arranke_name}</h1>
                                    <div className="badge badge-primary badge-lg">{arranke.arranke_category}</div>
                                </div>
                                <p className="text-xl text-base-content/70 mb-1">{arranke.arranke_slogan}</p>
                                <p className="text-sm text-base-content/50 mb-4">Created by <span className="font-semibold">{arranke.owner_name}</span></p>
                                <div className="flex gap-4 justify-center md:justify-start">
                                    <a
                                        href={arranke.arranke_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                    >
                                        Visit Project
                                    </a>
                                    <div className="flex gap-2">
                                        <button className="btn btn-ghost">
                                            <span className="text-lg">
                                                <ThumbsUp size={24}/>
                                            </span>
                                            <span>{arranke.likes}</span>
                                        </button>
                                        <button className="btn btn-ghost">
                                            <span className="text-lg">
                                                <ThumbsDown size={24} />
                                            </span>
                                            <span>{arranke.dislikes}</span>
                                        </button>
                                    </div>
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
                                {new Date(arranke.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title">Last Updated</h3>
                            <p className="text-2xl">
                                {new Date(arranke.updated_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title">Project URL</h3>
                            <a
                                href={arranke.arranke_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary text-lg truncate"
                            >
                                {arranke.arranke_url}
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Arranke;