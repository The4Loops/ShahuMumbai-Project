const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');
const { encryptData } = require('../utils/crypto');

// REGISTER
exports.register = async (req, res) => {
  try {
    const { full_name, phone, address, email, password, payment } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Encrypt payment data only if provided
    const encryptedPayment = payment ? encryptData(payment) : null;

    const { data, error } = await supabase.from('users').insert([
      {
        full_name,
        phone,
        address,
        email,
        password: hashedPassword,
        payment: encryptedPayment,
        role: 'user' // default role
      }
    ]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data)
      return res.status(400).json({ error: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, data.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Generate JWT
    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        role: data.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SSO LOGIN
exports.ssoLogin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid Supabase token' });

    // Check if user exists in your DB
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!existingUser) {
      await supabase.from('users').insert([{
        full_name: user.user_metadata.full_name || user.email,
        email: user.email,
        phone: '',
        address: '',
        password: '',
        role: 'user'
      }]);
    }

    // Create your app JWT
    const appToken = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token: appToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};