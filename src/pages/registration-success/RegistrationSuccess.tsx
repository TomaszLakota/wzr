import React from 'react';
import './RegistrationSuccess.scss';

const RegistrationSuccess: React.FC = () => {
  return (
    <div className="registration-success-page">
      <h1>Rejestracja zakończona pomyślnie!</h1>
      <p>
        Dziękujemy za rejestrację. Wysłaliśmy na Twój adres e-mail link aktywacyjny.
        Kliknij go, aby dokończyć proces i móc się zalogować.
      </p>
    </div>
  );
};

export default RegistrationSuccess; 