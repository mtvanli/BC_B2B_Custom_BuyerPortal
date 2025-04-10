import React from 'react';
import { Card, CardContent, Typography, Grid, Box, useMediaQuery, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { currencyFormat } from '@/utils';

interface EmployeeData {
    name: string;
    totalSpending: number;
    orderCount: number;
}

interface EmployeeMetricsCardProps {
    employeeData: EmployeeData[];
}

const EmployeeMetricsCard: React.FC<EmployeeMetricsCardProps> = ({ employeeData }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));

    return (
        <Card sx={{ height: '100%', width: '100%' }}>
            <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ pb: 2 }}>
                    Order by Employee
                </Typography>
                {employeeData.length > 0 ? (
                    <Grid container spacing={0}>
                        {/* Spending per Employee Chart */}
                        <Grid item xs={12} lg={4}>
                            <Typography variant="subtitle1" align="center" gutterBottom>
                                Total Order Value
                            </Typography>
                            <Box sx={{ height: 220, width: '100%' }}>
                                <BarChart
                                    layout="horizontal"
                                    series={[
                                        {
                                            data: employeeData.map(emp => emp.totalSpending),
                                            color: '#87CBF6',
                                            valueFormatter: (value) => currencyFormat(value || 0)
                                        }
                                    ]}
                                    xAxis={[{
                                        scaleType: 'linear',
                                        min: 0,
                                        max: Math.max(...employeeData.map(emp => emp.totalSpending)) * 1.1,
                                        label: 'Total ($)',
                                        tickLabelStyle: {
                                            fontSize: 12
                                        },
                                        disableLine: true,
                                        disableTicks: true,
                                        labelStyle: { transform: 'translateY(10px)' }
                                    }]}
                                    yAxis={[{
                                        scaleType: 'band',
                                        data: employeeData.map(emp => emp.name),
                                        dataKey: 'name',
                                        disableLine: true,
                                        disableTicks: true
                                    }]}
                                    margin={{ left: isSmallScreen ? 120 : 130, right: 15, top: 10, bottom: 60 }}
                                    grid={{ vertical: true }}
                                    borderRadius={2}
                                />
                            </Box>
                        </Grid>

                        {/* Order Count per Employee Chart */}
                        <Grid item xs={12} lg={4}>
                            <Typography variant="subtitle1" align="center" gutterBottom>
                                Order Count
                            </Typography>
                            <Box sx={{ height: 220, width: '100%' }}>
                                <BarChart
                                    layout="horizontal"
                                    series={[
                                        {
                                            data: employeeData.map(emp => emp.orderCount),
                                            color: '#87CBF6',
                                            valueFormatter: (value) => (value ?? 0).toLocaleString()
                                        }
                                    ]}
                                    xAxis={[{
                                        scaleType: 'linear',
                                        min: 0,
                                        max: Math.max(...employeeData.map(emp => emp.orderCount)) * 1.1,
                                        label: '# of Orders',
                                        tickLabelStyle: {
                                            fontSize: 12
                                        },
                                        tickMinStep: 1,
                                        disableLine: true,
                                        disableTicks: true,
                                        labelStyle: { transform: 'translateY(10px)' }
                                    }]}
                                    yAxis={[{
                                        scaleType: 'band',
                                        data: employeeData.map(emp => emp.name),
                                        dataKey: 'name',
                                        tickLabelStyle: {
                                            fontSize: isSmallScreen ? 12 : 0 // Hide labels as they're the same as the first chart
                                        },
                                        disableLine: true,
                                        disableTicks: true
                                    }]}
                                    margin={{ left: isSmallScreen ? 120 : 55, right: 5, top: 10, bottom: 60 }}
                                    grid={{ vertical: true }}
                                    borderRadius={2}
                                />
                            </Box>
                        </Grid>

                        {/* Spending per Order Chart */}
                        <Grid item xs={12} lg={4}>
                            <Typography variant="subtitle1" align="center" gutterBottom>
                                Avg Order Value
                            </Typography>
                            <Box sx={{ height: 220, width: '100%' }}>
                                <BarChart
                                    layout="horizontal"
                                    series={[
                                        {
                                            data: employeeData.map(emp => emp.orderCount > 0 ? emp.totalSpending / emp.orderCount : 0),
                                            color: '#87CBF6',
                                            valueFormatter: (value) => currencyFormat(value || 0)
                                        }
                                    ]}
                                    xAxis={[{
                                        scaleType: 'linear',
                                        min: 0,
                                        max: Math.max(...employeeData.map(emp => emp.orderCount > 0 ? emp.totalSpending / emp.orderCount : 0)) * 1.1,
                                        label: 'Avg.($)',
                                        tickLabelStyle: {
                                            fontSize: 12
                                        },
                                        disableLine: true,
                                        disableTicks: true,
                                        labelStyle: { transform: 'translateY(10px)' }
                                    }]}
                                    yAxis={[{
                                        scaleType: 'band',
                                        data: employeeData.map(emp => emp.name),
                                        dataKey: 'name',
                                        tickLabelStyle: {
                                            fontSize: isSmallScreen ? 12 : 0  // Hide labels as they're the same as the first chart
                                        },
                                        disableLine: true,
                                        disableTicks: true
                                    }]}
                                    margin={{ left: isSmallScreen ? 120 : 55, right: 20, top: 10, bottom: 60 }}
                                    grid={{ vertical: true }}
                                    borderRadius={2}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    <Typography variant="body1" sx={{ py: 5, textAlign: 'center' }}>
                        No employee data available
                    </Typography>
                )}

                {/* {employeeData.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 2 }}>
                        Showing top {employeeData.length} employees by spending
                    </Typography>
                )} */}
            </CardContent>
        </Card>
    );
};

export default EmployeeMetricsCard;