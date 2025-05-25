// src/types/auth.ts
import { User, UserResponse } from "./user";

// Define the basic login request interface
export type LoginRequest = {
  email: string;
  password: string;
};

// Define the login response interface
export type LoginResponse = {
  token: string;
  user: User;
};

// Extended session type for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      isAdmin: boolean;
    };
    token: string;
  }
  
  interface User {
    id: string;
    email: string;
    name: string;
    image: string;
    token: string;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture: string;
    token: string;
    isAdmin: boolean;
  }
}