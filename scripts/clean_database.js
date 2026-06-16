const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "krishnadiamond404@gmail.com";
  console.log("Starting database cleanup for production launch...");

  try {
    // 1. Delete dependent transactional data first to avoid foreign key violations
    console.log("Cleaning up transactional records (Reviews, OrderItems, Configurations, Orders)...");
    const reviews = await prisma.review.deleteMany({});
    const orderItems = await prisma.orderItem.deleteMany({});
    const ringConfigs = await prisma.ringConfiguration.deleteMany({});
    const orders = await prisma.order.deleteMany({});
    const customRequests = await prisma.customizationRequest.deleteMany({});
    const otpVerifications = await prisma.otpVerification.deleteMany({});

    console.log(`Deleted:
      - ${reviews.count} Reviews
      - ${orderItems.count} OrderItems
      - ${ringConfigs.count} RingConfigurations
      - ${orders.count} Orders
      - ${customRequests.count} Customization Requests
      - ${otpVerifications.count} OTP Verification attempts`);

    // 2. Delete inventory/store product catalogs
    console.log("Cleaning up catalog records (Products, Settings, Categories, Diamonds, SiteAssets)...");
    const products = await prisma.product.deleteMany({});
    const settings = await prisma.setting.deleteMany({});
    const categories = await prisma.category.deleteMany({});
    const diamonds = await prisma.diamond.deleteMany({});
    const siteAssets = await prisma.siteAsset.deleteMany({});

    console.log(`Deleted:
      - ${products.count} Products
      - ${settings.count} Settings
      - ${categories.count} Categories
      - ${diamonds.count} Diamonds
      - ${siteAssets.count} SiteAssets`);

    // 3. Clean users except admin
    console.log("Cleaning up users list (preserving admin account)...");
    
    // Find admin user first
    const adminUser = await prisma.user.findFirst({
      where: { email: { equals: adminEmail } }
    });

    // Delete all other users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        NOT: {
          email: adminEmail
        }
      }
    });

    console.log(`Deleted ${deletedUsers.count} demo users.`);

    // If admin doesn't exist, create it now
    if (!adminUser) {
      console.log(`Creating Admin user profile for: ${adminEmail}`);
      const createdAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Zynora Admin",
          role: "ADMIN",
        }
      });
      console.log(`Successfully created Admin account (ID: ${createdAdmin.id})`);
    } else {
      // Ensure existing admin has ADMIN role
      if (adminUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { role: "ADMIN" }
        });
        console.log(`Updated role to ADMIN for user: ${adminEmail}`);
      } else {
        console.log(`Preserved existing Admin user: ${adminEmail}`);
      }
    }

    console.log("\nDatabase cleanup successfully completed!");
  } catch (error) {
    console.error("Error executing database cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
