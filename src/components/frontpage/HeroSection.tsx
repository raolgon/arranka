import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import ArrankeOfTheDayCard from "../arrankes/ArrankeOfTheDayCard";
import { Arranke } from "../../types/arranke";

interface HeroSectionProps {
    featuredArranke: Arranke | null;
}

const HeroSection = ({ featuredArranke }: HeroSectionProps) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setIsLoggedIn(!!session);
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleArrankeClick = () => {
        if (isLoggedIn) {
            navigate("/newArranke");
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="bg-base-200 min-h-screen w-full flex items-center justify-center">
            <div className="container mx-auto px-4">
                <div className="hero min-h-[80vh]">
                    <div className="hero-content flex-col lg:flex-row text-center lg:text-left gap-8">
                        <div className="max-w-md">
                            <h1 className="text-5xl font-bold">arranka tu proyecto</h1>
                            <p className="py-6">
                                arranke es una plataforma para las mejores startups y proyectos de latinomaerica para el mundo
                            </p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                <button
                                    onClick={handleArrankeClick}
                                    className="btn btn-primary"
                                    disabled={checkingSession}
                                >
                                    {checkingSession ? (
                                        <span className="loading loading-spinner loading-xs mr-2"></span>
                                    ) : null}
                                    arranka tu proyecto
                                </button>
                                <Link to="/projects" className="btn btn-accent">ve todos los arrankes</Link>
                            </div>
                        </div>
                        <ArrankeOfTheDayCard arranke={featuredArranke || undefined} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroSection;