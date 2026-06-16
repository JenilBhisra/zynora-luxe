import { z } from "zod";
import { validateGSTINFormatAndChecksum } from "./gst-verification";

// 1. Authentication & OTP Schemas
export const SendOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
  otp: z.string().length(6, "Verification code must be exactly 6 digits.").regex(/^\d+$/, "OTP must only contain numbers."),
});

export const SessionSyncSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required."),
});

// 2. B2B / Wholesale Schema
export const B2BInquirySchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(100).trim(),
  companyName: z.string().min(2, "Please enter your legal company name.").max(100).trim(),
  registrationNumber: z.string().trim().toUpperCase().refine(
    (val) => validateGSTINFormatAndChecksum(val),
    { message: "GST verification failed. Please check your GST number and try again." }
  ),
  email: z.string().email("Please enter a valid business email.").trim().toLowerCase(),
  phone: z.string().min(10, "Please enter a valid phone number.").max(15).regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format."),
  volume: z.string().min(1, "Please specify your target inventory volume.").trim(),
  details: z.string().min(10, "Please provide more details about your inquiry.").max(2000).trim(),
});

// 3. Contact Form Schema
export const ContactFormSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(100).trim(),
  email: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
  phone: z.string().max(15).regex(/^\+?[0-9\s\-]*$/, "Invalid phone number format.").optional().or(z.literal("")),
  subject: z.string().min(3, "Please enter a subject (minimum 3 characters).").max(150).trim(),
  message: z.string().min(10, "Please enter your message (minimum 10 characters).").max(2000).trim(),
});

// 4. Customization Request Schema
export const CustomizationRequestSchema = z.object({
  productId: z.string().trim().optional().nullable(),
  productName: z.string().min(1, "Product name is required.").max(150).trim(),
  productSku: z.string().trim().optional().nullable(),
  productPrice: z.union([z.number(), z.string()]).optional().nullable(),
  productUrl: z.string().url("Invalid product URL format.").optional().or(z.literal("")).nullable(),
  customerName: z.string().min(2, "Please enter your name.").max(100).trim(),
  customerEmail: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
  customerPhone: z.string().min(10, "Please enter a valid phone number.").max(15).regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format."),
  jewelrySize: z.string().max(20).trim().optional().nullable(),
  metalType: z.string().max(50).trim().optional().nullable(),
  stoneType: z.string().max(50).trim().optional().nullable(),
  stoneSize: z.string().max(50).trim().optional().nullable(),
  engraving: z.string().max(100).trim().optional().nullable(),
  requirements: z.string().min(5, "Please specify your customization requests.").max(1500).trim(),
});

// 5. Razorpay Webhook & Signature Verification Schemas
export const RazorpayVerifySchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required."),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required."),
  razorpay_signature: z.string().min(1, "Razorpay signature is required."),
});

// 6. User Profile Schemas
export const ProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long.").max(100).trim(),
});

// 7. Place Order Schema
export const OrderItemSchema = z.object({
  id: z.string().trim().optional().nullable(), // Nullable/optional for custom configuration
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  price: z.number().nonnegative(),
  isCustomRing: z.boolean().optional(),
  ringConfigurationId: z.string().trim().optional().nullable(),
  metalType: z.string().trim().optional().nullable(),
});

export const CustomerSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(100).trim(),
  email: z.string().email("Please enter a valid email address.").trim().toLowerCase(),
  phone: z.string().min(10, "Please enter your phone number.").max(15).regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format."),
  address: z.string().min(5, "Please enter your complete address.").max(300).trim(),
  city: z.string().min(2, "Please enter your city.").max(100).trim(),
  state: z.string().min(2, "Please enter your state.").max(100).trim(),
  pincode: z.string().min(6, "Pincode must be at least 6 digits.").max(10).regex(/^[0-9]+$/, "Pincode must only contain numbers."),
});

export const PlaceOrderSchema = z.object({
  orderType: z.enum(["CART", "CUSTOM_RING"]),
  customer: CustomerSchema,
  items: z.array(OrderItemSchema).optional(),
  subtotal: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
  gstAmount: z.number().nonnegative().optional(),
  gstType: z.enum(["CGST_SGST", "IGST"]).optional().nullable(),
  billingState: z.string().max(100).trim().optional().nullable(),
  shippingState: z.string().max(100).trim().optional().nullable(),
  gstNumber: z.string().toUpperCase().trim().optional().nullable().refine(
    (val) => !val || validateGSTINFormatAndChecksum(val),
    { message: "Please enter a valid GST number." }
  ),
  razorpayId: z.string().trim().optional().nullable(),
  ringConfigurationId: z.string().trim().optional().nullable(),
  totalPrice: z.number().nonnegative().optional(),
  settingName: z.string().trim().optional().nullable(),
  diamondShape: z.string().trim().optional().nullable(),
  diamondCarat: z.number().optional().nullable(),
  metalType: z.string().trim().optional().nullable(),
  paymentMethod: z.string().trim().optional().nullable(),
});
