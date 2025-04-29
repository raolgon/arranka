import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';

// Password validation criteria
const MIN_PASSWORD_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  // Calculate password strength (0-5)
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= MIN_PASSWORD_LENGTH) strength++;
    if (HAS_UPPERCASE.test(password)) strength++;
    if (HAS_LOWERCASE.test(password)) strength++;
    if (HAS_NUMBER.test(password)) strength++;
    if (HAS_SPECIAL.test(password)) strength++;

    // Extra point for having both uppercase and numbers
    if (HAS_UPPERCASE.test(password) && HAS_NUMBER.test(password)) strength++;

    setPasswordStrength(strength);
  }, [password]);

  // Detect caps lock
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password strength and specific requirements
    if (passwordStrength < 4) {
      setError('La contraseña no es lo suficientemente segura. Por favor, incluya mayúsculas, minúsculas, números y caracteres especiales.');
      setLoading(false);
      return;
    }

    // Specifically require uppercase and numbers
    if (!HAS_UPPERCASE.test(password)) {
      setError('La contraseña debe contener al menos una letra mayúscula.');
      setLoading(false);
      return;
    }

    if (!HAS_NUMBER.test(password)) {
      setError('La contraseña debe contener al menos un número.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setError(null);
        // Show success message instead of error
        setError('Se ha enviado un correo de verificación. Por favor, revise su bandeja de entrada.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (loading && !error) {
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
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          {error && (
            <div className={`alert ${error.includes('verificación') ? 'alert-success' : 'alert-error'} mb-4`}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Contraseña</span>
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  className="input input-bordered w-full pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setCapsLockOn(false)}
                  onFocus={(e) => handleKeyDown(e as unknown as React.KeyboardEvent)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password character counter */}
              <div className="flex justify-between mt-1">
                <div>
                  {capsLockOn && (
                    <div className="flex items-center text-warning text-xs">
                      <AlertTriangle size={14} className="mr-1" />
                      <span>Bloq Mayús activado</span>
                    </div>
                  )}
                </div>
                <span className={`text-xs ${password.length < MIN_PASSWORD_LENGTH ? 'text-error' : 'text-success'}`}>
                  {password.length}/{MIN_PASSWORD_LENGTH} caracteres mínimos
                </span>
              </div>

              {isSignUp && password && (
                <div className="mt-2">
                  <div className="text-sm mb-1">Seguridad de la contraseña:</div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full ${passwordStrength >= level ?
                          level <= 1 ? 'bg-error' :
                          level <= 3 ? 'bg-warning' :
                          'bg-success' : 'bg-base-300'}`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      {password.length >= MIN_PASSWORD_LENGTH ? <Check size={16} className="text-success" /> : <X size={16} className="text-error" />}
                      <span>8+ caracteres</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {HAS_UPPERCASE.test(password) ? <Check size={16} className="text-success" /> : <X size={16} className="text-error" />}
                      <span>Mayúsculas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {HAS_LOWERCASE.test(password) ? <Check size={16} className="text-success" /> : <X size={16} className="text-error" />}
                      <span>Minúsculas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {HAS_NUMBER.test(password) ? <Check size={16} className="text-success" /> : <X size={16} className="text-error" />}
                      <span>Números</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {HAS_SPECIAL.test(password) ? <Check size={16} className="text-success" /> : <X size={16} className="text-error" />}
                      <span>Caracteres especiales</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-control mt-6">
              <button
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                type="submit"
                disabled={loading || (isSignUp && (passwordStrength < 4 || !HAS_UPPERCASE.test(password) || !HAS_NUMBER.test(password)))}
              >
                {loading ? 'Procesando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="divider">O</div>

          <div className="text-center">
            <button
              className="btn btn-link"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
