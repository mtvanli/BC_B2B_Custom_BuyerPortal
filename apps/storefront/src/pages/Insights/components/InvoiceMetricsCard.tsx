import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useDrawingArea } from '@mui/x-charts';
import { handleGetCorrespondingCurrencyToken } from '@/utils';

interface InvoiceMetricsChartProps {
    unpaidAmount: number;
    overdueAmount: number;
    totalPaid: number;
}

// Create a custom TotalLine component to use the drawing area
const TotalLine = ({ total, maxValue, formatCurrency }: {
    total: number;
    maxValue: number;
    formatCurrency: (value: number | null) => string
}) => {
    const { left, top, width, height } = useDrawingArea();
    // Safety check to prevent NaN values
    if (!total || !maxValue || maxValue === 0) {
        return null;
    }

    // Calculate position as percentage of the total height
    const yPosition = top + height * (1 - total / maxValue);

    return (
        <React.Fragment>
            {/* Total Invoice Amount Line */}
            <line
                x1={left}
                y1={yPosition}
                x2={left + width}
                y2={yPosition}
                stroke="#000000"
                strokeWidth={2}
                style={{ pointerEvents: 'none' }}
            />

            {/* Add white background rectangle for the label */}
            {/*   <rect
                x={left + width - 17}
                y={yPosition - 20}
                width={95}
                height={25}
                fill="white"
                stroke="#ff6384"
                strokeWidth={1}
                rx={3}
                ry={3}
                style={{ pointerEvents: 'none' }}
            /> */}

            {/* Add the text label */}
            <text
                x={left + width + 90}
                y={yPosition - 12}
                textAnchor="end"
                dominantBaseline="hanging"
                fill="#000000"
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    pointerEvents: 'none'
                }}
            >
                Total: {formatCurrency(total)}
            </text>
        </React.Fragment>
    );
};

const InvoiceMetricsChart = ({ unpaidAmount, overdueAmount, totalPaid }: InvoiceMetricsChartProps) => {
    // Calculate the due amount (unpaid minus overdue)
    const dueAmount = unpaidAmount - overdueAmount;

    // Calculate the total invoice amount
    const totalInvoiceAmount = totalPaid + dueAmount + overdueAmount;

    // Create dataset for the chart
    const chartData = [
        {
            name: 'Invoices',
            paid: totalPaid,
            due: dueAmount,
            overdue: overdueAmount
        }
    ];

    // Format currency for display
    const formatCurrency = (value: number | null) => {
        if (value === null) return '';
        const currencyToken = handleGetCorrespondingCurrencyToken('USD');
        return `${currencyToken}${value.toFixed(2)}`;
    };

    // Add 10% padding to the max value to ensure the total line is visible
    const maxChartValue = totalInvoiceAmount * 1.1;

    return (
        <Card sx={{ height: '100%', width: '100%' }}>
            <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Invoice Payments
                </Typography>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 280,
                    width: '100%',
                    pt: 1
                }}>
                    <BarChart
                        dataset={chartData}
                        xAxis={[{
                            scaleType: 'band',
                            dataKey: 'name',
                            disableLine: true,
                            disableTicks: true,
                            categoryGapRatio: 0.6
                        } as any]}
                        series={[
                            {
                                dataKey: 'paid',
                                label: 'Paid',
                                valueFormatter: formatCurrency,
                                color: '#7ed681',
                                stack: 'total',

                            },
                            {
                                dataKey: 'due',
                                label: 'Due',
                                valueFormatter: formatCurrency,
                                color: '#edb378',
                                stack: 'total'
                            },
                            {
                                dataKey: 'overdue',
                                label: 'Overdue',
                                valueFormatter: formatCurrency,
                                color: '#f2665c',
                                stack: 'total'
                            }
                        ]}
                        yAxis={[{
                            valueFormatter: formatCurrency,
                            disableLine: true,
                            disableTicks: true,
                            min: 0,
                            max: maxChartValue
                        }]}
                        height={240}
                        margin={{
                            right: 90,
                            left: 80,
                            top: 20,
                            bottom: 70
                        }}
                        grid={{ horizontal: true }}
                        barLabel="value"
                        slotProps={{
                            legend: {
                                direction: 'row',
                                position: {
                                    vertical: 'bottom',
                                    horizontal: 'middle'
                                },
                                padding: { top: 30 },
                                itemMarkWidth: 13,
                                itemMarkHeight: 13,
                                markGap: 5,
                                itemGap: 10,
                                labelStyle: {
                                    fontSize: 15,
                                }
                            }
                        }}
                    >
                        {totalInvoiceAmount > 0 && (
                            <TotalLine
                                total={totalInvoiceAmount}
                                maxValue={maxChartValue}
                                formatCurrency={formatCurrency}
                            />
                        )}
                    </BarChart>

                    {/* Add Total to Legend */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mt: 2
                    }}>
                        <Box sx={{
                            width: 16,
                            height: 2,
                            backgroundColor: '#000000',
                            mr: 1,
                            borderTop: '1px dashed #000000',
                            flexShrink: 0
                        }} />
                        <Typography
                            variant="body2"
                            sx={{ fontSize: '0.875rem' }}
                        >
                            Total Invoice Amount
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default InvoiceMetricsChart;