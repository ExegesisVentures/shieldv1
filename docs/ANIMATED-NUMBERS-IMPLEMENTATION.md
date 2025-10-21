# Animated Rolling Numbers Implementation

## Overview

This document describes the implementation of animated rolling numbers throughout the ShieldV2 application, similar to the coreumdash project. Numbers now smoothly animate when they change, creating a more engaging and dynamic user experience.

## Implementation

### Core Component: `AnimatedNumber`

**Location:** `/components/ui/AnimatedNumber.tsx`

The `AnimatedNumber` component provides a flexible, reusable way to display animated numbers throughout the application.

#### Features

- **Rolling digit animation**: Numbers roll through digits like an odometer when values change
- **Smooth easing**: Uses cubic easing for natural-looking animations
- **Multiple formats**: Supports currency, percentage, decimal, and integer formats
- **Customizable**: Duration, decimals, prefix/suffix all configurable
- **Performance optimized**: Uses `requestAnimationFrame` for smooth 60fps animations
- **No external dependencies**: Built with React hooks and vanilla CSS

#### Usage Examples

```tsx
import AnimatedNumber, { AnimatedCurrency, AnimatedPercentage, AnimatedBalance, AnimatedInteger } from '@/components/ui/AnimatedNumber';

// Currency (with $ prefix)
<AnimatedCurrency value={1234.56} decimals={2} />
// Output: $1,234.56 (animated)

// Percentage (with % suffix and + for positive)
<AnimatedPercentage value={12.34} decimals={2} showPlusSign={true} />
// Output: +12.34% (animated)

// Balance (formatted number)
<AnimatedBalance value={1234.5678} decimals={4} />
// Output: 1,234.5678 (animated)

// Integer (no decimals)
<AnimatedInteger value={42} />
// Output: 42 (animated)

// Custom formatting
<AnimatedNumber
  value={1234.56}
  format="custom"
  formatter={(val) => `Custom: ${val.toFixed(2)}`}
  duration={1000}
/>
```

### Components Updated

The following components now use animated numbers:

#### Portfolio Components

1. **PortfolioTotals** (`/components/portfolio/PortfolioTotals.tsx`)
   - Total portfolio value (multi-currency support)
   - Total rewards earned
   - Per-wallet reward breakdown

2. **TokenTable** (`/components/portfolio/TokenTable.tsx`)
   - Token values (USD)
   - 24h change percentages

3. **CoreumBreakdown** (`/components/portfolio/CoreumBreakdown.tsx`)
   - CORE price
   - 24h price change percentage

4. **CollapsibleWalletCard** (`/components/portfolio/CollapsibleWalletCard.tsx`)
   - Wallet count

5. **NftHoldings** (`/components/portfolio/NftHoldings.tsx`)
   - NFT values
   - 24h and 30d change percentages

#### Liquidity Components

6. **PoolsTable** (`/components/liquidity/PoolsTable.tsx`)
   - Total Value Locked (TVL)
   - 24h trading volume
   - 24h fees earned

#### Swap Components

7. **SwapInterface** (`/components/swap/SwapInterface.tsx`)
   - Minimum received amount
   - Savings percentage compared to other DEXs

#### Membership Components

8. **ShieldNftPanel** (`/components/membership/ShieldNftPanel.tsx`)
   - Shield NFT estimated value

## Animation Behavior

### Trigger Conditions

Animations trigger when:
- Value prop changes (different number)
- Component receives new data from API
- User actions update displayed values

### Animation Details

- **Duration**: 800ms default (600ms for integers)
- **Easing**: Cubic ease-out for smooth deceleration
- **Visual effect**: Digits roll from old to new value
- **State indication**: Subtle pulse effect during animation

### Performance Considerations

- Animations use `requestAnimationFrame` for optimal performance
- Previous values are cached to prevent unnecessary re-renders
- Animation cleanup on component unmount
- No layout shifts or reflows during animation

## Styling

### CSS Animations

The component includes inline CSS for:
- `@keyframes roll`: Main rolling animation for digits
- `@keyframes pulse-subtle`: Subtle pulse during value changes

### Customization

You can customize animations by:
1. Adjusting `duration` prop (in milliseconds)
2. Modifying the easing function in the component
3. Changing the CSS keyframes for different effects

## Benefits

1. **Enhanced UX**: More engaging and professional interface
2. **Visual Feedback**: Users clearly see when values update
3. **Data Freshness**: Animated changes indicate live data
4. **Professional Polish**: Matches modern fintech applications
5. **Accessibility**: Maintains readability during animations

## Browser Compatibility

- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Graceful degradation**: Falls back to instant updates if animations unsupported
- **Mobile support**: Optimized for touch devices

## Future Enhancements

Potential improvements:
- Add color transitions for positive/negative value changes
- Implement different animation styles (slide, fade, etc.)
- Add optional sound effects for large value changes
- Support for animated sparklines/charts
- Configurable animation presets (slow/medium/fast)

## Testing

To test the animated numbers:
1. Connect wallet(s) to the dashboard
2. Refresh prices using the refresh button
3. Observe smooth number transitions
4. Check 24h change percentages update smoothly
5. Verify wallet count animates when adding/removing wallets

## Code Quality

- ✅ TypeScript strict mode
- ✅ No linter errors
- ✅ Builds successfully
- ✅ React best practices
- ✅ Performance optimized
- ✅ Accessible markup

## Related Files

- `/components/ui/AnimatedNumber.tsx` - Main component
- `/components/portfolio/PortfolioTotals.tsx` - Portfolio values
- `/components/portfolio/TokenTable.tsx` - Token table
- `/components/portfolio/CoreumBreakdown.tsx` - CORE breakdown
- `/components/portfolio/CollapsibleWalletCard.tsx` - Wallet card
- `/components/portfolio/NftHoldings.tsx` - NFT holdings
- `/components/liquidity/PoolsTable.tsx` - Liquidity pools
- `/components/swap/SwapInterface.tsx` - Swap interface
- `/components/membership/ShieldNftPanel.tsx` - Shield NFT

## Summary

All numerical displays throughout the ShieldV2 application now feature smooth, rolling animations similar to coreumdash. This provides users with a more dynamic and engaging experience while maintaining excellent performance and accessibility.

