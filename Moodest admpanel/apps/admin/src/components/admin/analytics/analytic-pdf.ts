import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define AutoTable options interface
interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  theme?: 'striped' | 'grid' | 'plain';
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    valign?: 'top' | 'middle' | 'bottom';
    halign?: 'left' | 'center' | 'right';
    fillColor?: number[] | string;
    textColor?: number[] | string;
  };
  headStyles?: {
    fillColor?: number[] | string;
    textColor?: number[] | string;
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
  };
  columnStyles?: Record<number, {
    cellWidth?: number;
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
  }>;
  didParseCell?: (data: {
    cell: {
      text: string[];
      styles: {
        fillColor?: number[] | string;
        textColor?: number[] | string;
        fontSize?: number;
      };
    };
    column: { index: number };
    row: { index: number };
  }) => void;
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface TopSellingProduct {
  id: string;
  name: string;
  brand ?: string | null | undefined;
  category?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  currentStock: number;
}

interface ProductInventory {
  id: string;
  name: string;
  brand?: string | null | undefined;
  currentStock: number;
  price: number;
}

interface OrderSummary {
  id: string;
  userName: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  createdAt: Date;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: Date | string;
  totalSpent: number;
  totalOrders: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const exportOverviewPDF = (
  salesMetrics: SalesMetrics | null,
  lowStockProducts: ProductInventory[],
  dateRange: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Analytics Overview Report', 20, 20);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  let yPosition = 65;
  
  // Sales Metrics Section
  if (salesMetrics) {
    doc.setFontSize(16);
    doc.text('Sales Metrics', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.text(`Total Revenue: ${formatCurrency(salesMetrics.totalRevenue)}`, 25, yPosition);
    yPosition += 10;
    doc.text(`Total Orders: ${salesMetrics.totalOrders.toLocaleString()}`, 25, yPosition);
    yPosition += 10;
    doc.text(`Average Order Value: ${formatCurrency(salesMetrics.averageOrderValue)}`, 25, yPosition);
    yPosition += 20;
  }
  
  // Low Stock Products Section
  if (lowStockProducts.length > 0) {
    doc.setFontSize(16);
    doc.text('Low Stock Alert', 20, yPosition);
    yPosition += 10;
    
    const lowStockData = lowStockProducts.slice(0, 10).map(product => [
      product.name,
      product.brand || 'N/A',
      product.currentStock.toString(),
      formatCurrency(product.price)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Product Name', 'Brand', 'Stock', 'Price']],
      body: lowStockData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 193, 7] }, // Orange color for low stock alert
    });
  }
  
  // Save the PDF
  doc.save(`analytics-overview-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportProductsPDF = (
  topProducts: TopSellingProduct[],
  dateRange: string,
  lowStockThreshold: number
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Top Selling Products Report', 20, 20);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Products table
  const productsData = topProducts.map(product => [
    product.name,
    product.brand || 'N/A',
    product.category || "",
    product.totalQuantitySold.toLocaleString(),
    formatCurrency(product.totalRevenue),
    product.currentStock.toString(),
    product.currentStock <= lowStockThreshold ? 'Low Stock' : 'In Stock'
  ]);
  
  autoTable(doc, {
    startY: 60,
    head: [['Product Name', 'Brand', 'Category', 'Qty Sold', 'Revenue', 'Current Stock', 'Status']],
    body: productsData,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] }, // Blue color
    columnStyles: {
      0: { cellWidth: 35 }, // Product Name
      1: { cellWidth: 25 }, // Brand
      2: { cellWidth: 25 }, // Category
      3: { cellWidth: 20 }, // Qty Sold
      4: { cellWidth: 25 }, // Revenue
      5: { cellWidth: 20 }, // Current Stock
      6: { cellWidth: 20 }, // Status
    },
    didParseCell: function(data) {
      // Highlight low stock rows
      if (data.column.index === 6 && data.cell.text[0] === 'Low Stock') {
        data.cell.styles.fillColor = [254, 226, 226]; // Light red background
        data.cell.styles.textColor = [185, 28, 28]; // Red text
      }
    }
  });
  
  // Add summary at the bottom
  const finalY = (doc.lastAutoTable?.finalY || 150) + 20;
  doc.setFontSize(14);
  doc.text('Summary:', 20, finalY);
  doc.setFontSize(12);
  
  const totalQuantitySold = topProducts.reduce((sum, product) => sum + product.totalQuantitySold, 0);
  const totalRevenue = topProducts.reduce((sum, product) => sum + product.totalRevenue, 0);
  const lowStockCount = topProducts.filter(product => product.currentStock <= lowStockThreshold).length;
  
  doc.text(`Total Products Listed: ${topProducts.length}`, 25, finalY + 10);
  doc.text(`Total Quantity Sold: ${totalQuantitySold.toLocaleString()}`, 25, finalY + 20);
  doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 25, finalY + 30);
  doc.text(`Low Stock Items: ${lowStockCount}`, 25, finalY + 40);
  
  // Save the PDF
  doc.save(`top-products-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportOrdersPDF = (
  recentOrders: OrderSummary[],
  dateRange: string
) => {
  const doc = new jsPDF('landscape'); // Use landscape for wider table
  
  // Add title
  doc.setFontSize(20);
  doc.text('Recent Orders Report', 20, 20);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Orders table
  const ordersData = recentOrders.map(order => [
    order.id,
    order.userName,
    order.userEmail,
    formatCurrency(order.totalAmount),
    order.status,
    order.paymentMethod,
    order.razorpayPaymentId || 'N/A',
    formatDate(order.createdAt)
  ]);
  
  autoTable(doc, {
    startY: 60,
    head: [['Order ID', 'Customer Name', 'Email', 'Amount', 'Status', 'Payment Method', 'Payment ID', 'Date']],
    body: ordersData,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }, // Green color
    columnStyles: {
      0: { cellWidth: 25 }, // Order ID
      1: { cellWidth: 35 }, // Customer Name
      2: { cellWidth: 45 }, // Email
      3: { cellWidth: 25 }, // Amount
      4: { cellWidth: 25 }, // Status
      5: { cellWidth: 30 }, // Payment Method
      6: { cellWidth: 35 }, // Payment ID
      7: { cellWidth: 35 }, // Date
    },
    didParseCell: function(data) {
      // Color code status column
      if (data.column.index === 4) {
        const status = data.cell.text[0];
        switch (status) {
          case 'PAID':
            data.cell.styles.fillColor = [220, 252, 231]; // Light green
            data.cell.styles.textColor = [22, 163, 74]; // Green text
            break;
          case 'PENDING':
            data.cell.styles.fillColor = [254, 249, 195]; // Light yellow
            data.cell.styles.textColor = [180, 83, 9]; // Yellow text
            break;
          case 'FAILED':
          case 'CANCELLED':
            data.cell.styles.fillColor = [254, 226, 226]; // Light red
            data.cell.styles.textColor = [185, 28, 28]; // Red text
            break;
          case 'SHIPPED':
            data.cell.styles.fillColor = [219, 234, 254]; // Light blue
            data.cell.styles.textColor = [29, 78, 216]; // Blue text
            break;
          case 'DELIVERED':
            data.cell.styles.fillColor = [233, 213, 255]; // Light purple
            data.cell.styles.textColor = [107, 33, 168]; // Purple text
            break;
        }
      }
    }
  });
  
  // Add summary at the bottom
  const finalY = (doc.lastAutoTable?.finalY || 150) + 20;
  doc.setFontSize(14);
  doc.text('Summary:', 20, finalY);
  doc.setFontSize(12);
  
  const totalAmount = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const statusCounts = recentOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  doc.text(`Total Orders: ${recentOrders.length}`, 25, finalY + 10);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 25, finalY + 20);
  
  // Add status breakdown
  let yPos = finalY + 30;
  doc.text('Status Breakdown:', 25, yPos);
  Object.entries(statusCounts).forEach(([status, count]) => {
    yPos += 10;
    doc.text(`${status}: ${count}`, 35, yPos);
  });
  
  // Save the PDF
  doc.save(`recent-orders-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportCustomersPDF = (
  customers: CustomerSummary[],
  dateRange: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Customer Report', 20, 20);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Customers table
  const customersData = customers.map(customer => [
    customer.name,
    customer.email,
    customer.phone,
    formatDate(new Date(customer.joinedAt)),
    customer.totalOrders.toString(),
    formatCurrency(customer.totalSpent)
  ]);
  
  autoTable(doc, {
    startY: 60,
    head: [['Customer Name', 'Email', 'Phone', 'Joined At', 'Total Orders', 'Total Spent']],
    body: customersData,
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo color
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 }
    }
  });
  
  const finalY = (doc.lastAutoTable?.finalY || 150) + 20;
  doc.setFontSize(14);
  doc.text('Summary:', 20, finalY);
  doc.setFontSize(12);
  
  const totalSpentAll = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const totalOrdersAll = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
  
  doc.text(`Total Customers Listed: ${customers.length}`, 25, finalY + 10);
  doc.text(`Total Orders: ${totalOrdersAll.toLocaleString()}`, 25, finalY + 20);
  doc.text(`Total Spent: ${formatCurrency(totalSpentAll)}`, 25, finalY + 30);
  
  // Save the PDF
  doc.save(`customer-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
