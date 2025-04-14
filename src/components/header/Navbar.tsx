import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import ThemeToggle from "../Theme/ThemeToggle";

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
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

    return (
        <div className="bg-base-100 shadow-sm w-full">
            <div className="navbar container mx-auto">
                <div className="navbar-start">
                    <div className="dropdown">
                        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                            <Menu size={24} />
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                            <li>
                                <NavLink to="/about" className="btn btn-ghost">about</NavLink>
                            </li>
                            <li>
                                <NavLink to="/projects" className="btn btn-ghost">arrankes</NavLink>
                            </li>
                            {isLoggedIn && (
                                <li>
                                    <NavLink to="/profile" className="btn btn-ghost">perfil</NavLink>
                                </li>
                            )}
                        </ul>
                    </div>
                    <NavLink to="/" className="btn btn-ghost normal-case text-xl">arranke</NavLink>
                </div>
                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1">
                        <li>
                            <NavLink to="/about" className="btn btn-ghost">about</NavLink>
                        </li>
                        <li>
                            <NavLink to="/projects" className="btn btn-ghost">arrankes</NavLink>
                        </li>
                    </ul>
                </div>
                <div className="navbar-end">
                    <ThemeToggle />
                    {isLoggedIn ? (
                        <NavLink to="/profile" className="btn btn-primary">perfil</NavLink>
                    ) : (
                        <NavLink to="/login" className="btn btn-primary">unete</NavLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;