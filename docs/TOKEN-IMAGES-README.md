# Token Images Guide

## Directory
All token images are stored in `/public/tokens/`

## ✅ Available Images

The following token images are now available:

| Token | Filename | Status |
|-------|----------|--------|
| CORE | `core.svg` | ✅ Added |
| COZY | `cozy.svg` | ✅ Added |
| KONG | `kong.svg` | ✅ Added |
| MART | `mart.svg` | ✅ Added |
| XRP | `xrp.svg` / `xrp.png` | ✅ Added |
| ATOM | `atom.png` / `uatom.png` | ✅ Added |
| OSMO | `osmo.png` / `uosmo.png` | ✅ Added |
| CAT | `cat.svg` | ✅ Added |
| ROLL | `roll.svg` | ✅ Added |
| SMART | `smart.svg` | ✅ Added |
| SOLO | `solo.svg` | ✅ Added |
| SHLD | `shld_dark.svg` / `shld_light.svg` | ✅ Added |
| LP | `lp.svg` | ✅ Added |
| IBC | `ibc.svg` | ✅ Added |
| Default | `default.svg` | ✅ Added |

## Missing Images

| Token | Filename | Status |
|-------|----------|--------|
| AWKT | `awkt.svg` | ⏳ Needed (currently using default.svg) |

**Note:** 
- "DROP" is not a separate token - it's a prefix for XRP denoms (e.g., `drop-core1...`). XRP tokens use `/tokens/xrp.png`.
- ULP is mapped to `/tokens/lp.svg` (Universal Liquidity Pool token).

## Image Specifications

- **Format**: SVG preferred (PNG as fallback)
- **Size**: 48x48px minimum, scalable
- **Background**: Transparent
- **Colors**: Use brand colors for each token
- **Naming**: Lowercase, match the token symbol

## Where to Get Images

1. **Official Sources**:
   - Token project websites
   - Official brand guidelines
   - GitHub repositories

2. **Fallback**:
   - Create simple circular icons with first letter
   - Use brand color gradients
   - Ensure they match the app's design system

## Adding New Tokens

1. Add token metadata to `utils/coreum/token-registry.ts`
2. Add image to `public/tokens/{symbol}.svg`
3. Update this README with status

## Notes

- ULP = Universal Liquidity Pool token (DEX LP token)
- XRP is wrapped XRP on Coreum (uses 6 decimals, not 8)

