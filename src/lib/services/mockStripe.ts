// Mock Stripe Connect Escrow Service

export interface MockPayment {
  id: string;
  amount: number;
  buyerId: string;
  artistId: string;
  status: "held_in_escrow" | "released" | "refunded";
  createdAt: number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

/**
 * Simulates holding funds in an escrow account.
 * In a real Stripe integration, this would create a PaymentIntent 
 * with capture_method: 'manual' or routing to a connected account.
 */
export const createEscrowPayment = async (
  amount: number, 
  buyerId: string, 
  artistId: string
): Promise<MockPayment> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: \`mock_pi_\${generateId()}\`,
        amount,
        buyerId,
        artistId,
        status: "held_in_escrow",
        createdAt: Date.now(),
      });
    }, 1500); // Simulate network delay
  });
};

/**
 * Simulates releasing funds to the artist.
 * In a real Stripe integration, this would capture the PaymentIntent
 * or transfer funds to the artist's connected account.
 */
export const releaseEscrow = async (paymentId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(\`Funds for payment \${paymentId} released to artist.\`);
      resolve(true);
    }, 1000);
  });
};

/**
 * Simulates refunding the buyer.
 */
export const refundEscrow = async (paymentId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(\`Payment \${paymentId} refunded to buyer.\`);
      resolve(true);
    }, 1000);
  });
};
