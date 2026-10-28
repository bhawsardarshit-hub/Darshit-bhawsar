
import { useState } from 'react';
import api from './api';
import './Auth.css';

export default function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const response = await api.post(endpoint, form);

      if (isRegister) {
        setMessage('Registration successful! Please log in.');
        setIsRegister(false);
        setForm({ name: '', email: form.email, password: '' });
      } else {
        localStorage.setItem('staffsyncToken', response.data.token);
        localStorage.setItem('staffsyncUser', JSON.stringify(response.data.user));
        onLogin(response.data.user);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">S</div>
        <h1>StaffSync</h1>
        <p className="auth-subtitle">Modern Human Resource Management</p>

        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>

        {isRegister && (
          <input
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        </button>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage('');
            }}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </form>
    </div>
  );
}
