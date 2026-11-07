import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Activity and Payment logs...');

  // 1. Clear existing logs
  await prisma.activityLog.deleteMany({});
  await prisma.paymentLog.deleteMany({});

  // 2. Create some sample activity logs
  const activityLogs = [
    {
      action: 'LOGIN',
      details: 'Administrator logged in successfully from authorized IP.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.15',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    },
    {
      action: 'CREATE_PRODUCT',
      details: 'Created new product "Classic Cotton Overshirt" in Categories > Apparel.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.15',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.8),
    },
    {
      action: 'UPDATE_PRODUCT_QTY',
      details: 'Updated stock quantities for variation "SKU-1001-XL" to 15 units.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.15',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.5),
    },
    {
      action: 'CREATE_COUPON',
      details: 'Created coupon code "SUMMERLUXE26" with 15% discount type and limit 100.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.15',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      action: 'CREATE_CAMPAIGN',
      details: 'Created draw campaign "Summer Sale" with prize "Signature Silk Suit".',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.15',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.5),
    },
    {
      action: 'UPDATE_CAMPAIGN',
      details: 'Published draw campaign "Summer Sale" to ACTIVE state.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.15',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.2),
    },
    {
      action: 'UPDATE_ORDER_STATUS',
      details: 'Updated Order #ORD-893021 to status SHIPPED. DHL Express tracking assigned.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.18',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.8),
    },
    {
      action: 'BAN_USER',
      details: 'Banned user "junk_buyer@example.com" due to repeated fraudulent payment attempts.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.18',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.5),
    },
    {
      action: 'GENERATE_REPORTS',
      details: 'Generated and exported monthly sales reports in PDF format.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.18',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.1),
    },
    {
      action: 'UPDATE_SETTINGS',
      details: 'Updated global store configuration: changed support phone to +1 555 010 0000.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.18',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5),
    },
    {
      action: 'CREATE_COUPON',
      details: 'Created coupon "SUMMER10" giving 10% off orders above $50.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.22',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.1),
    },
    {
      action: 'CREATE_BANNER',
      details: 'Created and uploaded new promotional banner for the Accessories collection.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.22',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    },
    {
      action: 'UPDATE_ORDER_STATUS',
      details: 'Updated Order #ORD-980122 to status DELIVERED.',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.22',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    }
  ];

  for (const log of activityLogs) {
    await prisma.activityLog.create({ data: log });
  }

  // 3. Create some sample payment logs
  const paymentLogs = [
    {
      amount: 14500.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Pz92kL0sXyWq2j',
      gatewayOrderId: 'order_Pz92eH4uZsTk1m',
      gatewaySignature: 'sig_a83kf91823hd921u3hdj2',
      buyerName: 'Aarav Sharma',
      buyerEmail: 'aarav.sharma@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.9),
    },
    {
      amount: 8900.0,
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Py72kD8sJyGz8v',
      gatewayOrderId: 'order_Py72eB4uKsTm4q',
      errorMessage: 'Bad credentials or payment declined by user bank.',
      buyerName: 'Vikram Singh',
      buyerEmail: 'vikram.singh@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.4),
    },
    {
      amount: 8900.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Py74kH0sWyMz9w',
      gatewayOrderId: 'order_Py72eB4uKsTm4q',
      gatewaySignature: 'sig_bc918dfa837e819b18a28',
      buyerName: 'Vikram Singh',
      buyerEmail: 'vikram.singh@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.38),
    },
    {
      amount: 24500.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'COD',
      buyerName: 'Meera Nair',
      buyerEmail: 'meera.nair@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.8),
    },
    {
      amount: 12000.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Px89kL9sUyFq3z',
      gatewayOrderId: 'order_Px89eH4uQsTk2w',
      gatewaySignature: 'sig_f0293hda90f1283hda901',
      buyerName: 'Rohan Mehta',
      buyerEmail: 'rohan.mehta@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.1),
    },
    {
      amount: 3200.0,
      currency: 'INR',
      status: 'FAILED',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Pw67kH8sJyUz7v',
      gatewayOrderId: 'order_Pw67eB4uKsTm8q',
      errorMessage: 'Insufficient funds in customer account.',
      buyerName: 'Ananya Roy',
      buyerEmail: 'ananya.roy@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.2),
    },
    {
      amount: 19500.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Pv56kM1sPyLw1y',
      gatewayOrderId: 'order_Pv56eH3uRsTk4q',
      gatewaySignature: 'sig_d9283f9821a83e71d9823',
      buyerName: 'Kabir Verma',
      buyerEmail: 'kabir.verma@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.8),
    },
    {
      amount: 7200.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'COD',
      buyerName: 'Priyanka Sen',
      buyerEmail: 'priyanka.sen@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.9), // 21 hours ago
    },
    {
      amount: 28000.0,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      gatewayPaymentId: 'pay_Pu34kN2sLyKw6z',
      gatewayOrderId: 'order_Pu34eH2uQsTk8w',
      gatewaySignature: 'sig_b8319f0a283e7123bf018',
      buyerName: 'Aditya Birla',
      buyerEmail: 'customer9@example.com',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    }
  ];

  for (const log of paymentLogs) {
    await prisma.paymentLog.create({ data: log });
  }

  console.log('Successfully seeded database with logs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
