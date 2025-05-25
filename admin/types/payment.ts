
// src/types/payment.ts
export type PaymentGateway = 
  | 'coingate'
  | 'uddoktapay'
  | 'manual';

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed';

export type Currency = 
  | 'USD'
  | 'BDT';

export type Payment = {
  id: number;
  transaction_id: number;
  gateway: PaymentGateway;
  gateway_reference?: string;
  currency: Currency;
  amount: number;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type PaymentResponse = {
  id: number;
  gateway: PaymentGateway;
  gateway_reference?: string;
  currency: Currency;
  amount: number;
  status: PaymentStatus;
  created_at: string;
};