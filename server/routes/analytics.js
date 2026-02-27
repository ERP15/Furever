const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// ─── Helper: date ranges ───────────────────────────────────────
const getStartDate = (range) => {
  const now = new Date();
  switch (range) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'yearly':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0); // all time
  }
};

// ─── GET /api/v1/analytics/sales?range=daily|weekly|monthly|yearly|all ───
router.get('/sales', async (req, res) => {
  try {
    const range = req.query.range || 'all';
    const startDate = getStartDate(range);

    const match = { dateOrdered: { $gte: startDate }, status: { $ne: 'Canceled' } };

    // Aggregate sales data grouped by date
    const salesByDate = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$dateOrdered' },
          },
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Summary totals
    const summary = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    return res.status(200).json({
      range,
      summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
      salesByDate,
    });
  } catch (err) {
    console.error('Sales analytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch sales analytics.' });
  }
});

// ─── GET /api/v1/analytics/revenue ──────────────────────────────
// Revenue broken down by month for the current year
router.get('/revenue', async (req, res) => {
  try {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const monthlyRevenue = await Order.aggregate([
      { $match: { dateOrdered: { $gte: yearStart }, status: { $ne: 'Canceled' } } },
      {
        $group: {
          _id: { $month: '$dateOrdered' },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill all 12 months
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const data = months.map((label, i) => {
      const found = monthlyRevenue.find((m) => m._id === i + 1);
      return { month: label, revenue: found ? found.revenue : 0, orders: found ? found.orders : 0 };
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Revenue analytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch revenue analytics.' });
  }
});

// ─── GET /api/v1/analytics/best-sellers ─────────────────────────
router.get('/best-sellers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const bestSellers = await Order.aggregate([
      { $match: { status: { $ne: 'Canceled' } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          image: { $first: '$orderItems.image' },
          totalQuantity: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          orderCount: { $sum: 1 },
        },
      },
      // Lookup actual product info to get current accurate names
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      // Filter out items without a matching product (deleted/invalid)
      { $match: { productInfo: { $ne: null } } },
      {
        $project: {
          name: { $ifNull: ['$productInfo.name', '$name'] },
          image: { $ifNull: ['$productInfo.image', '$image'] },
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);

    return res.status(200).json(bestSellers);
  } catch (err) {
    console.error('Best sellers error:', err);
    return res.status(500).json({ message: 'Failed to fetch best sellers.' });
  }
});

// ─── GET /api/v1/analytics/customer-trends ──────────────────────
router.get('/customer-trends', async (req, res) => {
  try {
    // Top customers by spending
    const topCustomers = await Order.aggregate([
      { $match: { status: { $ne: 'Canceled' }, user: { $ne: null } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      // Filter out users that don't exist in the database (removes "Unknown" entries)
      { $match: { userInfo: { $ne: null } } },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: 1,
        },
      },
    ]);

    // Orders by status distribution
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Orders by payment method
    const paymentMethods = await Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$paymentMethod', 'Unknown'] },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({ topCustomers, statusDistribution, paymentMethods });
  } catch (err) {
    console.error('Customer trends error:', err);
    return res.status(500).json({ message: 'Failed to fetch customer trends.' });
  }
});

// ─── GET /api/v1/analytics/category-sales ───────────────────────
router.get('/category-sales', async (req, res) => {
  try {
    const categorySales = await Order.aggregate([
      { $match: { status: { $ne: 'Canceled' } } },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryInfo._id',
          name: { $first: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] } },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          totalQuantity: { $sum: '$orderItems.quantity' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    return res.status(200).json(categorySales);
  } catch (err) {
    console.error('Category sales error:', err);
    return res.status(500).json({ message: 'Failed to fetch category sales.' });
  }
});

// ─── GET /api/v1/analytics/product-distribution ─────────────────
// Shows actual products grouped by their category (no orders needed)
router.get('/product-distribution', async (req, res) => {
  try {
    const distribution = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryInfo._id',
          name: { $first: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] } },
          productCount: { $sum: 1 },
          totalStock: { $sum: '$countInStock' },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { productCount: -1 } },
    ]);

    return res.status(200).json(distribution);
  } catch (err) {
    console.error('Product distribution error:', err);
    return res.status(500).json({ message: 'Failed to fetch product distribution.' });
  }
});

// ─── GET /api/v1/analytics/dashboard-summary ────────────────────
// Quick summary for the analytics dashboard
router.get('/dashboard-summary', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaySales, weekSales, monthSales, allTimeSales, totalProducts, lowStock] =
      await Promise.all([
        Order.aggregate([
          { $match: { dateOrdered: { $gte: todayStart }, status: { $ne: 'Canceled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { dateOrdered: { $gte: thisWeekStart }, status: { $ne: 'Canceled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { dateOrdered: { $gte: thisMonthStart }, status: { $ne: 'Canceled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: 'Canceled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
        ]),
        Product.countDocuments(),
        Product.countDocuments({ countInStock: { $lte: 5, $gt: 0 } }),
      ]);

    return res.status(200).json({
      today: todaySales[0] || { revenue: 0, count: 0 },
      thisWeek: weekSales[0] || { revenue: 0, count: 0 },
      thisMonth: monthSales[0] || { revenue: 0, count: 0 },
      allTime: allTimeSales[0] || { revenue: 0, count: 0 },
      totalProducts,
      lowStock,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard summary.' });
  }
});

module.exports = router;
