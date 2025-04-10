import { useContext, useEffect, useMemo } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Badge, List, ListItem, ListItemButton, ListItemText, useTheme, Paper, ListItemIcon } from '@mui/material';

import { useMobile } from '@/hooks';
import { DynamicallyVariableContext } from '@/shared/dynamicallyVariable';
import { GlobalContext } from '@/shared/global';
import { type RouteItem } from '@/shared/routeList';
import { getAllowedRoutes } from '@/shared/routes';
import { store, useAppSelector } from '@/store';
import {
  setCompanyHierarchyInfoModules,
  setPagesSubsidiariesPermission,
} from '@/store/slices/company';
import { PagesSubsidiariesPermissionProps } from '@/types';
import { B3SStorage } from '@/utils';
import { validatePermissionWithComparisonType } from '@/utils/b3CheckPermissions';

import { b3HexToRgb } from '../outSideComponents/utils/b3CustomStyles';

import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import ShopOutlinedIcon from '@mui/icons-material/ShopOutlined';
import Shop2OutlinedIcon from '@mui/icons-material/Shop2Outlined';

interface B3NavProps {
  closeSidebar?: (x: boolean) => void;
}

const getSubsidiariesPermission = (routes: RouteItem[]) => {
  const subsidiariesPermission = routes.reduce((all, cur) => {
    if (cur?.subsidiariesCompanyKey) {
      const code = cur.permissionCodes?.includes(',')
        ? cur.permissionCodes.split(',')[0].trim()
        : cur.permissionCodes;

      all[cur.subsidiariesCompanyKey] = validatePermissionWithComparisonType({
        level: 3,
        code,
      });
    }

    return all;
  }, {} as PagesSubsidiariesPermissionProps);

  return subsidiariesPermission;
};

export default function B3Nav({ closeSidebar }: B3NavProps) {
  const [isMobile] = useMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const b3Lang = useB3Lang();

  const { dispatch } = useContext(DynamicallyVariableContext);
  const role = useAppSelector(({ company }) => company.customer.role);

  const { selectCompanyHierarchyId, isEnabledCompanyHierarchy } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

  const { permissions } = useAppSelector(({ company }) => company);

  const { state: globalState } = useContext(GlobalContext);
  const { quoteDetailHasNewMessages, registerEnabled } = globalState;

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const jumpRegister = () => {
    navigate('/register');
    dispatch({
      type: 'common',
      payload: {
        globalMessageDialog: {
          open: false,
          title: '',
          message: '',
          cancelText: 'Cancel',
        },
      },
    });
  };

  const handleClick = (item: { configKey?: string; path: string }) => {
    if (role === 100) {
      dispatch({
        type: 'common',
        payload: {
          globalMessageDialog: {
            open: true,
            title: 'Registration',
            message:
              item.configKey === 'shoppingLists'
                ? 'Please create an account, or login to create a shopping list.'
                : 'To receive full access to buyer portal, please register. It will take 2 minutes.',
            cancelText: 'Cancel',
            saveText: registerEnabled ? 'Register' : '',
            saveFn: jumpRegister,
          },
        },
      });

      return;
    }

    navigate(item.path);
    if (isMobile && closeSidebar) {
      closeSidebar(false);
    }
  };

  useEffect(() => {
    let isHasSubsidiariesCompanyPermission = false;
    const { hash } = window.location;
    const url = hash.split('#')[1] || '';
    const routes = getAllowedRoutes(globalState).filter((route) => route.isMenuItem);

    if (url) {
      const routeItem = getAllowedRoutes(globalState).find((item) => {
        return matchPath(item.path, url);
      });

      if (routeItem && routeItem?.subsidiariesCompanyKey) {
        const { permissionCodes } = routeItem;

        const code = permissionCodes?.includes(',')
          ? permissionCodes.split(',')[0].trim()
          : permissionCodes;

        isHasSubsidiariesCompanyPermission = validatePermissionWithComparisonType({
          code,
          level: 3,
        });
      }
    }

    const subsidiariesPermission = getSubsidiariesPermission(routes);

    store.dispatch(setPagesSubsidiariesPermission(subsidiariesPermission));

    store.dispatch(
      setCompanyHierarchyInfoModules({
        isHasCurrentPagePermission: isHasSubsidiariesCompanyPermission,
      }),
    );
  }, [selectCompanyHierarchyId, globalState, navigate]);

  const newRoutes = useMemo(() => {
    let routes = getAllowedRoutes(globalState).filter((route) => route.isMenuItem);

    const subsidiariesPermission = getSubsidiariesPermission(routes);

    if (selectCompanyHierarchyId) {
      routes = routes.filter((route) =>
        route?.subsidiariesCompanyKey
          ? subsidiariesPermission[route.subsidiariesCompanyKey]
          : false,
      );
    } else {
      routes = routes.filter((route) => {
        if (route?.subsidiariesCompanyKey === 'companyHierarchy') {
          return isEnabledCompanyHierarchy && subsidiariesPermission[route.subsidiariesCompanyKey];
        }
        return true;
      });
    }

    return routes;

    // ignore permissions because verifyCompanyLevelPermissionByCode method with permissions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectCompanyHierarchyId, permissions, globalState, isEnabledCompanyHierarchy]);

  const activePath = (path: string) => {
    if (location.pathname === path) {
      B3SStorage.set('prevPath', path);
      return true;
    }

    if (location.pathname.includes('orderDetail')) {
      const gotoOrderPath =
        B3SStorage.get('prevPath') === '/company-orders' ? '/company-orders' : '/orders';
      if (path === gotoOrderPath) return true;
    }

    if (location.pathname.includes('shoppingList') && path === '/shoppingLists') {
      return true;
    }

    if (location.pathname.includes('/quoteDetail') || location.pathname.includes('/quoteDraft')) {
      if (path === '/quotes') return true;
    }

    return false;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        width: isMobile ? '90%' : '234px',
        maxWidth: isMobile ? '340px' : 'none',
        margin: isMobile ? '0 auto' : '10px 0 0 -13px',
        padding: '20px 8px 29px 8px',
        border: 'none',
        boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)'
      }}
    >
      <List
        sx={{
          width: '100%',
          maxWidth: isMobile ? '260px' : '280px',
          bgcolor: 'background.paper',
          color: primaryColor || 'info.main',
          borderRadius: '8px',
          padding: '4px 8px',
          '& .MuiListItem-root': {
            margin: '4px 0',
            '& .MuiButtonBase-root': {
              borderRadius: '8px',
              padding: '8px 10px',  /* Reduced from 10px to 6px */
              transition: 'all 0.2s ease-in-out',
              width: '100%',
              margin: '0 auto',
            },
            '& .MuiButtonBase-root.Mui-selected': {
              color: '#fff',
              bgcolor: 'primary.main',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            },
            '& .MuiButtonBase-root:hover:not(.Mui-selected)': {
              bgcolor: b3HexToRgb(primaryColor, 0.12),
            },
          },
        }}
        component="nav"
        aria-labelledby="nested-list-subheader"
      >
        {newRoutes.map((item) => {
          if (item.name === 'Quotes') {
            const { pathname } = location;
            return (
              <ListItem key={item.path} disablePadding>
                <Badge
                  badgeContent={
                    quoteDetailHasNewMessages && pathname.includes('quoteDetail') ? '' : 0
                  }
                  variant="dot"
                  sx={{
                    width: '100%',
                    '& .MuiBadge-badge.MuiBadge-dot': {
                      width: 8,
                      height: 8,
                      bgcolor: '#FFFFFF',
                      right: 14,
                      top: 22,
                    },
                  }}
                >
                  <ListItemButton onClick={() => handleClick(item)} selected={activePath(item.path)}>
                    {item.path === '/quotes' && (
                      <ListItemIcon sx={{
                        minWidth: '36px',
                        color: activePath(item.path) ? 'white' : undefined
                      }}>
                        <RequestQuoteOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={b3Lang(item.idLang)} />
                  </ListItemButton>
                </Badge>
              </ListItem>
            );
          }
          // Add divider after Company Orders
          return (

            <ListItem key={item.path} disablePadding>
              <ListItemButton onClick={() => handleClick(item)} selected={activePath(item.path)}>
                {item.path === '/purchased-products' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <ShoppingCartCheckoutOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/addresses' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <AddBusinessOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/user-management' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <PeopleAltOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/accountSettings' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <SettingsOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/insights' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <AssessmentOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/shoppingLists' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <FormatListBulletedOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/invoice' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <ReceiptOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/orders' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <ShopOutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}
                {item.path === '/company-orders' && (
                  <ListItemIcon sx={{
                    minWidth: '36px',
                    color: activePath(item.path) ? 'white' : undefined
                  }}>
                    <Shop2OutlinedIcon fontSize="medium" color={activePath(item.path) ? "inherit" : "primary"} />
                  </ListItemIcon>
                )}


                <ListItemText primary={b3Lang(item.idLang)} />
              </ListItemButton>
            </ListItem>


          );
        })}
      </List>
    </Paper>
  );
}