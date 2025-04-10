import { Box, Typography } from '@mui/material';
import { useAppSelector } from '@/store';

const CompanyName = () => {
    const companyName = useAppSelector(({ company }) => company.companyInfo.companyName); // or whichever property worked

    if (!companyName) return null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 500 }}
            >
                {companyName}
            </Typography>
            <Typography
                variant="h6"
                color="primary.main"
                sx={{ fontWeight: 500 }}
            >
                Buyer Portal
            </Typography>
        </Box>
    );
};

export default CompanyName;