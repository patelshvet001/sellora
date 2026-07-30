# Sellora - Email Notifications & Card Redesign TODO

## Step 1: Add New Email Templates to mailer.js
- [x] `sendOrderPlacedEmail` - Full order confirmation with items, amount, address
- [x] `sendOrderStatusEmail` - Order status change notification (all statuses)
- [x] `sendBookingRequestedEmail` - Booking confirmation with service details
- [x] `sendBookingStatusEmail` - Booking status change notification (all statuses)
- [x] `sendVendorOrderNotification` - Notify vendor of new order
- [x] `sendProviderBookingNotification` - Notify provider of new booking
- [x] `sendApprovalStatusEmail` - Notify partner when approved/rejected

## Step 2: Update Controllers to Send Emails
- [x] `orderController.js` - Send email on `createOrder` and `updateOrderStatus`
- [x] `bookingController.js` - Send email on `createBooking` and `updateBookingStatus`
- [x] `adminController.js` - Send email on approve/reject actions

## Step 3: Fix Card Component Padding
- [x] Card.vue - Component is already well-structured with `p-5` padding, `padded` prop, and `rounded-2xl`

## Step 4: Fix Dashboard Components
- [x] `DashboardOverview.vue` - Connected to real orders/bookings/address stores with loading states
- [x] `DashboardOrders.vue` - Connected to real orders store with proper data display

## Step 5: Fix UI Pages Padding & Card Usage
- [x] All pages reviewed - consistent Card component usage with `p-5` padding throughout

## ✅ Complete - All Tasks Done
