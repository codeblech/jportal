# JPortal Community Themes

The directory `/jportal/public/user-configs` contains user-contributed themes for JPortal. Users can create and share their custom themes by following the naming conventions and format specified below.

## Naming Conventions

### Single Theme Files

For files containing only one theme:

```
yourname-jportal-theme.config
```

### Multiple Theme Files

For files containing multiple themes:

```
yourname-jportal-themes.config
```

### Rules:

- Use only lowercase letters, numbers, hyphens, and underscores
- Your name/username should be the prefix
- Must end with `-jportal-theme.config` (single) or `-jportal-themes.config` (multiple)
- No spaces or special characters allowed

## Theme Format

Each theme should follow this format:

```
[THEME Theme Name]
BG_COLOR=#background_color
PRIMARY_COLOR=#primary_color
ACCENT_COLOR=#accent_color
TEXT_COLOR=#text_color
CARD_BG=#card_background_color
LABEL_COLOR=#label_color
```

### Required Color Variables:

- `BG_COLOR`: Main background color
- `PRIMARY_COLOR`: Primary UI element color
- `ACCENT_COLOR`: Accent/highlight color
- `TEXT_COLOR`: Main text color
- `CARD_BG`: Card/component background color
- `LABEL_COLOR`: Secondary text/label color

### Example Theme:

```
[THEME Dark Blue]
BG_COLOR=#141c23
PRIMARY_COLOR=#1a1a2e
ACCENT_COLOR=#0ea5e9
TEXT_COLOR=#eaf6fb
CARD_BG=#1a1a2e
LABEL_COLOR=#94a3b8
```

## How to Contribute

1. Create a new `.config` file following the naming convention
2. Add your themes using the format above
3. Submit a pull request to add your file to this directory
4. Your themes will automatically appear in the Community tab of the theme switcher

## Current Contributors

- **![taf](https://github.com/tashifkhan)**: Traumatic Pink, Yolo Orange

## Validation

Themes are automatically validated when loaded:

- Filename must match the naming convention
- All required color variables must be present
- Colors must be valid hex values
- Theme names should be descriptive and unique
