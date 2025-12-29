export declare const sendVerificationEmail: (email: string, token: string) => Promise<void>;
export declare const sendPasswordResetEmail: (email: string, token: string) => Promise<void>;
export declare const sendPasswordChangedEmail: (email: string, name: string) => Promise<void>;
export declare const sendBookingConfirmation: (email: string, bookingDetails: any) => Promise<void>;
export declare const sendContactConfirmation: (email: string, firstName: string, subject: string) => Promise<void>;
//# sourceMappingURL=emailService.d.ts.map