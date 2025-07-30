import React, { useState } from 'react';
import '../styles/Account.css';

const Account = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setShowPayment(false); // reset payment details toggle on switch
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          <button onClick={toggleForm}>
            {isLogin ? 'Need an account?' : 'Already a member?'}
          </button>
        </div>

        <div className={`form-wrapper ${isLogin ? 'slide-in-left' : 'slide-in-right'}`}>
          {isLogin ? (
            <form className="auth-form">
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />
              <button type="submit">Login</button>
            </form>
          ) : (
            <form className="auth-form">
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />

              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={showPayment}
                    onChange={() => setShowPayment(!showPayment)}
                  />{" "}
                  Add payment details (optional)
                </label>
              </div>

              <div className={`payment-section ${showPayment ? 'expand' : 'collapse'}`}>
                <input type="text" placeholder="Cardholder Name" />
                <input type="text" placeholder="Card Number" />
                <input type="text" placeholder="Expiry Date (MM/YY)" />
                <input type="text" placeholder="CVV" />
              </div>

              <button type="submit">Register</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;
