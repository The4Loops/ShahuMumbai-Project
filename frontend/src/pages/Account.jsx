import React, { useState } from 'react';

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (isRegistering && !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (isRegistering && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('Form submitted', formData);
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 min-h-36">
      <div className="bg-white p-6 sm:p-8 rounded-lg w-full max-w-sm shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isRegistering ? 'Register' : 'Sign In'}
          </h2>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
              setErrors({});
            }}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isRegistering ? 'Have an account? Sign In' : 'Create Account'}
          </button>
        </div>

        <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors mb-4 w-full">
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          {isRegistering ? 'Sign up with Google' : 'Sign in with Google'}
        </button>

        <div className="relative text-center my-3 text-sm text-gray-500">
          <span className="before:absolute before:left-0 before:top-1/2 before:w-[40%] before:h-px before:bg-gray-300 after:absolute after:right-0 after:top-1/2 after:w-[40%] after:h-px after:bg-gray-300">
            OR
          </span>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 transition-colors"
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </>
          )}
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 transition-colors"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}

          <input
            type="password"
            name="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 transition-colors"
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}

          {isRegistering && (
            <>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 transition-colors"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </>
          )}
          <button
            type="submit"
            className="bg-gray-900 text-white font-semibold py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        {!isRegistering && (
          <label className="text-sm text-gray-700 mt-2 flex items-center">
            <input type="checkbox" className="mr-2" />
            Remember me
          </label>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
