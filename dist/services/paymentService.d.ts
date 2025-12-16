export declare const createEscrowPayment: (bookingId: string, amount: number, customerId: string) => Promise<import("stripe").Stripe.Response<import("stripe").Stripe.PaymentIntent>>;
export declare const releaseEscrow: (bookingId: string) => Promise<boolean>;
export declare const refundPayment: (paymentIntentId: string) => Promise<import("stripe").Stripe.Response<import("stripe").Stripe.Refund>>;
//# sourceMappingURL=paymentService.d.ts.map