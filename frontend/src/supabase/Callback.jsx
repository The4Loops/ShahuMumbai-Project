import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import supabase from './SupaBase';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error('Session error:', error?.message);
          return;
        }

        const token = data.session.access_token;

        // Axios POST Request to backend SSO login API
        const res = await axios.post(
          '/api/auth/ssoLogin',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true // If needed for cookies
          }
        );

        if (res.data?.token) {
          localStorage.setItem('token', res.data.token); // Store backend JWT
          navigate('/home');
        } else {
          console.error('SSO failed:', res.data?.error || 'Unknown error');
        }
      } catch (err) {
        console.error('SSO Login Error:', err.message);
      }
    };

    fetchSession();
  }, [navigate]);

  return <p>Logging you in with Google...</p>;
};

export default Callback;
