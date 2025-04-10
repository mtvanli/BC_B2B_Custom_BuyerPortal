import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { currencyFormat } from '@/utils';

interface TotalSpendingCardProps {
    totalValue: number;
}

const TotalSpendingCard: React.FC<TotalSpendingCardProps> = ({ totalValue }) => {

    const hasData = totalValue > 0;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
                    Total Spending
                </Typography>

                {hasData ? (
                    <>
                        <Typography variant="h4" component="div" sx={{ textAlign: 'center' }}>
                            {currencyFormat(totalValue)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                            Sum of all orders
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

export default TotalSpendingCard;