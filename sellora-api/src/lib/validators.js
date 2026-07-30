const { z } = require('zod');

const phoneField = z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional().or(z.literal(''));

const baseFields = {
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: phoneField,
};

// Plain customer registration
const customerSchema = z.object({
  ...baseFields,
  role: z.literal('CUSTOMER'),
});

// Seller / Vendor registration
const vendorSchema = z.object({
  ...baseFields,
  role: z.literal('VENDOR'),
  storeName: z.string().min(2, 'Store name is required'),
  category: z.string().min(2, 'Category is required'),
  gstNumber: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().min(4, 'Pincode is required'),
});

// Delivery partner registration
const deliveryPartnerSchema = z.object({
  ...baseFields,
  role: z.literal('DELIVERY_PARTNER'),
  vehicleType: z.enum(['bike', 'scooter', 'car', 'bicycle']),
  vehicleNumber: z.string().min(3, 'Vehicle number is required'),
  licenseNumber: z.string().min(3, 'License number is required'),
  city: z.string().min(2, 'City is required'),
});

// Service provider registration
const serviceProviderSchema = z.object({
  ...baseFields,
  role: z.literal('SERVICE_PROVIDER'),
  businessName: z.string().min(2, 'Business name is required'),
  category: z.string().min(2, 'Category is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  bio: z.string().optional(),
});

const registerSchema = z.discriminatedUnion('role', [
  customerSchema,
  vendorSchema,
  deliveryPartnerSchema,
  serviceProviderSchema,
]);

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Profile update schema (all fields optional)
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name is too short').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: phoneField,
  avatarUrl: z.string().optional(),
});

// Address schemas — shared by create/update so both routes validate the same way
const addressLabel = z.enum(['HOME', 'WORK', 'OTHER']).optional();
const pincodeField = z.string().min(4, 'Pincode is required').max(10, 'Enter a valid pincode');

const createAddressSchema = z.object({
  label: addressLabel,
  line1: z.string().min(3, 'Address line is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: pincodeField,
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

// All fields optional on update, but any field that IS present must still be valid
const updateAddressSchema = createAddressSchema.partial();

// Review schema — exactly one of productId/serviceId must be present
const reviewSchema = z
  .object({
    productId: z.number().int().positive().optional(),
    serviceId: z.number().int().positive().optional(),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().max(2000, 'Comment is too long').optional(),
  })
  .refine((data) => !!data.productId !== !!data.serviceId, {
    message: 'Provide either productId or serviceId, not both',
  });

module.exports = {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  reviewSchema,
};
