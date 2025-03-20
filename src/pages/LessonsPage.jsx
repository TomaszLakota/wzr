import React, { useState, useEffect } from 'react';
import SubscriptionButton from '../components/SubscriptionButton';

const LessonsPage = () => {
  const [clientSecret, setClientSecret] = useState('');
  
  // Fetch client secret from your backend when the component mounts
  useEffect(() => {
    // In a real implementation, you would call your backend to generate a client secret
    // For now, we'll just simulate this
    const getClientSecret = async () => {
      try {
        // This would be a real API call in your actual implementation
        // const response = await fetch('/api/subscription-intent');
        // const data = await response.json();
        // setClientSecret(data.clientSecret);
        
        // For demo purposes, we're just setting a placeholder
        setClientSecret('mock_client_secret');
      } catch (error) {
        console.error('Error fetching client secret:', error);
      }
    };
    
    getClientSecret();
  }, []);

  const subscriptionOptions = [
    { 
      id: 'price_monthly', 
      name: 'Monthly Premium Lessons', 
      price: '$9.99/month',
      description: 'Access to all premium lessons with monthly billing'
    },
    { 
      id: 'price_yearly', 
      name: 'Annual Premium Lessons', 
      price: '$99.99/year',
      description: 'Access to all premium lessons with annual billing (save 16%)'
    }
  ];

  return (
    <div className="lessons-page">
      <h1>Lessons</h1>
      <div className="free-lessons">
        <h2>Free Lessons</h2>
        <ul>
          <li>Introduction to Basics</li>
          <li>Getting Started</li>
          <li>Fundamentals</li>
        </ul>
      </div>
      
      <div className="premium-lessons">
        <h2>Premium Lessons</h2>
        <div className="locked-content-message">
          <p>Unlock all premium lessons with a subscription.</p>
          <ul>
            <li>Advanced Techniques (Premium)</li>
            <li>Expert Strategies (Premium)</li>
            <li>Mastery Modules (Premium)</li>
            <li>Weekly New Content (Premium)</li>
          </ul>
        </div>
        
        <div className="subscription-options">
          <h3>Choose Your Subscription Plan</h3>
          <div className="subscription-cards">
            {subscriptionOptions.map((option) => (
              <div key={option.id} className="subscription-card">
                <h4>{option.name}</h4>
                <p className="price">{option.price}</p>
                <p>{option.description}</p>
                {clientSecret && (
                  <SubscriptionButton 
                    priceId={option.id} 
                    productName={option.name} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage; 