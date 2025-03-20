import React, { useState, useEffect } from 'react';
import SubscriptionPromo from '../components/SubscriptionPromo';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/subscription.css';

// Assuming you'll have this from your auth system
const useAuth = () => {
  // This is a placeholder - replace with your actual auth logic
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking auth status
    const checkAuthStatus = async () => {
      try {
        // In reality, you would fetch from your API
        // const response = await fetch('/api/auth/status');
        // const data = await response.json();
        
        // For demo purposes
        const mockAuthCheck = new Promise(resolve => {
          setTimeout(() => {
            resolve({ 
              isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
              isSubscribed: localStorage.getItem('isSubscribed') === 'true'
            });
          }, 500);
        });
        
        const { isLoggedIn, isSubscribed } = await mockAuthCheck;
        
        setIsLoggedIn(isLoggedIn);
        setIsSubscribed(isSubscribed);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  return { isLoggedIn, isSubscribed, isLoading };
};

const stripePromise = loadStripe(import.meta.env.STRIPE_PUBLISHABLE_KEY);

const Lessons = () => {
  const { isLoggedIn, isSubscribed, isLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    // Only fetch client secret if user is logged in but not subscribed
    if (isLoggedIn && !isSubscribed && !isLoading) {
      const getClientSecret = async () => {
        try {
          // This would be a real API call in your actual implementation
          // const response = await fetch('/api/setup-subscription-intent');
          // const data = await response.json();
          // setClientSecret(data.clientSecret);
          
          // For demo purposes
          setClientSecret('mock_client_secret');
        } catch (error) {
          console.error('Error fetching client secret:', error);
        }
      };
      
      getClientSecret();
    }
  }, [isLoggedIn, isSubscribed, isLoading]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Show lessons content if user is logged in and subscribed
  if (isLoggedIn && isSubscribed) {
    return (
      <div className="lessons-page">
        <h1>Premium Lessons</h1>
        <div className="lessons-container">
          <div className="lesson-section">
            <h2>Beginner Lessons</h2>
            <ul className="lesson-list">
              <li className="lesson-item">
                <h3>Introduction to Basics</h3>
                <p>Learn fundamental concepts and vocabulary</p>
                <a href="#lesson-1" className="lesson-link">Start Lesson</a>
              </li>
              <li className="lesson-item">
                <h3>Essential Phrases</h3>
                <p>Master everyday expressions and greetings</p>
                <a href="#lesson-2" className="lesson-link">Start Lesson</a>
              </li>
            </ul>
          </div>
          
          <div className="lesson-section">
            <h2>Intermediate Lessons</h2>
            <ul className="lesson-list">
              <li className="lesson-item">
                <h3>Conversation Skills</h3>
                <p>Develop fluency in common scenarios</p>
                <a href="#lesson-3" className="lesson-link">Start Lesson</a>
              </li>
              <li className="lesson-item">
                <h3>Grammar Structures</h3>
                <p>Build complex sentences with confidence</p>
                <a href="#lesson-4" className="lesson-link">Start Lesson</a>
              </li>
            </ul>
          </div>
          
          <div className="lesson-section">
            <h2>Advanced Lessons</h2>
            <ul className="lesson-list">
              <li className="lesson-item">
                <h3>Cultural Insights</h3>
                <p>Understand language in cultural context</p>
                <a href="#lesson-5" className="lesson-link">Start Lesson</a>
              </li>
              <li className="lesson-item">
                <h3>Advanced Topics</h3>
                <p>Master complex language structures</p>
                <a href="#lesson-6" className="lesson-link">Start Lesson</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show promo if user is not logged in or not subscribed
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscriptionPromo isLoggedIn={isLoggedIn} />
    </Elements>
  );
};

export default Lessons;