
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { currencyFormat } from '@/utils';

interface SpendingPerOrderCardProps {
    totalValue: number;
    orderCount: number;
}

const SpendingPerOrderCard: React.FC<SpendingPerOrderCardProps> = ({ totalValue, orderCount }) => {
    // Determine if we have data
    const hasData = orderCount > 0;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
                    Spending per Order
                </Typography>

                {hasData ? (
                    <>
                        <Typography variant="h4" component="div" sx={{ textAlign: 'center' }}>
                            {currencyFormat(totalValue / orderCount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                            Average order value
                        </Typography>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 101 }}>
                        <Typography variant="h6" color="text.secondary">
                            No data
                        </Typography>

                    </Box>
                )}


            </CardContent>
        </Card>
    );
};

export default SpendingPerOrderCard;