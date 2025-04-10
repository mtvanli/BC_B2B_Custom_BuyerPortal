import React from 'react';
import { Card, CardContent, Typography, Box, useMediaQuery, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { currencyFormat } from '@/utils';

interface ChartData {
    months: string[];
    values: number[];
    averageOrderValue: number;
    // Add employee data structure
    employeeData?: {
        [month: string]: {
            [employee: string]: number;
        };
    };
}

interface MonthlyOrdersChartProps {
    chartData: ChartData;
    isLoadingAll: boolean;
}

const MonthlyOrdersChart: React.FC<MonthlyOrdersChartProps> = ({ chartData, isLoadingAll }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // Check if chart data is empty
    const isEmpty = !chartData.months || chartData.months.length === 0;

    // Skip the rest of the logic if we don't have data
    if (isEmpty) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Orders by Month
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 300
                    }}>
                        <Typography variant="h6" color="text.secondary">
                            No data
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    // Adjust margins based on screen size
    const chartMargins = isSmallScreen
        ? { left: 55, right: 20, top: 30, bottom: 40 }
        : { left: 70, right: 45, top: 30, bottom: 40 };

    // Default colors for employee stacks
    const employeeColors = [
        '#555B6E', // Original color
        '#89B0AE', // Darker shade
        '#BEE3DB', // Lighter shade
        '#FAF9F9', // Even darker
        '#FFD6BA', // Even lighter
        '#59724B', // Very dark
        '#E9F1E3', // Very light
        '#3E5934', // Very very dark
        '#F4F8F1'  // Very very light
    ];

    // Generate series data for stacked bar chart
    const generateStackedSeries = () => {
        if (!chartData.employeeData) {
            // If no employee data, return the original single series
            return [{
                data: chartData.values,
                type: 'bar' as const,
                color: employeeColors[0],
                valueFormatter: (value: any) => currencyFormat(value),
                stack: 'total',
                label: 'Total'
            }];
        }

        // Get all unique employees across all months
        const allEmployees = new Set<string>();
        Object.values(chartData.employeeData).forEach(monthData => {
            Object.keys(monthData).forEach(employee => {
                allEmployees.add(employee);
            });
        });

        // Convert to array and limit if too many employees
        const employeesList = Array.from(allEmployees).slice(0, employeeColors.length);

        // Create a series for each employee
        return employeesList.map((employee, index) => {
            // Get this employee's values for each month
            const data = chartData.months.map(month => {
                if (chartData.employeeData?.[month]?.[employee]) {
                    return chartData.employeeData[month][employee];
                }
                return 0; // No value for this employee in this month
            });

            return {
                data,
                type: 'bar' as const,
                color: employeeColors[index % employeeColors.length],
                valueFormatter: (value: any) => currencyFormat(value),
                stack: 'total',
                label: employee
            };
        });
    };

    const series = generateStackedSeries();

    // CONSTANTS FOR CONSISTENT HEIGHTS
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
                    Orders by Month
                </Typography>
                {chartData.months && chartData.months.length > 0 ? (
                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        height: CHART_HEIGHT,
                        flexGrow: 1
                    }}>
                        <BarChart
                            margin={chartMargins}
                            series={series}
                            xAxis={[{
                                scaleType: 'band',
                                data: chartData.months,
                                disableLine: true,
                                disableTicks: true
                            }]}
                            yAxis={[{
                                label: '($)',
                                labelStyle: {
                                    fontSize: 12,
                                    transform: 'translate(0, -120px)'
                                },
                                min: 0,
                                max: Math.max(...chartData.values) * 1.2
                            }]}
                            borderRadius={2}
                            height={CHART_HEIGHT}
                            slotProps={{
                                legend: {
                                    hidden: true
                                }
                            }}

                        />
                        {/* Only show these elements when data is loaded */}
                        {!isLoadingAll && chartData.months && chartData.months.length > 0 && chartData.values && chartData.values.length > 0 && (
                            <>
                                {/* Add a custom average line overlay */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: isSmallScreen ? 35 : 40,
                                        right: isSmallScreen ? 20 : 40,
                                        height: '2px',
                                        backgroundColor: '#ff6384',
                                        borderStyle: 'dashed',
                                        borderWidth: '0 0 2px 0',
                                        borderColor: '#ff6384',
                                        top: `${CHART_HEIGHT - 40 - (chartData.averageOrderValue / (Math.max(...chartData.values) * 1.2)) * (CHART_HEIGHT - 40 - 30)}px`,
                                        zIndex: 1000,
                                        ml: isSmallScreen ? 2 : 3
                                    }}
                                />

                                {/* Label for the average line */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        right: isSmallScreen ? 20 : 45,
                                        backgroundColor: 'white',
                                        padding: '3px 3px',
                                        border: '1px solid #ff6384',
                                        borderRadius: '5px',
                                        color: '#ff6384',
                                        top: `${CHART_HEIGHT - 40 - (chartData.averageOrderValue / (Math.max(...chartData.values) * 1.2)) * (CHART_HEIGHT - 40 - 20) - 10}px`,
                                        zIndex: 1000,
                                        fontSize: isSmallScreen ? '0.65rem' : '0.75rem'
                                    }}
                                >
                                    Monthly Avg: {currencyFormat(chartData.averageOrderValue)}
                                </Typography>
                            </>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ py: 5, textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body1">
                            No order data available for chart
                        </Typography>
                    </Box>
                )}

                {/* Legend */}
                <Box sx={{
                    mt: 2,
                    overflow: 'visible',
                    flexShrink: 0
                }}>
                    {/* First row for employees */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: isSmallScreen ? 1 : 2,
                        mb: 1
                    }}>
                        {series.map((item, index) => (
                            <Box key={index} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                minWidth: isSmallScreen ? '80px' : 'auto'
                            }}>
                                <Box sx={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: item.color,
                                    mr: 1,
                                    flexShrink: 0
                                }} />
                                <Typography
                                    variant="body2"
                                    noWrap={false}
                                    sx={{
                                        fontSize: isSmallScreen ? '0.7rem' : '0.875rem',
                                        lineHeight: 1.2
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Second row for average line */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mt: isSmallScreen ? 0.5 : 1
                    }}>
                        <Box sx={{
                            width: 16,
                            height: 2,
                            backgroundColor: '#ff6384',
                            mr: 1,
                            borderTop: '1px dashed #ff6384',
                            flexShrink: 0
                        }} />
                        <Typography
                            variant="body2"
                            sx={{ fontSize: isSmallScreen ? '0.7rem' : '0.875rem' }}
                        >
                            Average Order Value
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default MonthlyOrdersChart;