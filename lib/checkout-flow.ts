import type { StoredOrderItem } from "@/lib/order-storage";

export type CheckoutDetails = {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    paymentMethod: string;
    state?: string;
};

export type CheckoutValidationErrors = Partial<Record<keyof CheckoutDetails, string>>;

export function validateCheckoutDetails(details: CheckoutDetails) {
    const errors: CheckoutValidationErrors = {};

    if (!details.name.trim()) errors.name = "Enter the name for this order.";
    if (!details.email.trim()) errors.email = "Enter a valid email address.";
    if (!details.phone.trim()) errors.phone = "Enter a valid phone number.";
    if (!details.address.trim()) errors.address = "Enter the delivery address.";
    if (!details.city.trim()) errors.city = "Enter the city for delivery.";
    if (!details.pincode.trim()) errors.pincode = "Enter the delivery PIN code.";
    if (!details.paymentMethod.trim()) errors.paymentMethod = "Choose a payment method.";

    return errors;
}

export function calculateEstimatedDeliveryDate(items: StoredOrderItem[], createdAt = new Date()) {
    const hasCustomItem = items.some((item) => item.isCustomRing);
    const deliveryWindowDays = hasCustomItem ? 28 : 7;

    const estimatedDelivery = new Date(createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryWindowDays);
    return estimatedDelivery.toISOString();
}
