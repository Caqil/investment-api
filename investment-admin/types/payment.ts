export enum PaymentGateway {
    COINGATE = "coingate",
    UDDOKTAPAY = "uddoktapay",
    MANUAL = "manual"
  }
  
  export enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed"
  }
  
  export enum Currency {
    USD = "USD",
    BDT = "BDT"
  }
  
  export interface Payment {
    id: number;
    transaction_id: number;
    gateway: PaymentGateway;
    gateway_reference?: string;
    currency: Currency;
    amount: number;
    status: PaymentStatus;
    created_at: string;
  }