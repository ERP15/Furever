import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

const { width } = Dimensions.get("window");

// ─── Simple Bar Chart Component ────────────────────────────────
const BarChart = ({ data, labels, title, color = "#FF8C42", height = 180 }) => {
    const maxVal = Math.max(...data, 1);
    return (
        <View style={chartStyles.container}>
            {title && <Text style={chartStyles.title}>{title}</Text>}
            <View style={[chartStyles.chartArea, { height }]}>
                {data.map((val, i) => (
                    <View key={i} style={chartStyles.barWrapper}>
                        <Text style={chartStyles.barValue}>
                            {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                        </Text>
                        <View
                            style={[
                                chartStyles.bar,
                                {
                                    height: `${(val / maxVal) * 100}%`,
                                    backgroundColor: color,
                                    minHeight: 4,
                                },
                            ]}
                        />
                        <Text style={chartStyles.barLabel} numberOfLines={1}>
                            {labels[i]}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// ─── Simple Pie / Donut-like Component ─────────────────────────
const PieList = ({ data, title }) => {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const colors = ["#FF8C42", "#20C997", "#007BFF", "#FF6B6B", "#E8A317", "#9B59B6", "#1ABC9C"];
    return (
        <View style={chartStyles.container}>
            {title && <Text style={chartStyles.title}>{title}</Text>}
            {data.map((item, i) => {
                const pct = ((item.value / total) * 100).toFixed(1);
                return (
                    <View key={i} style={pieStyles.row}>
                        <View style={[pieStyles.dot, { backgroundColor: colors[i % colors.length] }]} />
                        <Text style={pieStyles.label} numberOfLines={1}>{item.label}</Text>
                        <View style={pieStyles.barBg}>
                            <View
                                style={[
                                    pieStyles.barFill,
                                    {
                                        width: `${pct}%`,
                                        backgroundColor: colors[i % colors.length],
                                    },
                                ]}
                            />
                        </View>
                        <Text style={pieStyles.pct}>{pct}%</Text>
                    </View>
                );
            })}
        </View>
    );
};

// ─── Horizontal Bar Chart ──────────────────────────────────────
const HorizontalBarChart = ({ data, title, color = "#FF8C42" }) => {
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    return (
        <View style={chartStyles.container}>
            {title && <Text style={chartStyles.title}>{title}</Text>}
            {data.slice(0, 8).map((item, i) => (
                <View key={i} style={hBarStyles.row}>
                    <Text style={hBarStyles.label} numberOfLines={1}>
                        {item.label}
                    </Text>
                    <View style={hBarStyles.barBg}>
                        <View
                            style={[
                                hBarStyles.barFill,
                                {
                                    width: `${(item.value / maxVal) * 100}%`,
                                    backgroundColor: color,
                                },
                            ]}
                        />
                    </View>
                    <Text style={hBarStyles.value}>{item.value}</Text>
                </View>
            ))}
        </View>
    );
};

// ─── Main Component ────────────────────────────────────────────
const ReportsAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [activeRange, setActiveRange] = useState("monthly");
    const [activeTab, setActiveTab] = useState("overview");
    const [exporting, setExporting] = useState(false);

    // Data states
    const [dashSummary, setDashSummary] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [customerTrends, setCustomerTrends] = useState(null);
    const [categorySales, setCategorySales] = useState([]);
    const [productDistribution, setProductDistribution] = useState([]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, salesRes, revenueRes, bestRes, trendsRes, catRes, distRes] =
                await Promise.all([
                    axios.get(`${baseURL}analytics/dashboard-summary`),
                    axios.get(`${baseURL}analytics/sales?range=${activeRange}`),
                    axios.get(`${baseURL}analytics/revenue`),
                    axios.get(`${baseURL}analytics/best-sellers?limit=10`),
                    axios.get(`${baseURL}analytics/customer-trends`),
                    axios.get(`${baseURL}analytics/category-sales`),
                    axios.get(`${baseURL}analytics/product-distribution`),
                ]);
            setDashSummary(summaryRes.data);
            setSalesData(salesRes.data);
            setRevenueData(revenueRes.data);
            setBestSellers(bestRes.data);
            setCustomerTrends(trendsRes.data);
            setCategorySales(catRes.data);
            setProductDistribution(distRes.data);
        } catch (err) {
            console.error("Analytics fetch error:", err);
            Alert.alert("Error", "Failed to load analytics data.");
        }
        setLoading(false);
    }, [activeRange]);

    useFocusEffect(
        useCallback(() => {
            fetchAll();
            return () => {};
        }, [fetchAll])
    );

    // ─── Export helpers ────────────────────────────────────────
    const generateHTMLReport = () => {
        const summary = dashSummary || {};
        const today = summary.today || {};
        const week = summary.thisWeek || {};
        const month = summary.thisMonth || {};
        const allTime = summary.allTime || {};

        const bestSellerRows = bestSellers
            .map(
                (b, i) =>
                    `<tr>
                        <td>${i + 1}</td>
                        <td>${b.name || "Unknown"}</td>
                        <td>${b.totalQuantity || 0}</td>
                        <td>$${(b.totalRevenue || 0).toFixed(2)}</td>
                        <td>${b.orderCount || 0}</td>
                    </tr>`
            )
            .join("");

        const revenueRows = revenueData
            .map(
                (r) =>
                    `<tr>
                        <td>${r.month}</td>
                        <td>$${(r.revenue || 0).toFixed(2)}</td>
                        <td>${r.orders || 0}</td>
                    </tr>`
            )
            .join("");

        const categoryRows = categorySales
            .map(
                (c) =>
                    `<tr>
                        <td>${c.name || "Uncategorized"}</td>
                        <td>$${(c.totalRevenue || 0).toFixed(2)}</td>
                        <td>${c.totalQuantity || 0}</td>
                    </tr>`
            )
            .join("");

        const topCustomerRows = (customerTrends?.topCustomers || [])
            .map(
                (c, i) =>
                    `<tr>
                        <td>${i + 1}</td>
                        <td>${c.name}</td>
                        <td>${c.email}</td>
                        <td>$${(c.totalSpent || 0).toFixed(2)}</td>
                        <td>${c.orderCount || 0}</td>
                    </tr>`
            )
            .join("");

        return `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h1 { color: #FF8C42; border-bottom: 3px solid #FF8C42; padding-bottom: 10px; }
                h2 { color: #555; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { padding: 10px 12px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #FF8C42; color: white; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .summary-grid { display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0; }
                .summary-card { flex: 1; min-width: 200px; background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #FF8C42; }
                .summary-card h3 { margin: 0 0 5px 0; color: #888; font-size: 13px; }
                .summary-card p { margin: 0; font-size: 24px; font-weight: bold; color: #333; }
                .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
        </head>
        <body>
            <h1>🐾 FurEver Pet Shop — Reports & Analytics</h1>
            <p>Generated on: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

            <h2>📊 Sales Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Today</h3>
                    <p>$${(today.revenue || 0).toFixed(2)}</p>
                    <small>${today.count || 0} orders</small>
                </div>
                <div class="summary-card">
                    <h3>This Week</h3>
                    <p>$${(week.revenue || 0).toFixed(2)}</p>
                    <small>${week.count || 0} orders</small>
                </div>
                <div class="summary-card">
                    <h3>This Month</h3>
                    <p>$${(month.revenue || 0).toFixed(2)}</p>
                    <small>${month.count || 0} orders</small>
                </div>
                <div class="summary-card">
                    <h3>All Time</h3>
                    <p>$${(allTime.revenue || 0).toFixed(2)}</p>
                    <small>${allTime.count || 0} orders</small>
                </div>
            </div>

            <h2>📈 Monthly Revenue (${new Date().getFullYear()})</h2>
            <table>
                <tr><th>Month</th><th>Revenue</th><th>Orders</th></tr>
                ${revenueRows}
            </table>

            <h2>🏆 Best-Selling Products</h2>
            <table>
                <tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Orders</th></tr>
                ${bestSellerRows}
            </table>

            <h2>📦 Sales by Category</h2>
            <table>
                <tr><th>Category</th><th>Revenue</th><th>Qty Sold</th></tr>
                ${categoryRows}
            </table>

            <h2>👥 Top Customers</h2>
            <table>
                <tr><th>#</th><th>Customer</th><th>Email</th><th>Total Spent</th><th>Orders</th></tr>
                ${topCustomerRows}
            </table>

            <div class="footer">
                <p>FurEver Pet Shop &copy; ${new Date().getFullYear()} — Confidential Report</p>
            </div>
        </body>
        </html>`;
    };

    const exportPDF = async () => {
        setExporting(true);
        try {
            const html = generateHTMLReport();
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Export Analytics Report (PDF)",
                    UTI: "com.adobe.pdf",
                });
            } else {
                Alert.alert("PDF Saved", `Report saved to:\n${uri}`);
            }
        } catch (err) {
            console.error("PDF export error:", err);
            Alert.alert("Error", "Failed to export PDF.");
        }
        setExporting(false);
    };

    const exportExcel = async () => {
        setExporting(true);
        try {
            // Build a CSV that Excel can open
            let csv = "FurEver Pet Shop — Analytics Report\n";
            csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;

            // Sales summary
            const s = dashSummary || {};
            csv += "SALES SUMMARY\n";
            csv += "Period,Revenue,Orders\n";
            csv += `Today,$${(s.today?.revenue || 0).toFixed(2)},${s.today?.count || 0}\n`;
            csv += `This Week,$${(s.thisWeek?.revenue || 0).toFixed(2)},${s.thisWeek?.count || 0}\n`;
            csv += `This Month,$${(s.thisMonth?.revenue || 0).toFixed(2)},${s.thisMonth?.count || 0}\n`;
            csv += `All Time,$${(s.allTime?.revenue || 0).toFixed(2)},${s.allTime?.count || 0}\n\n`;

            // Monthly revenue
            csv += "MONTHLY REVENUE\n";
            csv += "Month,Revenue,Orders\n";
            revenueData.forEach((r) => {
                csv += `${r.month},$${(r.revenue || 0).toFixed(2)},${r.orders || 0}\n`;
            });
            csv += "\n";

            // Best sellers
            csv += "BEST-SELLING PRODUCTS\n";
            csv += "Rank,Product,Qty Sold,Revenue,Orders\n";
            bestSellers.forEach((b, i) => {
                csv += `${i + 1},"${b.name || "Unknown"}",${b.totalQuantity || 0},$${(b.totalRevenue || 0).toFixed(2)},${b.orderCount || 0}\n`;
            });
            csv += "\n";

            // Category sales
            csv += "SALES BY CATEGORY\n";
            csv += "Category,Revenue,Qty Sold\n";
            categorySales.forEach((c) => {
                csv += `"${c.name || "Uncategorized"}",$${(c.totalRevenue || 0).toFixed(2)},${c.totalQuantity || 0}\n`;
            });
            csv += "\n";

            // Top customers
            csv += "TOP CUSTOMERS\n";
            csv += "Rank,Name,Email,Total Spent,Orders\n";
            (customerTrends?.topCustomers || []).forEach((c, i) => {
                csv += `${i + 1},"${c.name}","${c.email}",$${(c.totalSpent || 0).toFixed(2)},${c.orderCount || 0}\n`;
            });

            const fileUri = FileSystem.documentDirectory + "FurEver_Analytics_Report.csv";
            await FileSystem.writeAsStringAsync(fileUri, csv, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: "text/csv",
                    dialogTitle: "Export Analytics Report (Excel/CSV)",
                });
            } else {
                Alert.alert("File Saved", `Report saved to:\n${fileUri}`);
            }
        } catch (err) {
            console.error("Excel export error:", err);
            Alert.alert("Error", "Failed to export Excel file.");
        }
        setExporting(false);
    };

    // ─── Render ────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF8C42" />
                <Text style={{ color: "#888", marginTop: 12 }}>Loading analytics...</Text>
            </View>
        );
    }

    const summary = dashSummary || {};
    const tabs = [
        { key: "overview", label: "Overview", icon: "bar-chart" },
        { key: "products", label: "Products", icon: "cube" },
        { key: "customers", label: "Customers", icon: "people" },
    ];

    const ranges = [
        { key: "daily", label: "Today" },
        { key: "weekly", label: "Week" },
        { key: "monthly", label: "Month" },
        { key: "yearly", label: "Year" },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Reports & Analytics</Text>
                    <Text style={styles.headerSubtitle}>
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.exportBtn, { backgroundColor: "#FF6B6B" }]}
                        onPress={exportPDF}
                        disabled={exporting}
                    >
                        <Ionicons name="document-text" size={16} color="white" />
                        <Text style={styles.exportBtnText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.exportBtn, { backgroundColor: "#20C997" }]}
                        onPress={exportExcel}
                        disabled={exporting}
                    >
                        <Ionicons name="grid" size={16} color="white" />
                        <Text style={styles.exportBtnText}>Excel</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon}
                            size={16}
                            color={activeTab === tab.key ? "#FF8C42" : "#888"}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.key && styles.tabTextActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ─── OVERVIEW TAB ─────────────────────────────── */}
            {activeTab === "overview" && (
                <View>
                    {/* Range filter */}
                    <View style={styles.rangeRow}>
                        {ranges.map((r) => (
                            <TouchableOpacity
                                key={r.key}
                                style={[
                                    styles.rangeBtn,
                                    activeRange === r.key && styles.rangeBtnActive,
                                ]}
                                onPress={() => setActiveRange(r.key)}
                            >
                                <Text
                                    style={[
                                        styles.rangeText,
                                        activeRange === r.key && styles.rangeTextActive,
                                    ]}
                                >
                                    {r.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Summary Cards */}
                    <View style={styles.summaryGrid}>
                        <View style={[styles.summaryCard, { borderLeftColor: "#FF8C42" }]}>
                            <Ionicons name="cash" size={22} color="#FF8C42" />
                            <Text style={styles.summaryLabel}>Today</Text>
                            <Text style={styles.summaryValue}>
                                ${(summary.today?.revenue || 0).toFixed(2)}
                            </Text>
                            <Text style={styles.summaryCount}>
                                {summary.today?.count || 0} orders
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: "#20C997" }]}>
                            <Ionicons name="trending-up" size={22} color="#20C997" />
                            <Text style={styles.summaryLabel}>This Week</Text>
                            <Text style={styles.summaryValue}>
                                ${(summary.thisWeek?.revenue || 0).toFixed(2)}
                            </Text>
                            <Text style={styles.summaryCount}>
                                {summary.thisWeek?.count || 0} orders
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: "#007BFF" }]}>
                            <Ionicons name="calendar" size={22} color="#007BFF" />
                            <Text style={styles.summaryLabel}>This Month</Text>
                            <Text style={styles.summaryValue}>
                                ${(summary.thisMonth?.revenue || 0).toFixed(2)}
                            </Text>
                            <Text style={styles.summaryCount}>
                                {summary.thisMonth?.count || 0} orders
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: "#9B59B6" }]}>
                            <Ionicons name="stats-chart" size={22} color="#9B59B6" />
                            <Text style={styles.summaryLabel}>All Time</Text>
                            <Text style={styles.summaryValue}>
                                ${(summary.allTime?.revenue || 0).toFixed(2)}
                            </Text>
                            <Text style={styles.summaryCount}>
                                {summary.allTime?.count || 0} orders
                            </Text>
                        </View>
                    </View>

                    {/* Revenue Chart */}
                    <View style={styles.chartCard}>
                        <BarChart
                            data={revenueData.map((r) => r.revenue)}
                            labels={revenueData.map((r) => r.month)}
                            title="Monthly Revenue"
                            color="#FF8C42"
                            height={160}
                        />
                    </View>

                    {/* Sales by Date */}
                    {salesData?.salesByDate?.length > 0 && (
                        <View style={styles.chartCard}>
                            <BarChart
                                data={salesData.salesByDate.slice(-14).map((d) => d.totalRevenue)}
                                labels={salesData.salesByDate
                                    .slice(-14)
                                    .map((d) => d._id.slice(5))}
                                title={`Sales Trend (${activeRange})`}
                                color="#20C997"
                                height={140}
                            />
                        </View>
                    )}

                    {/* Order Status Distribution */}
                    {customerTrends?.statusDistribution?.length > 0 && (
                        <View style={styles.chartCard}>
                            <PieList
                                title="Order Status Distribution"
                                data={customerTrends.statusDistribution.map((s) => ({
                                    label: s._id || "Unknown",
                                    value: s.count,
                                }))}
                            />
                        </View>
                    )}

                    {/* Payment Methods */}
                    {customerTrends?.paymentMethods?.length > 0 && (
                        <View style={styles.chartCard}>
                            <PieList
                                title="Payment Methods"
                                data={customerTrends.paymentMethods.map((p) => ({
                                    label: p._id || "Unknown",
                                    value: p.count,
                                }))}
                            />
                        </View>
                    )}
                </View>
            )}

            {/* ─── PRODUCTS TAB ─────────────────────────────── */}
            {activeTab === "products" && (
                <View>
                    {/* Best Sellers */}
                    <View style={styles.chartCard}>
                        <Text style={chartStyles.title}>🏆 Best-Selling Products</Text>
                        {bestSellers.map((item, i) => (
                            <View key={i} style={styles.bestSellerRow}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankText}>{i + 1}</Text>
                                </View>
                                <View style={styles.bestSellerInfo}>
                                    <Text style={styles.bestSellerName} numberOfLines={1}>
                                        {item.name || "Unknown"}
                                    </Text>
                                    <Text style={styles.bestSellerMeta}>
                                        {item.totalQuantity} sold • ${(item.totalRevenue || 0).toFixed(2)} revenue
                                    </Text>
                                </View>
                                <View style={styles.bestSellerRight}>
                                    <Text style={styles.bestSellerOrders}>
                                        {item.orderCount} orders
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {bestSellers.length === 0 && (
                            <Text style={styles.emptyText}>No sales data yet</Text>
                        )}
                    </View>

                    {/* Best Sellers Bar */}
                    {bestSellers.length > 0 && (
                        <View style={styles.chartCard}>
                            <HorizontalBarChart
                                title="Top Products by Quantity Sold"
                                data={bestSellers.slice(0, 8).map((b) => ({
                                    label: (b.name || "Unknown").substring(0, 18),
                                    value: b.totalQuantity || 0,
                                }))}
                                color="#FF8C42"
                            />
                        </View>
                    )}

                    {/* Category Sales (from orders) */}
                    {categorySales.length > 0 && (
                        <View style={styles.chartCard}>
                            <HorizontalBarChart
                                title="Sales by Category (from orders)"
                                data={categorySales.map((c) => ({
                                    label: (c.name || "Uncategorized").substring(0, 18),
                                    value: c.totalQuantity || 0,
                                }))}
                                color="#007BFF"
                            />
                        </View>
                    )}

                    {/* Product Distribution by Category (actual products) */}
                    {productDistribution.length > 0 && (
                        <View style={styles.chartCard}>
                            <HorizontalBarChart
                                title="Products by Category"
                                data={productDistribution.map((c) => ({
                                    label: (c.name || "Uncategorized").substring(0, 18),
                                    value: c.productCount || 0,
                                }))}
                                color="#20C997"
                            />
                        </View>
                    )}

                    {/* Category Revenue (from orders) */}
                    {categorySales.length > 0 && (
                        <View style={styles.chartCard}>
                            <PieList
                                title="Revenue by Category"
                                data={categorySales.map((c) => ({
                                    label: c.name || "Uncategorized",
                                    value: c.totalRevenue || 0,
                                }))}
                            />
                        </View>
                    )}

                    {/* Stock by Category (actual inventory) */}
                    {productDistribution.length > 0 && (
                        <View style={styles.chartCard}>
                            <PieList
                                title="Stock Distribution by Category"
                                data={productDistribution.map((c) => ({
                                    label: c.name || "Uncategorized",
                                    value: c.totalStock || 0,
                                }))}
                            />
                        </View>
                    )}

                    {/* Inventory Alert */}
                    <View style={styles.chartCard}>
                        <View style={styles.alertCard}>
                            <Ionicons name="warning" size={28} color="#FF6B6B" />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.alertTitle}>Inventory Alert</Text>
                                <Text style={styles.alertText}>
                                    {summary.lowStock || 0} products with low stock (≤5 units)
                                </Text>
                                <Text style={styles.alertText}>
                                    {summary.totalProducts || 0} total products in catalog
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* ─── CUSTOMERS TAB ────────────────────────────── */}
            {activeTab === "customers" && (
                <View>
                    {/* Top Customers */}
                    <View style={styles.chartCard}>
                        <Text style={chartStyles.title}>👥 Top Customers by Spending</Text>
                        {(customerTrends?.topCustomers || []).map((c, i) => (
                            <View key={i} style={styles.customerRow}>
                                <View style={[styles.rankBadge, { backgroundColor: "#007BFF15" }]}>
                                    <Text style={[styles.rankText, { color: "#007BFF" }]}>
                                        {i + 1}
                                    </Text>
                                </View>
                                <View style={styles.customerInfo}>
                                    <Text style={styles.customerName}>{c.name}</Text>
                                    <Text style={styles.customerEmail}>{c.email}</Text>
                                </View>
                                <View style={styles.customerRight}>
                                    <Text style={styles.customerSpent}>
                                        ${(c.totalSpent || 0).toFixed(2)}
                                    </Text>
                                    <Text style={styles.customerOrders}>
                                        {c.orderCount} orders
                                    </Text>
                                </View>
                            </View>
                        ))}
                        {(!customerTrends?.topCustomers ||
                            customerTrends.topCustomers.length === 0) && (
                            <Text style={styles.emptyText}>No customer data yet</Text>
                        )}
                    </View>

                    {/* Customer Spending Chart */}
                    {customerTrends?.topCustomers?.length > 0 && (
                        <View style={styles.chartCard}>
                            <HorizontalBarChart
                                title="Customer Spending Comparison"
                                data={customerTrends.topCustomers.slice(0, 8).map((c) => ({
                                    label: (c.name || "Unknown").substring(0, 15),
                                    value: Math.round(c.totalSpent || 0),
                                }))}
                                color="#9B59B6"
                            />
                        </View>
                    )}

                    {/* Average Order Value */}
                    {customerTrends?.topCustomers?.length > 0 && (
                        <View style={styles.chartCard}>
                            <Text style={chartStyles.title}>
                                💰 Average Order Value by Customer
                            </Text>
                            {customerTrends.topCustomers.slice(0, 5).map((c, i) => (
                                <View key={i} style={styles.avgRow}>
                                    <Text style={styles.avgName} numberOfLines={1}>
                                        {c.name}
                                    </Text>
                                    <Text style={styles.avgValue}>
                                        ${(c.avgOrderValue || 0).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Export banner */}
            {exporting && (
                <View style={styles.exportingBanner}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.exportingText}>Generating report...</Text>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    headerTitle: { fontSize: 22, fontWeight: "700", color: "#333" },
    headerSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
    headerActions: { flexDirection: "row", gap: 8 },
    exportBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    exportBtnText: { color: "white", fontSize: 12, fontWeight: "600" },

    // Tabs
    tabRow: {
        flexDirection: "row",
        backgroundColor: "white",
        paddingHorizontal: 8,
        paddingBottom: 0,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: "#FF8C42" },
    tabText: { fontSize: 13, color: "#888", fontWeight: "500" },
    tabTextActive: { color: "#FF8C42", fontWeight: "700" },

    // Range
    rangeRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    rangeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 8,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    rangeBtnActive: { backgroundColor: "#FF8C42", borderColor: "#FF8C42" },
    rangeText: { fontSize: 12, fontWeight: "600", color: "#888" },
    rangeTextActive: { color: "white" },

    // Summary
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        gap: 10,
    },
    summaryCard: {
        width: (width - 34) / 2,
        backgroundColor: "white",
        padding: 14,
        borderRadius: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    summaryLabel: { fontSize: 12, color: "#888", marginTop: 6 },
    summaryValue: { fontSize: 20, fontWeight: "700", color: "#333", marginTop: 2 },
    summaryCount: { fontSize: 11, color: "#aaa", marginTop: 2 },

    // Chart card
    chartCard: {
        backgroundColor: "white",
        marginHorizontal: 12,
        marginTop: 14,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },

    // Best sellers
    bestSellerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    rankBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#FF8C4215",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    rankText: { fontSize: 13, fontWeight: "700", color: "#FF8C42" },
    bestSellerInfo: { flex: 1 },
    bestSellerName: { fontSize: 14, fontWeight: "600", color: "#333" },
    bestSellerMeta: { fontSize: 11, color: "#888", marginTop: 2 },
    bestSellerRight: { alignItems: "flex-end" },
    bestSellerOrders: { fontSize: 12, color: "#007BFF", fontWeight: "600" },

    // Customers
    customerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    customerInfo: { flex: 1 },
    customerName: { fontSize: 14, fontWeight: "600", color: "#333" },
    customerEmail: { fontSize: 11, color: "#888", marginTop: 2 },
    customerRight: { alignItems: "flex-end" },
    customerSpent: { fontSize: 14, fontWeight: "700", color: "#FF8C42" },
    customerOrders: { fontSize: 11, color: "#888", marginTop: 2 },

    // Average row
    avgRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    avgName: { fontSize: 14, color: "#333", flex: 1 },
    avgValue: { fontSize: 14, fontWeight: "700", color: "#20C997" },

    // Alert
    alertCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: "#FFF5F5",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#FFE0E0",
    },
    alertTitle: { fontSize: 15, fontWeight: "700", color: "#FF6B6B" },
    alertText: { fontSize: 12, color: "#888", marginTop: 2 },

    emptyText: { textAlign: "center", color: "#aaa", paddingVertical: 20, fontSize: 14 },

    // Export banner
    exportingBanner: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FF8C42",
        marginHorizontal: 12,
        marginTop: 14,
        padding: 12,
        borderRadius: 10,
        gap: 8,
    },
    exportingText: { color: "white", fontWeight: "600" },
});

// ─── Chart Styles ──────────────────────────────────────────────
const chartStyles = StyleSheet.create({
    container: { marginBottom: 4 },
    title: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 14 },
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingTop: 20,
    },
    barWrapper: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        height: "100%",
    },
    bar: { width: "60%", borderRadius: 4, minWidth: 8 },
    barValue: { fontSize: 9, color: "#888", marginBottom: 4 },
    barLabel: { fontSize: 9, color: "#aaa", marginTop: 6 },
});

const pieStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    label: { fontSize: 13, color: "#555", width: 90 },
    barBg: {
        flex: 1,
        height: 8,
        backgroundColor: "#f0f0f0",
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 4 },
    pct: { fontSize: 12, color: "#888", width: 45, textAlign: "right" },
});

const hBarStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    label: { fontSize: 12, color: "#555", width: 100 },
    barBg: {
        flex: 1,
        height: 12,
        backgroundColor: "#f0f0f0",
        borderRadius: 6,
        marginHorizontal: 8,
        overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 6 },
    value: { fontSize: 12, fontWeight: "600", color: "#333", width: 40, textAlign: "right" },
});

export default ReportsAnalytics;
