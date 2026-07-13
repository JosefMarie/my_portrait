import { z } from "zod";
import DOMPurify from "dompurify";

// Strict Zod schema for registration
export const registrationSchema = z.object({
  role: z.enum(["artist", "buyer"]),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address format." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." }),
  fullName: z
    .string()
    .trim()
    .max(50, { message: "Full Name must be less than 50 characters." })
    .optional(), // We make it optional in schema and refine based on role
  displayName: z
    .string()
    .trim()
    .max(30, { message: "Display Name must be less than 30 characters." })
    .optional(),
  preferences: z
    .array(z.string())
    .optional()
}).superRefine((data, ctx) => {
  // If role is buyer, fullName is absolutely required
  if (data.role === "buyer") {
    if (!data.fullName || data.fullName.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full Name is required for collectors.",
        path: ["fullName"]
      });
    }
  }
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Sanitization Wrapper
export const sanitizeInput = (input: string | undefined): string => {
  if (!input) return "";
  // DOMPurify strips out <script> and dangerous HTML
  // Note: DOMPurify needs a window object. In a server environment or SSR, we might need JSDOM or just basic escaping.
  // Next.js client components have window.
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }); // Strip all tags
  }
  // Basic fallback for SSR
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export const sanitizePreferences = (prefs: string[] | undefined): string[] => {
  if (!prefs) return [];
  return prefs.map(p => sanitizeInput(p));
};

// Strict Zod schema for Artist Application
export const artistApplicationSchema = z.object({
  legalName: z.string().trim().min(2, { message: "Legal Name is required." }),
  phone: z.string().trim().min(5, { message: "Valid phone number is required." }),
  address: z.string().trim().min(5, { message: "Studio/Business address is required." }),
  websiteUrl: z.string().url({ message: "Must be a valid URL (e.g., https://instagram.com/myart)" }),
  statement: z.string().trim().min(200, { message: "Artist statement must be at least 200 characters long." }),
  signatureUrl: z.string().url({ message: "Signature upload is required." }),
  portfolioUrls: z.array(z.string().url()).min(1, { message: "You must upload at least 1 portfolio image." })
});

export type ArtistApplicationFormData = z.infer<typeof artistApplicationSchema>;
