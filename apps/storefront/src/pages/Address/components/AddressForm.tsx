import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Checkbox, FormControlLabel, styled } from '@mui/material';
import cloneDeep from 'lodash-es/cloneDeep';

import { B3CustomForm } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import {
  createB2BAddress,
  createBcAddress,
  updateB2BAddress,
  updateBcAddress,
  validateAddressExtraFields,
} from '@/shared/service/b2b';
import { snackbar } from '@/utils';

import { AddressItemType } from '../../../types/address';
import { deCodeField } from '../../Registered/config';
import { b2bShippingBilling, B2bShippingBillingProps } from '../shared/config';
import { CountryProps, StateProps } from '../shared/getAddressFields';

interface AddressFormProps {
  addressFields: CustomFieldItems[];
  updateAddressList: (isFirst?: boolean) => void;
  companyId: string | number;
  isBCPermission: boolean;
  countries: CountryProps[];
}

interface ShippingBillingProps {
  isShipping: boolean;
  isBilling: boolean;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  [key: string]: boolean;
}

const StyledCheckbox = styled('div')(() => ({
  display: 'flex',

  '& div::first-of-type': {
    marginRight: '2rem',
  },

  '& div': {
    minWidth: '45%',
    display: 'flex',
    flexDirection: 'column',
  },
}));

function AddressForm(
  { addressFields, updateAddressList, companyId, isBCPermission, countries }: AddressFormProps,
  ref: Ref<unknown> | undefined,
) {
  const b3Lang = useB3Lang();
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [addUpdateLoading, setAddUpdateLoading] = useState<boolean>(false);
  const [allAddressFields, setAllAddressFields] = useState<CustomFieldItems[]>(addressFields);
  const [addressExtraFields, setAddressExtraFields] = useState<CustomFieldItems>([]);
  const [originAddressFields, setOriginAddressFields] = useState<CustomFieldItems>([]);
  const [addressData, setAddressData] = useState<AddressItemType | null>(null);
  const [shippingBilling, setShippingBilling] = useState<ShippingBillingProps>({
    isShipping: false,
    isBilling: false,
    isDefaultShipping: false,
    isDefaultBilling: false,
  });

  const isB2BUser = !isBCPermission;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    watch,
    setError,
    setValue,
    reset,
  } = useForm({
    mode: 'all',
  });

  const validateCompanyExtraFieldsUnique = async (data: CustomFieldItems) => {
    try {
      const extraFields = addressExtraFields.map((field: CustomFieldItems) => ({
        fieldName: deCodeField(field.name),
        fieldValue: data[field.name] || field.default,
      }));

      const res = await validateAddressExtraFields({
        extraFields,
      });

      if (res.code !== 200) {
        const message = res.data?.errMsg || res.message || '';

        const messageArr = message.split(':');

        if (messageArr.length >= 2) {
          const field = addressExtraFields.find(
            (field: CustomFieldItems) => deCodeField(field.name) === messageArr[0],
          );
          if (field) {
            setError(field.name, {
              type: 'manual',
              message: messageArr[1],
            });
            setAddUpdateLoading(false);
            return false;
          }
        }
        throw message;
      }

      return true;
    } catch (error: any) {
      snackbar.error(error);
      throw error;
    }
  };

  const handleCancelClick = () => {
    reset();
    setShippingBilling({
      isShipping: false,
      isBilling: false,
      isDefaultShipping: false,
      isDefaultBilling: false,
    });
    setOpen(false);
    setType('');
  };

  const handleSaveB2BAddress = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true);

      try {
        const isValidate = await validateCompanyExtraFieldsUnique(data);
        if (!isValidate) {
          return;
        }

        const extraFields = addressExtraFields.map((field: CustomFieldItems) => ({
          fieldName: deCodeField(field.name),
          fieldValue: data[field.name] || field.default,
        }));
        const { country: currentCountryCode, state: stateCode } = data;

        let currentCountryName = '';
        let currentStateName = '';
        let currentStateCode = stateCode;

        countries.forEach((country: CountryProps) => {
          const { countryName, countryCode, states } = country;
          if (countryCode === currentCountryCode) {
            currentCountryName = countryName;

            if (states.length > 0) {
              const state = states.find(
                (item: StateProps) =>
                  item.stateCode === currentStateCode || item.stateName === currentStateCode,
              );

              currentStateName = state?.stateName || currentStateName;
              currentStateCode = state?.stateCode || currentStateCode;
            } else {
              currentStateCode = '';
              currentStateName = stateCode;
            }
          }
        });

        const params = {
          ...data,
          companyId: Number(companyId),
          extraFields,
          isShipping: shippingBilling.isShipping ? 1 : 0,
          isBilling: shippingBilling.isBilling ? 1 : 0,
          isDefaultShipping: shippingBilling.isDefaultShipping ? 1 : 0,
          isDefaultBilling: shippingBilling.isDefaultBilling ? 1 : 0,
          country: currentCountryName,
          countryCode: currentCountryCode,
          state: currentStateName,
          stateCode: currentStateCode,
        };

        if (type === 'add') {
          await createB2BAddress(params);
          snackbar.success(b3Lang('addresses.addressForm.newAddressAdded'));
        } else if (type === 'edit' && addressData) {
          const { id } = addressData;

          await updateB2BAddress({
            ...params,
            id: Number(id),
          });

          snackbar.success(b3Lang('addresses.addressForm.addressUpdated'));
        }
        setShippingBilling({
          isShipping: false,
          isBilling: false,
          isDefaultShipping: false,
          isDefaultBilling: false,
        });
        setOpen(false);

        await updateAddressList(true);
      } catch (err: any) {
        snackbar.error(err);
      } finally {
        setAddUpdateLoading(false);
      }
    })();
  };

  const handleSaveBcAddress = () => {
    handleSubmit(async (data) => {
      setAddUpdateLoading(true);

      try {
        const extraFields = addressExtraFields.map((field: CustomFieldItems) => ({
          name: field.bcLabel,
          value: data[field.name] || field.default,
        }));

        const { country: currentCountryCode, state: stateCode } = data;

        let currentCountryName = '';
        let currentStateName = '';
        let currentStateCode = stateCode;

        countries.forEach((country: CountryProps) => {
          const { countryName, countryCode, states } = country;
          if (countryCode === currentCountryCode) {
            currentCountryName = countryName;

            if (states.length > 0) {
              const state = states.find(
                (item: StateProps) =>
                  item.stateCode === currentStateCode || item.stateName === currentStateCode,
              );

              currentStateName = state?.stateName || currentStateName;
              currentStateCode = state?.stateCode || currentStateCode;
            } else {
              currentStateCode = '';
              currentStateName = stateCode;
            }
          }
        });

        const params = {
          ...data,
          formFields: extraFields,
          country: currentCountryName,
          countryCode: currentCountryCode,
          state: currentStateName,
          stateCode: currentStateCode,
          addressType: '',
        };

        if (type === 'add') {
          await createBcAddress(params);
          snackbar.success(b3Lang('addresses.addressForm.newAddressAdded'));
        } else if (type === 'edit' && addressData) {
          const { bcAddressId } = addressData;

          if (bcAddressId) {
            await updateBcAddress({
              ...params,
              id: Number(bcAddressId),
            });
          }
          snackbar.success(b3Lang('addresses.addressForm.addressUpdated'));
        }
        setOpen(false);

        await updateAddressList(true);
      } catch (err: any) {
        snackbar.error(err);
      } finally {
        setAddUpdateLoading(false);
      }
    })();
  };

  const handleSaveAddress = () => {
    if (isB2BUser) {
      handleSaveB2BAddress();
    } else {
      handleSaveBcAddress();
    }
  };

  const handleOpenAddEditAddressClick = (type: string, data: AddressItemType) => {
    if (type === 'add' && originAddressFields.length > 0) {
      allAddressFields.forEach((field: CustomFieldItems) => {
        const addressField = field;
        if (field.custom) {
          if (isB2BUser) {
            const originFields = originAddressFields.filter(
              (item: CustomFieldItems) => item.name === field.name,
            )[0];
            addressField.default = originFields.default || '';
          } else {
            const originFields = originAddressFields.filter(
              (item: CustomFieldItems) =>
                item.name === field.name || item.bcLabel === field.bcLabel,
            )[0];
            addressField.default = originFields.default || '';
          }
        }
      });
    }

    reset();
    setAddressData(data);
    setType(type);
    setOpen(true);
    setIsInitialized(false);
  };

  useImperativeHandle(ref, () => ({
    handleOpenAddEditAddressClick,
  }));

  const handleChangeAddressType = (check: boolean, name: string) => {
    if (name === 'isShipping') {
      setShippingBilling({
        ...shippingBilling,
        [name]: check,
        isDefaultShipping: false,
      });
    } else {
      setShippingBilling({
        ...shippingBilling,
        [name]: check,
        isDefaultBilling: false,
      });
    }
  };

  useEffect(() => {
    const translatedAddressFields = JSON.parse(JSON.stringify(addressFields));

    translatedAddressFields.forEach(
      (element: { label: string; idLang: string; fieldId: string; default: string }) => {
        const translatedFieldElement = element;
        translatedFieldElement.label = b3Lang(element.idLang) || element.label;

        if (!isB2BUser && element.fieldId === 'field_21') {
          translatedFieldElement.default = '';
        }

        return element;
      },
    );

    setAllAddressFields(translatedAddressFields);
    const extraFields = addressFields.filter((field: CustomFieldItems) => field.custom);

    setAddressExtraFields(extraFields);

    if (originAddressFields.length === 0) {
      const fields = cloneDeep(addressFields);
      setOriginAddressFields(fields);
    }
    // disabling due to errors withing b3Lang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressFields, originAddressFields.length, isB2BUser]);

  const handleBackFillData = useCallback(() => {
    if (addressData) {
      const {
        isShipping,
        isBilling,
        isDefaultShipping,
        isDefaultBilling,
        state,
        stateCode,
        countryCode,
        extraFields,
      } = addressData;

      const currentCountry = countries.filter(
        (country: CountryProps) => country.countryCode === countryCode,
      );

      setShippingBilling({
        isShipping: isShipping === 1,
        isBilling: isBilling === 1,
        isDefaultShipping: isDefaultShipping === 1,
        isDefaultBilling: isDefaultBilling === 1,
      });

      allAddressFields.forEach((currentField: CustomFieldItems) => {
        const field = currentField;
        if (field.custom && extraFields.length > 0) {
          if (isB2BUser) {
            const name = deCodeField(field.name);
            const currentExtraField = extraFields.find(
              (item: CustomFieldItems) => item.fieldName === name,
            );

            const originFields = originAddressFields.find(
              (item: CustomFieldItems) => item.name === name,
            );

            if (currentExtraField) {
              setValue(field.name, currentExtraField.fieldValue || '');

              field.default = currentExtraField.fieldValue || '';
            } else {
              setValue(field.name, '');
              field.default = originFields.default;
            }
          } else {
            const currentExtraField = extraFields.find(
              (item: CustomFieldItems) =>
                item.fieldName === field.name || item.fieldName === field.bcLabel,
            );

            const originFields = originAddressFields.filter(
              (item: CustomFieldItems) =>
                item.name === field.name || item.bcLabel === field.bcLabel,
            )[0];

            if (currentExtraField) {
              setValue(field.name, currentExtraField.fieldValue || '');

              field.default = currentExtraField.fieldValue || originFields.default;
            } else {
              setValue(field.name, '');
              field.default = originFields.default;
            }
          }
        } else if (field.name === 'country') {
          setValue(field.name, countryCode);
        } else if (field.name === 'state') {
          setValue(field.name, stateCode || state);
          if (currentCountry[0]) {
            const { states } = currentCountry[0];

            if (states.length > 0) {
              field.options = states;
              field.fieldType = 'dropdown';
              field.required = true;
            } else {
              field.options = [];
              field.fieldType = 'text';
              field.required = false;
            }
          }
        } else {
          setValue(
            field.name,
            addressData[field.name] === 'undefined' ? '' : addressData[field.name],
          );
        }
      });
    }
  }, [addressData, countries, isB2BUser, originAddressFields, setValue, allAddressFields]);

  useEffect(() => {
    if (open && type === 'edit' && addressData && !isInitialized) {
      handleBackFillData();
      setIsInitialized(true);
    }
  }, [open, type, addressData, isInitialized, handleBackFillData]);

  useEffect(() => {
    const handleCountryChange = (countryCode: string) => {
      const stateList =
        countries.find((country: CountryProps) => country.countryCode === countryCode)?.states ||
        [];
      const stateFields = allAddressFields.find(
        (formFields: CustomFieldItems) => formFields.name === 'state',
      );

      if (stateFields) {
        if (stateList.length > 0) {
          stateFields.fieldType = 'dropdown';
          stateFields.options = stateList;
          stateFields.required = true;
        } else {
          stateFields.fieldType = 'text';
          stateFields.options = [];
          stateFields.required = false;
        }
      }

      setValue('state', '');

      setAllAddressFields([...allAddressFields]);
    };

    const subscription = watch((value, { name, type }) => {
      const { country } = value;

      if (name === 'country' && type === 'change') {
        handleCountryChange(country);
      }
    });
    return () => subscription.unsubscribe();
    // disabling the next eslint rule
    // setValue -> not needed as is a dispatcher
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAddressFields, countries, watch]);

  return (
    <B3Dialog
      isOpen={open}
      title={
        type === 'add'
          ? b3Lang('addresses.addressForm.addNewAddress')
          : b3Lang('addresses.addressForm.editAddress')
      }
      leftSizeBtn={b3Lang('addresses.addressForm.cancel')}
      rightSizeBtn={b3Lang('addresses.addressForm.saveAddress')}
      handleLeftClick={handleCancelClick}
      handRightClick={handleSaveAddress}
      loading={addUpdateLoading}
      isShowBordered
    >
      {isB2BUser && (
        <>
          <p>{b3Lang('addresses.addressForm.selectAddressType')}</p>

          <StyledCheckbox>
            {b2bShippingBilling.map((item: B2bShippingBillingProps) => {
              const { child, name, idLang } = item;

              return (
                <div key={name}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shippingBilling[name]}
                        onChange={(e) => {
                          handleChangeAddressType(e.target.checked, name);
                        }}
                      />
                    }
                    label={b3Lang(idLang)}
                  />
                  {child && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={shippingBilling[child.name]}
                          onChange={() => {
                            setShippingBilling({
                              ...shippingBilling,
                              [child.name]: !shippingBilling[child.name],
                            });
                          }}
                        />
                      }
                      label={b3Lang(child.idLang)}
                      sx={{
                        display: shippingBilling[name] ? '' : 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </StyledCheckbox>
        </>
      )}
      <B3CustomForm
        formFields={allAddressFields}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />
    </B3Dialog>
  );
}

const B3AddressForm = forwardRef(AddressForm);

export default B3AddressForm;
