import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.error('Session error:', error?.message);
        return;
      }

      const token = data.session.access_token;

      const res = await fetch('http://localhost:5000/api/auth/sso-login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (result.token) {
        localStorage.setItem('token', result.token); // Store backend JWT
        navigate('/home');
      } else {
        console.error('SSO failed:', result.error);
      }
    };

    fetchSession();
  }, [navigate]);

  return <p>Logging you in with Google...</p>;
};

export default Callback;
