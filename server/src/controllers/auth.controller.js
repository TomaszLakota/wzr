import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import stripe from 'stripe';
import { sendActivationEmail, sendPasswordResetEmail } from './email.controller.js';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Register a new user
export const register = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Proszę podać imię, email i hasło.' });
  }

  try {
    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 means no rows found
      console.error('Error checking for existing user:', findError);
      return res.status(500).json({ error: 'Błąd serwera podczas rejestracji.' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Użytkownik o tym adresie email już istnieje.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');

    // Create user in the database
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          activation_token: activationToken,
          is_active: false,
          subscription_status: 'inactive',
        },
      ])
      .select('id, email')
      .single();

    if (insertError) {
      console.error('Error inserting new user:', insertError);
      return res.status(500).json({ error: 'Nie udało się utworzyć użytkownika.' });
    }

    // Construct activation link
    const activationLink = `${process.env.FRONTEND_URL}/aktywacja?token=${activationToken}`;

    // Send activation email
    try {
      await sendActivationEmail(newUser.email, activationLink);
      res
        .status(201)
        .json({ message: 'Rejestracja pomyślna! Sprawdź email, aby aktywować konto.' });
    } catch (emailError) {
      console.error('Error sending activation email:', emailError);
      res.status(201).json({
        message:
          'Rejestracja pomyślna, ale nie udało się wysłać emaila aktywacyjnego. Skontaktuj się z nami w celu aktywacji konta.',
      });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd.' });
  }
};

// Activate user account
export const activateAccount = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Brak tokena aktywacyjnego.' });
  }

  try {
    // Find user by activation token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('activation_token', token)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding user by token:', findError);
      return res.status(500).json({ error: 'Błąd serwera podczas aktywacji.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'Nieprawidłowy lub wygasły token aktywacyjny.' });
    }

    if (user.is_active) {
      return res.status(400).json({ error: 'Konto zostało już aktywowane.' });
    }

    // Activate user: set is_active to true and clear token
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: true, activation_token: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error activating user:', updateError);
      return res.status(500).json({ error: 'Nie udało się aktywować konta.' });
    }

    res.status(200).json({ message: 'Konto pomyślnie aktywowane! Możesz się teraz zalogować.' });
  } catch (error) {
    console.error('Error during account activation:', error);
    res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd podczas aktywacji.' });
  }
};

// Login User
export const login = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Proszę podać email i hasło.' });
  }

  try {
    // Fetch user from Supabase
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (selectError || !user) {
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching user:', selectError);
      }
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Konto nie zostało aktywowane. Sprawdź email.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło.' });
    }

    let userForToken = { ...user };
    let updatedUserData = {};

    if (user.stripe_customer_id) {
      try {
        const subscriptions = await stripeClient.subscriptions.list({
          customer: user.stripe_customer_id,
          limit: 1,
          status: 'active',
        });

        const isSubscribed = subscriptions.data.length > 0;
        const currentDbStatus = user.subscription_status === 'active';

        // Update user subscription status in DB if needed
        if (currentDbStatus !== isSubscribed) {
          const newStatus = isSubscribed ? 'active' : 'inactive';
          console.log(
            `[LOGIN] Updating subscription status from ${user.subscription_status} to ${newStatus}`
          );
          updatedUserData.subscription_status = newStatus;
          userForToken.subscription_status = newStatus;
        }
      } catch (error) {
        console.error(`[LOGIN] Error checking subscription status: ${error.message}`);
      }
    }

    // Persist updates if any
    if (Object.keys(updatedUserData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updatedUserData)
        .eq('id', user.id);

      if (updateError) {
        console.error('[LOGIN] Error updating user subscription status in DB:', updateError);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: userForToken.id,
        email: userForToken.email,
        name: userForToken.name,
        stripeCustomerId: userForToken.stripe_customer_id,
        subscriptionStatus: userForToken.subscription_status,
      },
      process.env.JWT_SECRET,
      { expiresIn: '4w' }
    );

    // Return response (Matches original structure)
    const { password: _, ...userWithoutPassword } = userForToken;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', {
      email,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd podczas logowania.' });
  }
};

// Handle forgot password request
export const forgotPassword = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Proszę podać adres email.' });
  }

  try {
    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString();

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    // Always return success even if user not found (security best practice)
    if (findError || !user) {
      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding user by email:', findError);
      }

      // Return success anyway to prevent email enumeration
      return res.status(200).json({
        message:
          'Jeśli konto z podanym adresem email istnieje, wysłaliśmy na niego instrukcje resetowania hasła.',
      });
    }

    // Update user with reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user with reset token:', updateError);
      return res.status(500).json({ error: 'Wystąpił błąd podczas przetwarzania żądania.' });
    }

    // Construct reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-hasla?token=${resetToken}`;

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Continue without returning an error to client
    }

    // Return success response
    res.status(200).json({
      message:
        'Jeśli konto z podanym adresem email istnieje, wysłaliśmy na niego instrukcje resetowania hasła.',
    });
  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd.' });
  }
};

// Handle password reset with token
export const resetPassword = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Brak tokena lub nowego hasła.' });
  }

  try {
    // Find user by reset token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (findError || !user) {
      return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token resetujący.' });
    }

    // Check if token has expired
    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Token resetujący wygasł. Poproś o nowy link.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Nie udało się zaktualizować hasła.' });
    }

    res
      .status(200)
      .json({ message: 'Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ error: 'Wystąpił nieoczekiwany błąd podczas resetowania hasła.' });
  }
};
