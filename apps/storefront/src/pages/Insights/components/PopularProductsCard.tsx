import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme, useMediaQuery } from '@mui/material';

interface ProductData {
    name: string;
    count: number;
    orderCount: number;
    sku: string;
    price?: number;
    optionList?: any[];
    lastOrdered?: Date;
}

interface PopularProductsCardProps {
    popularProductsData: ProductData[];
}

const PopularProductsCard: React.FC<PopularProductsCardProps> = ({ popularProductsData }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // CONSTANTS FOR CONSISTENT HEIGHTS - MATCH WITH MONTHLY CHART
    const CARD_HEIGHT = '100%';  // Use 100% to fill the grid cell
    const CHART_HEIGHT = 300;    // Fixed chart height across both components
    const CONTENT_PADDING = 2;   // Consistent padding

    return (
        <Card sx={{
            width: '100%',
            height: CARD_HEIGHT,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <CardContent sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                p: CONTENT_PADDING
            }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Most Purchased Products
                </Typography>
                {popularProductsData.length > 0 ? (
                    <Box sx={{
                        height: CHART_HEIGHT,
                        width: '100%',
                        flexGrow: 1
                    }}>
                        <BarChart
                            layout="horizontal"
                            series={[
                                {
                                    data: popularProductsData.map(product => product.count),
                                    color: '#989FC3',
                                    valueFormatter: (value: any) =>
                                        value !== null && value !== undefined
                                            ? `${value.toLocaleString()} units`
                                            : '0 units'
                                }
                            ]}
                            xAxis={[{
                                scaleType: 'linear',
                                min: 0,
                                max: Math.max(...popularProductsData.map(product => product.count)) * 1.1,
                                label: 'Quantity Ordered',
                                tickLabelStyle: {
                                    fontSize: 0
                                },
                                disableLine: true,
                                disableTicks: true
                            }]}
                            yAxis={[{
                                scaleType: 'band',
                                data: popularProductsData.map(product => `${product.name} (${product.orderCount} orders)`),
                                dataKey: 'name',
                                disableLine: true,
                                disableTicks: true,
                            }]}
                            margin={{
                                left: isSmallScreen ? 180 : 300,
                                right: 20,
                                top: 20,
                                bottom: 40
                            }}
                            height={CHART_HEIGHT}
                            borderRadius={2}
                            barLabel="value"
                        />
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: CHART_HEIGHT,
                        flexGrow: 1
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            No product data available for the selected date range
                        </Typography>
                    </Box>
                )}

                {popularProductsData.length > 0 && (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 2,
                        flexShrink: 0
                    }}>
                        <Typography variant="caption" color="text.secondary">
                            Based on total quantity ordered in selected date range
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Showing top {popularProductsData.length} products by quantity
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PopularProductsCard;