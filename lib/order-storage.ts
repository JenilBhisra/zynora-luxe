export type StoredOrderStatus =
    | "Order Placed"
    | "Processing"
    | "Shipped"
    | "Out for Delivery"
    | "Delivered";

export type StoredOrderItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    isCustomRing?: boolean;
    ringConfigurationId?: string;
    metalType?: string;
};

export type StoredOrder = {
    orderId: string;
    userId: string;
    userName: string;
    userEmail: string;
    items: StoredOrderItem[];
    totalAmount: number;
    status: StoredOrderStatus;
    createdAt: string;
    estimatedDeliveryDate: string;
    paymentMethod: string;
    shippingAddress: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        pincode: string;
        state?: string;
    };
};

const ORDER_STORAGE_KEY = "krishna_orders";

function canUseStorage() {
    return typeof window !== "undefined";
}

function readOrders(): StoredOrder[] {
    if (!canUseStorage()) return [];

    const rawOrders = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!rawOrders) return [];

    try {
        const parsed = JSON.parse(rawOrders) as StoredOrder[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeOrders(orders: StoredOrder[]) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
}

export function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${timestamp}-${randomSuffix}`;
}

export function createOrderId() {
    return generateOrderId();
}

export function createOrderFromCheckout(payload: {
    userId: string;
    userName: string;
    userEmail: string;
    items: StoredOrderItem[];
    totalAmount: number;
    paymentMethod: string;
    shippingAddress: StoredOrder["shippingAddress"];
}) {
    const createdAt = new Date().toISOString();

    return {
        orderId: createOrderId(),
        userId: payload.userId,
        userName: payload.userName,
        userEmail: payload.userEmail,
        items: payload.items,
        totalAmount: payload.totalAmount,
        status: "Processing" as StoredOrderStatus,
        createdAt,
        estimatedDeliveryDate: createdAt,
        paymentMethod: payload.paymentMethod,
        shippingAddress: payload.shippingAddress,
    } satisfies StoredOrder;
}

export function saveOrder(order: StoredOrder) {
    const orders = readOrders();
    const nextOrders = [order, ...orders.filter((item) => item.orderId !== order.orderId)];
    writeOrders(nextOrders);
    return order;
}

export function getOrderById(orderId: string) {
    if (!canUseStorage()) return null;
    return readOrders().find((order) => order.orderId === orderId) || null;
}

export function getLatestOrder() {
    if (!canUseStorage()) return null;
    return readOrders()[0] || null;
}

export function updateOrderStatus(orderId: string, status: StoredOrderStatus) {
    const orders = readOrders();
    const updatedOrders = orders.map((order) =>
        order.orderId === orderId ? { ...order, status } : order
    );
    writeOrders(updatedOrders);

    return updatedOrders.find((order) => order.orderId === orderId) || null;
}

export function getOrderProgressIndex(order: StoredOrder | null) {
    if (!order) return 0;

    const statusOrder: StoredOrderStatus[] = [
        "Order Placed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
    ];

    const statusIndex = statusOrder.indexOf(order.status);
    if (statusIndex >= 0) {
        return statusIndex;
    }

    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    if (orderAge > 1000 * 60 * 60 * 72) return 4;
    if (orderAge > 1000 * 60 * 60 * 48) return 3;
    if (orderAge > 1000 * 60 * 60 * 24) return 2;
    if (orderAge > 1000 * 60 * 5) return 1;
    return 0;
}

export function getTimelineLabel(index: number) {
    return ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"][index] || "Order Placed";
}
