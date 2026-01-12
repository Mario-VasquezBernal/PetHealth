import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e3f9e5',
      100: '#c1eac5',
      200: '#a3d9a5',
      300: '#7bc47f',
      400: '#57ae5b',
      500: '#3e9142', // Color principal
      600: '#2f8132',
      700: '#207227',
      800: '#0e5814',
      900: '#05400a',
    },
    accent: {
      50: '#fff5e5',
      100: '#ffe5b8',
      200: '#ffd68a',
      300: '#ffc55c',
      400: '#ffb72e',
      500: '#ffa500', // Naranja
      600: '#e69500',
      700: '#cc8400',
      800: '#b37300',
      900: '#996300',
    }
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          borderRadius: 'xl',
          fontWeight: '600',
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '2xl',
          boxShadow: 'lg',
        }
      }
    }
  }
})

export default theme
