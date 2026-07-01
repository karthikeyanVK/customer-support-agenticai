// prisma/seed.ts — Seeds the database with realistic sample data
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const customerData = [
  { firstName: "James",    lastName: "Wilson",    email: "james.wilson@gmail.com",    phone: "555-0101" },
  { firstName: "Sarah",    lastName: "Johnson",   email: "sarah.johnson@outlook.com", phone: "555-0102" },
  { firstName: "Michael",  lastName: "Brown",     email: "michael.brown@gmail.com",   phone: "555-0103" },
  { firstName: "Emily",    lastName: "Davis",     email: "emily.davis@yahoo.com",     phone: "555-0104" },
  { firstName: "Daniel",   lastName: "Martinez",  email: "daniel.martinez@gmail.com", phone: "555-0105" },
  { firstName: "Olivia",   lastName: "Taylor",    email: "olivia.taylor@icloud.com",  phone: "555-0106" },
  { firstName: "Matthew",  lastName: "Anderson",  email: "matt.anderson@gmail.com",   phone: "555-0107" },
  { firstName: "Sophia",   lastName: "Thomas",    email: "sophia.thomas@outlook.com", phone: "555-0108" },
  { firstName: "David",    lastName: "Jackson",   email: "david.jackson@gmail.com",   phone: "555-0109" },
  { firstName: "Isabella",  lastName: "White",    email: "isabella.white@yahoo.com",  phone: "555-0110" },
  { firstName: "Christopher", lastName: "Harris", email: "chris.harris@gmail.com",    phone: "555-0111" },
  { firstName: "Mia",      lastName: "Martin",    email: "mia.martin@outlook.com",    phone: "555-0112" },
  { firstName: "Andrew",   lastName: "Garcia",    email: "andrew.garcia@gmail.com",   phone: "555-0113" },
  { firstName: "Charlotte", lastName: "Miller",   email: "charlotte.miller@icloud.com", phone: "555-0114" },
  { firstName: "Joshua",   lastName: "Moore",     email: "joshua.moore@gmail.com",    phone: "555-0115" },
  { firstName: "Amelia",   lastName: "Taylor",    email: "amelia.taylor@gmail.com",   phone: "555-0116" },
  { firstName: "Ryan",     lastName: "Lee",       email: "ryan.lee@outlook.com",      phone: "555-0117" },
  { firstName: "Harper",   lastName: "Wilson",    email: "harper.wilson@gmail.com",   phone: "555-0118" },
  { firstName: "Nathan",   lastName: "Clark",     email: "nathan.clark@yahoo.com",    phone: "555-0119" },
  { firstName: "Evelyn",   lastName: "Lewis",     email: "evelyn.lewis@gmail.com",    phone: "555-0120" },
  { firstName: "Brandon",  lastName: "Robinson",  email: "brandon.r@gmail.com",       phone: "555-0121" },
  { firstName: "Abigail",  lastName: "Walker",    email: "abigail.walker@outlook.com", phone: "555-0122" },
  { firstName: "Tyler",    lastName: "Hall",      email: "tyler.hall@gmail.com",      phone: "555-0123" },
  { firstName: "Grace",    lastName: "Allen",     email: "grace.allen@icloud.com",    phone: "555-0124" },
  { firstName: "Kevin",    lastName: "Young",     email: "kevin.young@gmail.com",     phone: "555-0125" },
];

const productData = [
  { name: "MacBook Pro 14\"",              category: "Laptops",      price: 1999.99 },
  { name: "Surface Laptop 5",              category: "Laptops",      price: 1299.99 },
  { name: "Dell UltraSharp 27\" Monitor",  category: "Monitors",     price: 649.99  },
  { name: "Logitech MX Master 3 Mouse",    category: "Peripherals",  price: 99.99   },
  { name: "Keychron K2 Mechanical Keyboard", category: "Peripherals", price: 89.99  },
  { name: "Anker USB-C Hub 10-in-1",       category: "Accessories",  price: 49.99   },
  { name: "Herman Miller Aeron Chair",     category: "Furniture",    price: 1495.00 },
  { name: "FlexiSpot Standing Desk",       category: "Furniture",    price: 549.99  },
  { name: "Logitech C920 Webcam",          category: "Peripherals",  price: 79.99   },
  { name: "Sony WH-1000XM5 Headphones",   category: "Audio",        price: 349.99  },
  { name: "Samsung 970 EVO SSD 1TB",       category: "Storage",      price: 109.99  },
  { name: "Elgato Stream Deck MK.2",       category: "Accessories",  price: 149.99  },
  { name: "iPad Pro 12.9\"",              category: "Tablets",      price: 1099.99 },
  { name: "APC UPS Battery Backup",        category: "Power",        price: 129.99  },
  { name: "Blue Yeti USB Microphone",      category: "Audio",        price: 129.99  },
];

// Realistic distribution of order statuses
const orderStatusPool: string[] = [
  "Delivered", "Delivered", "Delivered", "Delivered", "Delivered", "Delivered",  // ~35%
  "Shipped", "Shipped", "Shipped", "Shipped",                                     // ~20%
  "Pending", "Pending", "Pending",                                                // ~15%
  "OutForDelivery", "OutForDelivery",                                             // ~10%
  "Packed", "Packed",                                                             // ~10%
  "Cancelled", "Cancelled",                                                       // ~10%
];

const ticketSubjects = [
  "Order not received",
  "Wrong item delivered",
  "Product arrived damaged",
  "Need to update delivery address",
  "Package marked delivered but missing",
  "Refund not processed",
  "How do I return an item?",
  "Charge appears twice on my card",
  "Product stopped working after 2 weeks",
  "Can I change my order?",
];

const ticketDescriptions = [
  "My order was supposed to arrive 3 days ago but I haven't received it.",
  "I received a keyboard instead of the mouse I ordered.",
  "The monitor screen was cracked when I opened the box.",
  "I moved and need to change my delivery address before shipment.",
  "The tracking shows delivered but nothing is at my door.",
  "It's been 10 days since my refund was approved and I haven't seen the money.",
  "I want to return the standing desk — it's too large for my office.",
  "I see two identical charges for $99.99 on my bank statement.",
  "My headphones stopped charging after just two weeks of use.",
  "I ordered the wrong color — can I swap it before it ships?",
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data in dependency order
  await prisma.refund.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();

  // Reset SQLite autoincrement counters so IDs start from 1 on every seed
  await prisma.$executeRawUnsafe(
    `DELETE FROM sqlite_sequence WHERE name IN ('Customer','Product','Order','Refund','SupportTicket')`
  );

  // ─── Customers ──────────────────────────────────────────────────────────────
  const customers = await Promise.all(
    customerData.map((c) => prisma.customer.create({ data: c }))
  );
  console.log(`✓ Created ${customers.length} customers`);

  // ─── Products ───────────────────────────────────────────────────────────────
  const products = await Promise.all(
    productData.map((p) => prisma.product.create({ data: p }))
  );
  console.log(`✓ Created ${products.length} products`);

  // ─── Orders (75) ────────────────────────────────────────────────────────────
  const orders = [];
  for (let i = 0; i < 75; i++) {
    const customer = pick(customers);
    const product = pick(products);
    const status = pick(orderStatusPool);
    const quantity = Math.floor(Math.random() * 3) + 1;
    const orderedDaysAgo = Math.floor(Math.random() * 120) + 5;

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        quantity,
        totalAmount: parseFloat((product.price * quantity).toFixed(2)),
        status,
        orderedAt: daysAgo(orderedDaysAgo),
        expectedDelivery: daysAgo(orderedDaysAgo - 7),
      },
    });
    orders.push(order);
  }
  console.log(`✓ Created ${orders.length} orders`);

  // ─── Refunds (20) ───────────────────────────────────────────────────────────
  // Only attach refunds to Delivered or Cancelled orders
  const refundableOrders = orders.filter(
    (o) => o.status === "Delivered" || o.status === "Cancelled"
  );

  const refundReasons = [
    "Product not as described",
    "Arrived damaged",
    "Wrong item received",
    "Changed my mind",
    "Better price found elsewhere",
    "Quality below expectations",
    "Order arrived too late",
  ];

  const refundStatuses: string[] = ["Requested", "Requested", "Approved", "Completed", "Rejected"];

  const selectedForRefund = refundableOrders.slice(0, 20);
  for (const order of selectedForRefund) {
    await prisma.refund.create({
      data: {
        orderId: order.id,
        amount: parseFloat((order.totalAmount * 0.9).toFixed(2)), // 90% refund
        status: pick(refundStatuses),
        reason: pick(refundReasons),
      },
    });
  }
  console.log(`✓ Created 20 refunds`);

  // ─── Support Tickets (20) ───────────────────────────────────────────────────
  const priorities: string[] = ["Low", "Low", "Medium", "Medium", "Medium", "High"];
  const statuses: string[] = ["Open", "Open", "Open", "InProgress", "InProgress", "Closed"];

  for (let i = 0; i < 20; i++) {
    const idx = i % ticketSubjects.length;
    const daysBack = Math.floor(Math.random() * 30) + 1;

    await prisma.supportTicket.create({
      data: {
        customerId: pick(customers).id,
        subject: ticketSubjects[idx],
        description: ticketDescriptions[idx],
        priority: pick(priorities),
        status: pick(statuses),
        createdAt: daysAgo(daysBack),
      },
    });
  }
  console.log(`✓ Created 20 support tickets`);

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
