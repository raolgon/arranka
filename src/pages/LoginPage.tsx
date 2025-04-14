import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // User is already logged in, redirect to profile page
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data) {
        setOtpSent(true);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        navigate('/profile');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (loading && !otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">Checking login status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-6">
            {otpSent ? 'Verify Email' : 'Welcome'}
          </h2>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {otpSent ? (
            <>
              <div className="alert alert-success mb-4">
                <span>OTP sent to {email}</span>
              </div>
              <form onSubmit={handleVerifyOTP}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Enter OTP</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the code from your email"
                    className="input input-bordered"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control mt-6">
                  <button
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <form onSubmit={handleSendOTP}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="input input-bordered"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control mt-6">
                  <button
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </div>
              </form>

              <div className="divider">OR</div>

              <div className="text-center">
                <p className="text-sm opacity-70">
                  We'll send you a magic link to sign in or create an account
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
