import { useState } from "react";
import { supabase } from "../../supabaseClient";
import GoogleButton from "./GoogleButton";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleLogin = async(event: React.FormEvent) => {
        event.preventDefault();

        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });

        if (error) {
            console.error('Error:', error.message);
        } else {
            alert('Ve tu email para iniciar sesion');
        }
        setLoading(false);
    }

    const handleGoogleLogin = async() => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('Error:', error.message);
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="card card-border bg-base-100 w-96">
            <div className="card-body">
                <h2 className="card-title">Iniciar Sesion</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="tu corrreo"
                        className="input input-primary"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                    />
                    <div className="card-actions justify-end">
                        <button className="btn btn-primary" disabled={loading}>mandar</button>
                    </div>
                </form>

                <div className="divider">O</div>

                <GoogleButton
                    onClick={handleGoogleLogin}
                    disabled={loading}
                />
            </div>
        </div>
    )
}
