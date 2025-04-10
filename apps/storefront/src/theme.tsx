import { ReactNode, useContext } from 'react';
import * as materialMultiLanguages from '@mui/material/locale';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { CustomStyleContext } from './shared/customStyleButton';
import { BROWSER_LANG } from './constants';

import { GlobalStyles } from '@mui/material';

type LangMapType = {
  [index: string]: string;
};

const MUI_LANG_MAP: LangMapType = {
  en: 'enUS',
  zh: 'zhCN',
  fr: 'frFR',
  nl: 'nlNL',
  de: 'deDE',
  it: 'itIT',
  es: 'esES',
};

type MaterialMultiLanguagesType = {
  [K: string]: materialMultiLanguages.Localization;
};

type Props = {
  children?: ReactNode;
};

function B3ThemeProvider({ children }: Props) {
  const {
    state: {
      portalStyle: { backgroundColor = '', primaryColor = '' },
    },
  } = useContext(CustomStyleContext);

  const theme = (lang: string) =>
    createTheme(
      {
        palette: {
          background: {
            default: backgroundColor,
          },
          primary: {
            main: primaryColor || '#1976d2',
          },
        },
      },
      (materialMultiLanguages as MaterialMultiLanguagesType)[MUI_LANG_MAP[lang] || 'enUS'],
    );

  return <ThemeProvider theme={theme(BROWSER_LANG)}>
    <GlobalStyles
      styles={{
        '.MuiChartsTooltip-root': {
          zIndex: 13000,
          pointerEvents: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(4px)',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          color: '#333',
          margin: '8px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          maxWidth: '280px'
        },
        '.MuiChartsTooltip-table': {
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 4px',
          lineHeight: 1.4,
        },
        '.MuiChartsTooltip-table thead th': {
          padding: '6px 8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#444',
          textAlign: 'left',
        },
        '.MuiChartsTooltip-markCell': {
          paddingRight: '0.5rem',
          width: '16px',
          verticalAlign: 'middle',
        },

        '.MuiChartsTooltip-cell': {
          padding: '1px 0',
          verticalAlign: 'middle',
        },
        '.MuiChartsTooltip-valueCell': {

          fontWeight: 500,
          textAlign: 'right',
          paddingLeft: '1rem',
        },
      }}
    />

    {children}</ThemeProvider>;
}

export default B3ThemeProvider;
