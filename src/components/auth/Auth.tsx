import { useState } from "react";
import { supabase } from "../../supabaseClient";

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
            </div>
        </div>
    )
}