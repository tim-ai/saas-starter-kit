module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    'node_modules/daisyui/dist/**/*.js',
    'node_modules/react-daisyui/dist/**/*.js',
  ],
  daisyui: {
    themes: ['corporate', 'black'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  theme: {
    extend: {
      fontSize: {
        xs: '16px',
        sm: '18px',
        base: '20px',
        lg: '24px',
        xl: '28px',
      },
      colors: {
        primary: '#1DA1F2',
        secondary: '#14171A',
        accent: '#657786',
        neutral: '#F5F8FA',
        'base-100': '#FFFFFF',
        info: '#3ABFF8',
        success: '#36D399',
        warning: '#FBBD23',
        error: '#F87272',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.secondary'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.primary'),
              },
            },
          },
        },
      }),
    },
  },
};
