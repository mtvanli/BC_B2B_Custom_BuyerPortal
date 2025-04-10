import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';


interface StatusData {
    id: string;
    value: number;
    label: string;
    color: string;
}

interface OrderStatusCardProps {
    statusData: StatusData[];
    orderCount: number;
}

const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ statusData, orderCount }) => {
    // Check if we have data
    const hasData = orderCount > 0;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ pb: 3 }}>
                    Order Status
                </Typography>
                {hasData ? (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        {/* Chart on left */}
                        <Box sx={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <Box sx={{ position: 'relative' }}>
                                <PieChart
                                    series={[
                                        {
                                            data: statusData,
                                            innerRadius: 60,
                                            outerRadius: 100,
                                            paddingAngle: 1,
                                            cornerRadius: 4,
                                            startAngle: 0,
                                            endAngle: 360,
                                            highlightScope: { faded: 'global', highlighted: 'item' },
                                            arcLabel: (item) => `${Math.round((item.value / orderCount) * 100)}%`
                                        }
                                    ]}
                                    height={220}
                                    width={220}
                                    margin={{ right: 0, left: 0, top: 5, bottom: 25 }}
                                    slotProps={{
                                        legend: { hidden: true }
                                    }}
                                />

                                {/* Center text showing total orders */}
                                <Typography
                                    variant="h3"
                                    align="center"
                                    sx={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -80%)',
                                        fontWeight: 'bold',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {orderCount}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    align="center"
                                    sx={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '58%',
                                        transform: 'translate(-50%, -30%)',
                                        display: 'block',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    Total Orders
                                </Typography>
                            </Box>
                        </Box>

                        {/* Legend on right */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 1,
                            ml: 4
                        }}>
                            {statusData.map((status) => (
                                <Box key={status.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            backgroundColor: status.color,
                                            mr: 1,
                                            borderRadius: '2px'
                                        }}
                                    />
                                    <Typography variant="caption">
                                        {status.label} ({status.value})
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 280
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            No data
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default OrderStatusCard;