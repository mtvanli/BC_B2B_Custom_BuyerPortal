import { useState, useEffect } from 'react';
import { Box, Grid, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useB3Lang } from '@b3/lang';
import { PageProps } from '@/pages/PageProps';
import B3Spin from '@/components/spin/B3Spin';
import { B3PaginationTable } from '@/components/table/B3PaginationTable';
import {
    getB2BAllOrders, getBCAllOrders,

} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';

import { useSort } from '@/hooks';
import { currencyFormat, distanceDay } from '@/utils';
import B3FilterPicker from '@/components/filter/B3FilterPicker';
import getOrderStatus from '@/pages/order/shared/getOrderStatus';

import { useMediaQuery, useTheme } from '@mui/material';
import { getB2BOrderDetails, getBCOrderDetails } from '@/shared/service/b2b';
import convertB2BOrderDetails from '@/pages/OrderDetail/shared/B2BOrderData';

import TotalSpendingCard from './components/TotalSpendingCard';
import SpendingPerOrderCard from './components/SpendingPerOrderCard';
import OrderStatusCard from './components/OrderStatusCard';
import MonthlyOrdersChart from './components/MonthlyOrdersChart';
import PopularProductsCard from './components/PopularProductsCard';
import EmployeeMetricsCard from './components/EmployeeMetricsCard';
//import InvoiceMetricsChart from './components/InvoiceMetricsCard';



function TestPage(_props: PageProps) {
    const b3Lang = useB3Lang();
    const [_isLoading, setIsLoading] = useState(true);
    const [isLoadingPurchased, setIsLoadingPurchased] = useState(false);
    const [orderCount, setOrderCount] = useState(0);
    //const [purchasedItems, setPurchasedItems] = useState([]);

    const [totalValue, setTotalValue] = useState(0);
    const [orderData, setOrderData] = useState([]);

    // an interface for the chart data structure
    interface ChartDataType {
        months: string[];
        values: number[];
        averageOrderValue: number;
        employeeData?: {
            [month: string]: {
                [employee: string]: number;
            };
        };
    }


    const [chartData, setChartData] = useState<ChartDataType>({
        months: [],
        values: [],
        averageOrderValue: 0
    });

    // StatusChartItem interface 
    interface StatusChartItem {
        id: string;
        value: number;
        label: string;
        color: string;
    }

    // initialization
    const [statusData, setStatusData] = useState<StatusChartItem[]>([]);


    interface EmployeeData {
        name: string;
        totalSpending: number;
        orderCount: number;
    }


    const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);

    const [filterData, setFilterData] = useState({
        limit: 30,
        offset: 0,
        orderBy: 'createdAt',
        isDesc: true,
        q: '',
        statusCode: '',
        beginDateAt: distanceDay(90),
        endDateAt: distanceDay(0),
        createdBy: '',
        companyName: ''
    });

    const sortKeys = {
        createdAt: 'createdAt',
        orderId: 'orderId',
        totalIncTax: 'totalIncTax',
        status: 'status',
        placedBy: 'placedBy'
    };
    const defaultSortKey = 'createdAt';
    const [handleSetOrderBy, order, orderBy] = useSort(
        sortKeys,
        defaultSortKey,
        filterData,
        setFilterData,
    );

    const isB2BUser = useAppSelector(isB2BUserSelector);
    const companyB2BId = useAppSelector(({ company }) => company.companyInfo.id);

    // new state for popular products data
    const [popularProductsData, setPopularProductsData] = useState<Array<any>>([]);

    const [isLoadingAll, setIsLoadingAll] = useState(true);


    // state variable for total paid amount
    const [_totalPaid, setTotalPaid] = useState(0);
    const [_unpaidAmount, setUnpaidAmount] = useState(0);
    const [_overdueAmount, setOverdueAmount] = useState(0);

    // 2. Function to process purchased items data into popular products
    /* const processPopularProducts = (purchasedItems) => {
        try {
            console.log('Processing purchased items to find popular products...');

            // First, aggregate by variant ID to combine identical products
            const aggregatedByVariant = {};

            purchasedItems.forEach(item => {
                const node = item.node || item;
                const variantId = node.variantId;

                if (!variantId) {
                    console.log('Warning: Item missing variantId', node);
                    return;
                }

                const key = `${variantId}`;

                if (!aggregatedByVariant[key]) {
                    aggregatedByVariant[key] = {
                        ...node,
                        totalQty: 0,
                        orderCount: 0
                    };
                }

                // Use the quantity from the node, or default to 1
                // This is where orders actually have a quantity value greater than 1
                const quantity = parseInt(node.quantity) || 1;
                aggregatedByVariant[key].totalQty += quantity;
                aggregatedByVariant[key].orderCount += 1;
            });

            // Then group by product name
            const productCounts = {};

            Object.values(aggregatedByVariant).forEach(variant => {
                const productName = variant.productName || 'Unknown Product';

                if (!productCounts[productName]) {
                    productCounts[productName] = {
                        name: productName,
                        count: 0,
                        orderCount: 0,
                        sku: variant.variantSku || '',
                        variants: []
                    };
                }

                // Add quantities
                productCounts[productName].count += variant.totalQty;
                productCounts[productName].orderCount += variant.orderCount;
                productCounts[productName].variants.push(variant.variantId);
            });

            // Convert to array and sort by quantity (descending)
            const sortedProducts = Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Get top 10

            console.log('Popular products processed:', sortedProducts);
            setPopularProductsData(sortedProducts);

        } catch (error) {
            console.error('Error processing popular products:', error);
        }
    };
 */


    // Update the fetchPopularProductsFromOrders function to preserve more details
    const fetchPopularProductsFromOrders = async (forDownload = false) => {
        try {
            setIsLoadingPurchased(true);

            // Get list of orders in date range
            const ordersParams = {
                beginDateAt: filterData.beginDateAt,
                endDateAt: filterData.endDateAt,
                first: 50,
                offset: 0,
                orderBy: 'createdAt',
                isDesc: true,
            };

            if (isB2BUser && companyB2BId) {
                (ordersParams as any).companyIds = [Number(companyB2BId)];
            }

            const ordersResult = isB2BUser
                ? await getB2BAllOrders(ordersParams)
                : await getBCAllOrders(ordersParams);

            const { edges = [] } = ordersResult;

            // Extract order IDs
            const orderIds = edges
                .map((edge: any) => edge.node?.orderId)
                .filter(Boolean)
                .slice(0, 10); // Limit to 10 orders for performance

            console.log(`Found ${orderIds.length} orders to analyze`);

            if (orderIds.length === 0) {
                setIsLoadingPurchased(false);
                setPopularProductsData([]);
                return [];
            }

            // For each order ID, get the complete order details
            const orderDetailsPromises = orderIds.map((id: any) =>
                isB2BUser
                    ? getB2BOrderDetails(parseInt(id, 10))
                    : getBCOrderDetails(parseInt(id, 10))
            );

            const rawOrderDetails = await Promise.all(orderDetailsPromises);

            // Use convertB2BOrderDetails to process orders consistently
            // (This function is already imported from '@/pages/OrderDetail/shared/B2BOrderData')
            const processedOrders = rawOrderDetails.map(order =>
                convertB2BOrderDetails(order, b3Lang)
            );

            // Process the orders to extract products with correct quantities and prices
            const allProducts: any[] = [];
            const latestOrderDates: { [key: string]: Date } = {}; // Track latest order date per product

            processedOrders.forEach(order => {
                if (!order || !order.products) return;

                // Get order date 
                const orderDate = order.payment?.dateCreateAt
                    ? new Date(parseInt(order.payment.dateCreateAt) * 1000)
                    : new Date();

                // Products are already merged by variant_id thanks to handleProductQuantity in convertB2BOrderDetails
                const products = order.products || [];

                console.log("Products: ", products)

                products.forEach(product => {
                    // Extract the product name and other details
                    const name = product.name;
                    const sku = product.sku || '';

                    // These products should already have properly calculated prices from convertB2BOrderDetails
                    let productPrice = 0;
                    if (product.base_price) {
                        productPrice = parseFloat(product.base_price);
                    } else if (product.price_ex_tax) {
                        productPrice = parseFloat(product.price_ex_tax);
                    } else if (product.total_inc_tax && product.quantity) {
                        productPrice = Number(product.total_inc_tax) / Number(product.quantity);
                    }

                    const enhancedProduct = {
                        ...product,
                        name,
                        sku,
                        orderDate,
                        price: productPrice,
                        optionList: product.product_options || []
                    };

                    // Update latest order date
                    if (!latestOrderDates[name] || orderDate > latestOrderDates[name]) {
                        latestOrderDates[name] = orderDate;
                    }

                    allProducts.push(enhancedProduct);
                });
            });

            // Aggregate by product name
            interface ProductAggregation {
                name: string;
                sku: string;
                count: number;
                orderCount: number;
                price: number;
                optionList: any[];
                lastOrdered?: Date;
            }


            const productAggregation: { [key: string]: ProductAggregation } = {};

            allProducts.forEach(product => {
                const name = product.name;
                if (!name) return;

                if (!productAggregation[name]) {
                    productAggregation[name] = {
                        name: name,
                        sku: product.sku || '',
                        count: 0,
                        orderCount: 0,
                        price: product.price || 0,
                        optionList: product.optionList || []
                    };
                }

                // Use the highest price value found for this product
                if (product.price > productAggregation[name].price) {
                    productAggregation[name].price = product.price;
                }

                // Update other fields
                if (latestOrderDates[name]) {
                    productAggregation[name].lastOrdered = latestOrderDates[name];
                }

                const quantity = parseInt(product.quantity) || 1;
                productAggregation[name].count += quantity;
                productAggregation[name].orderCount += 1;

                if (!productAggregation[name].optionList.length && product.optionList?.length) {
                    productAggregation[name].optionList = product.optionList;
                }
            });

            // Convert to array
            let productsArray = Object.values(productAggregation);

            if (!forDownload) {
                productsArray = productsArray
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);
            }

            console.log('Processed products with details and prices:', productsArray);

            if (!forDownload) {
                setPopularProductsData(productsArray);
            }

            return productsArray;
        } catch (error) {
            console.error('Error fetching products from orders:', error);
            // set empty array on error
            setPopularProductsData([]);
            return [];
        } finally {
            setIsLoadingPurchased(false);
        }
    };


    useEffect(() => {
        if (isB2BUser && companyB2BId) {
            setFilterData(prev => ({
                ...prev,
                companyIds: [Number(companyB2BId)]
            }));
        }
    }, [isB2BUser, companyB2BId]);

    // useEffect to automatically load the data
    /*     useEffect(() => {
            // Load data on component mount and when filter dates change
            fetchPopularProductsFromOrders();
        }, [filterData.beginDateAt, filterData.endDateAt]); */


    // Date picker change handler
    const handlePickerChange = (key: string, value: Date | string | number) => {
        const params = {
            ...filterData,
        };

        // Convert value to string based on its type
        let stringValue: string;

        if (value instanceof Date) {
            // Format Date as string 
            stringValue = value.toISOString().split('T')[0]; // YYYY-MM-DD format
        } else {
            // Convert number or string to string
            stringValue = String(value);
        }

        if (key === 'start') {
            params.beginDateAt = stringValue || String(distanceDay(90));
        } else {
            params.endDateAt = stringValue || String(distanceDay(0));
        }

        setFilterData(params);
    };

    const fetchList = async (params: any) => {
        try {
            console.log('Fetching orders with params:', params);

            const result = isB2BUser
                ? await getB2BAllOrders(params)
                : await getBCAllOrders(params);

            console.log('API response:', result);

            // Log the full structure of the first order
            if (result.edges && result.edges.length > 0) {
                console.log('Complete order data structure:', result.edges[0]);
            }

            const { edges = [], totalCount } = result;
            setOrderCount(totalCount);

            // Store order data for download
            setOrderData(edges);

            // Generate a unique identifier for this dataset
            //const dataKey = JSON.stringify(edges.map(o => o.node?.orderId || Math.random()));


            // Calculate total order value
            let orderValueSum = 0;

            if (edges && edges.length > 0) {
                console.log('Processing orders:', edges.length);

                edges.forEach((order: any) => {
                    try {
                        if (order.node && order.node.totalIncTax) {
                            const totalIncTax = parseFloat(order.node.totalIncTax);
                            if (!isNaN(totalIncTax)) {
                                orderValueSum += totalIncTax;
                                console.log(`Added ${totalIncTax} from order ${order.node.orderId}, running total: ${orderValueSum}`);
                            }
                        }
                    } catch (err) {
                        console.error('Error processing order:', err);
                    }
                });

                console.log('Setting total value:', orderValueSum);
                setTotalValue(orderValueSum);

                // Process data for charts
                processChartData(edges);
                processStatusData(edges);
                processEmployeeData(edges);

                // Now also fetch product data in the same operation
                await fetchPopularProductsFromOrders();

                /*    // NEW CODE: Fetch invoice data
                   try {
                       const statsResult = await getInvoiceStats(0, 2, isB2BUser && companyB2BId ? [Number(companyB2BId)] : []);
   
                       if (statsResult && statsResult.invoiceStats) {
                           // Get unpaid and overdue from API
                           const unpaidAmount = Number(statsResult.invoiceStats.totalBalance);
                           const overdueAmount = Number(statsResult.invoiceStats.overDueBalance);
   
                           // We need to calculate the total invoice amount and paid amount
                           // For this, we need to get the invoice total from the invoices
                           let totalInvoiceAmount = 0;
   
                           // Get invoice list to calculate total invoice amount
                           const invoicesResult = await getInvoiceList({
                               first: 50,
                               offset: 0,
                               orderBy: '-invoice_number'
                           });
   
                           if (invoicesResult && invoicesResult.invoices && invoicesResult.invoices.edges) {
                               // Calculate total invoice amount from all invoices
                               totalInvoiceAmount = invoicesResult.invoices.edges.reduce((sum, invoice) => {
                                   const originalBalance = Number(invoice.node.originalBalance.value);
                                   return sum + originalBalance;
                               }, 0);
   
                               // Calculate paid amount
                               const paidAmount = totalInvoiceAmount - unpaidAmount;
   
                               setTotalPaid(paidAmount);
                               setUnpaidAmount(unpaidAmount);
                               setOverdueAmount(overdueAmount);
                           }
                       }
                   } catch (error) {
                       console.error('Error fetching invoice data:', error);
                   } */

            } else {
                // Explicitly set to 0 when no data
                setTotalValue(0);
                setChartData({
                    months: [],
                    values: [],
                    averageOrderValue: 0
                });

                // Reset status data when no orders
                setStatusData([]);

                // Reset employee data when no orders
                setEmployeeData([]);

                // Reset popular products data when no orders
                setPopularProductsData([]);

                // Reset invoice data when there are no orders in date range
                setTotalPaid(0);
                setUnpaidAmount(0);
                setOverdueAmount(0);


            }

            return result;
        } catch (error) {
            console.error('API error:', error);
            return { edges: [], totalCount: 0 };
        } finally {
            setIsLoading(false);
            setIsLoadingAll(false);
        }
    };

    // Example data structure for the stacked bar chart
    const processChartData = (edges: any) => {
        try {
            // Filter valid orders with both createdAt and totalIncTax
            const validOrders = edges.filter((order: any) =>
                order.node &&
                order.node.createdAt &&
                order.node.totalIncTax &&
                order.node.firstName // Ensure we have employee info
            );

            // Group orders by month
            // Add proper typing to these objects
            const monthlyData: {
                [key: string]: {
                    key: string;
                    display: string;
                    total: number;
                    count: number;
                }
            } = {};

            // Also track employee data by month
            const employeeData: {
                [month: string]: {
                    [employee: string]: number
                }
            } = {};



            validOrders.forEach((order: any) => {
                const timestamp = Number(order.node.createdAt);
                const date = new Date(0);
                date.setUTCSeconds(timestamp);

                // Format month for grouping (YYYY-MM)
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const monthKey = `${year}-${month}`;

                // Get value
                const totalIncTax = parseFloat(order.node.totalIncTax);


                // Get employee name
                const firstName = order.node.firstName || '';
                const lastName = order.node.lastName || '';
                const employeeName = `${firstName} ${lastName}`.trim() || 'Unknown';

                // Add to monthly aggregation
                if (!monthlyData[monthKey]) {
                    // Format for display (e.g., "Jan 2025")
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const displayName = `${monthNames[date.getUTCMonth()]} ${year}`;

                    monthlyData[monthKey] = {
                        key: monthKey,
                        display: displayName,
                        total: 0,
                        count: 0
                    };

                    // Initialize employee data for this month
                    employeeData[displayName] = {};
                }

                // Update total for month
                monthlyData[monthKey].total += totalIncTax;
                monthlyData[monthKey].count += 1;

                // Update employee data for this month
                const displayName = monthlyData[monthKey].display;
                if (!employeeData[displayName][employeeName]) {
                    employeeData[displayName][employeeName] = 0;
                }
                employeeData[displayName][employeeName] += totalIncTax;
            });

            // Convert to arrays for chart
            const monthKeys = Object.keys(monthlyData).sort(); // Sort chronologically
            const months: string[] = [];
            const values: number[] = [];

            monthKeys.forEach(key => {
                months.push(monthlyData[key].display);
                values.push(monthlyData[key].total);
            });

            // Calculate average monthly value
            const averageMonthlyValue = values.length > 0
                ? values.reduce((sum, value) => sum + value, 0) / values.length
                : 0;

            console.log('Monthly chart data processed:', { months, values, averageMonthlyValue, employeeData });

            // Save the processed data including employee breakdown
            setChartData({
                months,
                values,
                averageOrderValue: averageMonthlyValue,
                employeeData // Add the employee data breakdown
            });

        } catch (error) {
            console.error('Error processing chart data:', error);
        }
    };

    // Process order status data for donut chart
    const processStatusData = (edges: any) => {
        try {

            interface StatusChartItem {
                id: string;
                value: number;
                label: string;
                color: string;
            }


            // Count orders by status
            const statusCounts: { [key: string]: number } = {};

            edges.forEach((order: any) => {
                if (order.node && order.node.status) {
                    const status = order.node.status;

                    if (!statusCounts[status]) {
                        statusCounts[status] = 0;
                    }

                    statusCounts[status]++;
                }
            });



            // Convert to array for PieChart using status colors from getOrderStatus
            const chartData: StatusChartItem[] = [];

            Object.keys(statusCounts).forEach(status => {
                // Get status details using the imported getOrderStatus function
                const statusInfo = getOrderStatus(status);

                chartData.push({
                    id: status,
                    value: statusCounts[status],
                    label: statusInfo.name || status, // Use the name from getOrderStatus
                    color: statusInfo.color || '#9e9e9e' // Use the color from getOrderStatus or default to gray
                });
            });

            // Sort by count (descending)
            chartData.sort((a, b) => b.value - a.value);

            setStatusData(chartData);
        } catch (error) {
            console.error('Error processing status data:', error);
        }
    };

    // Process employee data for horizontal bar chart
    const processEmployeeData = (edges: any) => {
        try {
            // Define an interface for the employee data structure
            interface EmployeeData {
                name: string;
                totalSpending: number;
                orderCount: number;
            }

            // Group orders by employee with proper typing
            const employeeSpending: { [key: string]: EmployeeData } = {};

            edges.forEach((order: any) => {
                if (order.node && order.node.totalIncTax) {
                    // Get employee name
                    const firstName = order.node.firstName || '';
                    const lastName = order.node.lastName || '';
                    const employeeName = `${firstName} ${lastName}`.trim();

                    // Skip if we don't have a name
                    if (!employeeName) return;

                    // Initialize employee record if first time seeing them
                    if (!employeeSpending[employeeName]) {
                        employeeSpending[employeeName] = {
                            name: employeeName,
                            totalSpending: 0,
                            orderCount: 0
                        };
                    }

                    // Add order value to employee's total
                    const totalIncTax = parseFloat(order.node.totalIncTax);
                    if (!isNaN(totalIncTax)) {
                        employeeSpending[employeeName].totalSpending += totalIncTax;
                        employeeSpending[employeeName].orderCount += 1;
                    }
                }
            });

            // Convert to array for chart
            const chartData = Object.values(employeeSpending);

            // Sort by total spending (descending)
            chartData.sort((a, b) => b.totalSpending - a.totalSpending);

            // Take top 10 employees (if more than 10)
            const topEmployees = chartData.slice(0, 10);

            console.log('Employee spending data processed:', topEmployees);
            setEmployeeData(topEmployees);

        } catch (error) {
            console.error('Error processing employee data:', error);
        }
    };

    // Function to handle download of orders data
    const handleDownload = () => {
        if (orderData.length === 0) {
            return;
        }

        // Convert order data to CSV format
        const headers = ['Order ID', 'Date', 'Status', 'Total', 'Customer'];

        // Map order data to CSV rows with proper date conversion
        const rows = orderData.map((order: any) => {
            const node = order.node || {};

            // Properly convert Unix timestamp to date
            let dateStr = '';
            if (node.createdAt) {
                const timestamp = Number(node.createdAt);

                // Create a date using UTC to avoid timezone issues
                const date = new Date(0); // Initialize at epoch
                date.setUTCSeconds(timestamp); // Set as UTC seconds from epoch

                // Format as YYYY-MM-DD to avoid locale-specific formatting
                const year = date.getUTCFullYear();
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            }

            return [
                node.orderId || '',
                dateStr,
                node.status || '',
                node.totalIncTax ? currencyFormat(node.totalIncTax).replace(',', '') : '$0.00',
                `${node.firstName || ''} ${node.lastName || ''}`.trim()
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);

        // Append to document, click, and clean up
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    // Function to handle getting purchased products data (based on QuickOrderB2BTable.tsx)
    /* const handleGetProductsById = async (listProducts) => {
        if (listProducts.length > 0) {
            const productIds = [];
            listProducts.forEach((item) => {
                const { node } = item;
                node.quantity = 1;
                if (!productIds.includes(node.productId)) {
                    productIds.push(node.productId);
                }
            });

            const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts;

            try {
                const { productsSearch } = await getProducts({
                    productIds,
                    currencyCode,
                    companyId: companyInfoId,
                    customerGroupId,
                });

                // This is the key change - use conversionProductsList as in QuickOrderB2BTable
                const newProductsSearch = conversionProductsList(productsSearch);

                listProducts.forEach((item) => {
                    const { node } = item;

                    const productInfo = newProductsSearch.find((search) => {
                        const { id: productId } = search;
                        return Number(node.productId) === Number(productId);
                    });

                    node.productsSearch = productInfo || {};
                });

                return listProducts;
            } catch (err) {
                console.error('Error fetching product details:', err);
            }
        }
        return [];
    }; */

    // Function to fetch purchased items
    /* const fetchPurchasedItems = async () => {
        try {
            setIsLoadingPurchased(true);

            // Create search params similar to QuickOrderB2BTable
            const params = {
                q: '',
                first: 50, // API pagination limit
                offset: 0,
                beginDateAt: filterData.beginDateAt,
                endDateAt: filterData.endDateAt,
                orderBy: '-lastOrderedAt',
            };

            // Use the same API functions as QuickOrderB2BTable
            const getProducts = isB2BUser ? getOrderedProducts : getBcOrderedProducts;

            // Get ordered products
            const result = await getProducts(params);
            const { edges, totalCount } = result.orderedProducts;

            // Process products data with the same function used in QuickOrderB2BTable
            const listProducts = await handleGetProductsById(edges);

            // Set purchased items state
            setPurchasedItems(listProducts);

            // Process for popular products chart
            processPopularProducts(listProducts);

            return listProducts;
        } catch (error) {
            console.error('Error fetching purchased items:', error);
            return [];
        } finally {
            setIsLoadingPurchased(false);
        }
    }; */

    // Updated handleDownloadPurchasedItems function
    const handleDownloadPurchasedItems = async () => {
        try {
            setIsLoadingPurchased(true);

            // Fetch products with accurate quantities and all details, specifying it's for download
            const products = await fetchPopularProductsFromOrders(true) as Array<{
                name?: string;
                sku?: string;
                lastOrdered?: Date;
                price?: number;
                count: number;
                optionList?: Array<{
                    display_name?: string;
                    displayName?: string;
                    display_value?: string;
                    displayValue?: string;
                }>;
            }>;;

            if (products.length === 0) {
                console.log('No purchased items to download');
                setIsLoadingPurchased(false);
                return;
            }

            // Convert to CSV format
            const headers = ['Product Name', 'SKU', 'Option Values', 'Last Ordered', 'Price (inc tax.)', 'Quantity'];

            // Map product data to CSV rows
            const rows = products.map(product => {
                // Format last ordered date
                let lastOrderedDate = '';
                if (product.lastOrdered) {
                    const date = new Date(product.lastOrdered);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    lastOrderedDate = `${year}-${month}-${day}`;
                }

                // Format option values
                let optionValues = '';
                if (product.optionList && product.optionList.length > 0) {
                    optionValues = product.optionList
                        .map(option => `${option.display_name || option.displayName}: ${option.display_value || option.displayValue}`)
                        .join(', ');
                }

                return [
                    product.name || '',
                    product.sku || '',
                    optionValues,
                    lastOrderedDate,
                    product.price ? currencyFormat(product.price).replace(',', '') : '$0.00',
                    product.count.toString() // The accurate quantity we've calculated
                ];
            });

            // Sort rows by quantity (descending)
            rows.sort((a, b) => parseInt(b[5]) - parseInt(a[5]));

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Create a blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');

            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `purchased_items_${new Date().toISOString().slice(0, 10)}.csv`);

            // Append to document, click, and clean up
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading purchased items:', error);
        } finally {
            setIsLoadingPurchased(false);
        }
    };



    const theme = useTheme();
    //const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg')); // true for xs or smaller

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box >
            {/* Header with Download Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mr: 3 }}>
                    {!isMobile && (
                        <>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownload}
                                disabled={orderData.length === 0}
                                sx={{ mr: 2 }}
                            >
                                Orders
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownloadPurchasedItems}
                                disabled={isLoadingPurchased || popularProductsData.length === 0}
                                sx={{ mr: 2 }}
                            >
                                Products
                            </Button>
                        </>)}

                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
                    {/* Date Filter */}
                    <B3FilterPicker
                        handleChange={handlePickerChange}
                        xs={{
                            mt: 0,
                            height: '50px',
                        }}
                        startPicker={{
                            isEnabled: true,
                            label: b3Lang('orders.from') || 'From',
                            defaultValue: filterData.beginDateAt,
                            pickerKey: 'start',
                        }}
                        endPicker={{
                            isEnabled: true,
                            label: b3Lang('orders.to') || 'To',
                            defaultValue: filterData.endDateAt,
                            pickerKey: 'end',
                        }}
                    />
                </Box>
            </Box>

            {/* Hidden pagination table to fetch data */}
            <div style={{ display: 'none', height: 0, overflow: 'hidden' }}>
                <B3PaginationTable
                    columnItems={[{ key: 'orderId', title: 'Order' }]}
                    rowsPerPageOptions={[30]}
                    getRequestList={fetchList}
                    searchParams={filterData}
                    isCustomRender={false}
                    requestLoading={setIsLoading}
                    tableKey="orderId"
                    pageType="orderListPage"
                    sortDirection={order}
                    orderBy={orderBy}
                    sortByFn={handleSetOrderBy}
                    isAutoRefresh={false}
                />
            </div>

            {/* Visible cards with order count and total value */}
            <B3Spin isSpinning={isLoadingAll}>
                <Grid container spacing={3}>
                    {/* First row - Total spending, Spending per Ordera and Order Status */}

                    <Grid item xs={12} lg={5}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TotalSpendingCard totalValue={totalValue} />
                            </Grid>
                            <Grid item xs={12}>
                                <SpendingPerOrderCard totalValue={totalValue} orderCount={orderCount} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                        <OrderStatusCard statusData={statusData} orderCount={orderCount} />
                    </Grid>



                    {/* Second row - Monthly Orders chart and Popular Products */}
                    <Grid item xs={12} lg={6}>
                        <MonthlyOrdersChart chartData={chartData} isLoadingAll={isLoadingAll} />
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        {/* Popular Products Card */}
                        <PopularProductsCard popularProductsData={popularProductsData} />
                    </Grid>

                    {/* Third row - Employee Metrics */}
                    <Grid item xs={12}>
                        <EmployeeMetricsCard employeeData={employeeData} />
                    </Grid>
                    {/*                    <Grid item xs={12} lg={4}>
                        <InvoiceMetricsChart
                            totalPaid={totalPaid}
                            unpaidAmount={unpaidAmount}
                            overdueAmount={overdueAmount}
                        />
                    </Grid> */}
                </Grid>
            </B3Spin>
        </Box >
    );
}

export default TestPage;