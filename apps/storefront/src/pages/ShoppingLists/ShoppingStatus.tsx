import { B3Tag } from '@/components';
import { rolePermissionSelector, useAppSelector } from '@/store';

import { useGetFilterShoppingListStatus } from './config';

export const useGetStatus = () => {
  const getFilterShoppingListStatus = useGetFilterShoppingListStatus();

  return (submitShoppingListPermission: boolean) => {
    const statusArr = getFilterShoppingListStatus(submitShoppingListPermission);

    const newStatus = statusArr.map((item) => {
      if (Number(item.value) === 0) {
        return {
          color: '#C4DD6C',
          textColor: 'black',
          ...item,
        };
      }

      if (Number(item.value) === 40) {
        return {
          color: '#F4CC46',
          textColor: 'black',
          ...item,
        };
      }

      if (Number(item.value) === 30) {
        return {
          color: '#899193',
          textColor: '#FFFFFF',
          ...item,
        };
      }
      return {
        color: '#7A6041',
        textColor: '#FFFFFF',
        ...item,
      };
    });

    return newStatus;
  };
};

interface ShoppingStatusProps {
  status: number | string;
}

export function ShoppingStatus({ status }: ShoppingStatusProps) {
  const { submitShoppingListPermission } = useAppSelector(rolePermissionSelector);
  const getStatus = useGetStatus();

  const statusList = getStatus(submitShoppingListPermission);
  const statusItem = statusList.find((item) => Number(item.value) === Number(status));

  if (statusItem) {
    return (
      <B3Tag color={statusItem.color} textColor={statusItem.textColor}>
        {statusItem.label}
      </B3Tag>
    );
  }

  return null;
}
