import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import HeroSection from "../components/frontpage/HeroSection";
import ProjectsShowcase from "../components/frontpage/ProjectsShowcase";
import NewProjectsShowCase from "../components/frontpage/NewProjectsShowCase";
import { Arranke } from "../types/arranke";

function Home() {
    const [loading, setLoading] = useState(true);
    const [featuredArranke, setFeaturedArranke] = useState<Arranke | null>(null);
    const [topArrankes, setTopArrankes] = useState<Arranke[]>([]);
    const [newArrankes, setNewArrankes] = useState<Arranke[]>([]);

    useEffect(() => {
        fetchArrankes();
    }, []);

    async function fetchArrankes() {
        try {
            setLoading(true);

            // Fetch all arrankes
            const { data, error } = await supabase
                .from('arrankes')
                .select('*')
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

                // Set featured arranke (most liked or most viewed)
                const mostLiked = [...arrankeWithDefaults].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] || null;
                setFeaturedArranke(mostLiked);

                // Set top arrankes (by likes)
                const topByLikes = [...arrankeWithDefaults]
                    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                    .slice(0, 4); // Get top 4 for the showcase
                setTopArrankes(topByLikes);

                // Set new arrankes (most recent)
                const recentArrankes = [...arrankeWithDefaults].slice(0, 9); // Get 9 most recent
                setNewArrankes(recentArrankes);
            }
        } catch (error: any) {
            console.error("Error al obtener los arrankes:", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-base-200">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <>
                    <HeroSection featuredArranke={featuredArranke} />
                    <ProjectsShowcase topArrankes={topArrankes} />
                    <NewProjectsShowCase newArrankes={newArrankes} />
                </>
            )}
        </>
    );
}

export default Home;