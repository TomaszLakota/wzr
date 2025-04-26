export interface AuthResponse {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
  
  export interface ForgotPasswordResponse {
    message: string;
  }
  
  export interface ResetPasswordResponse {
    message: string;
  }