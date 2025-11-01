# Arky.io Website

Official website for Arky, deployed at [arky.io](https://arky.io).

## Tech Stack

- **Framework**: [Astro 5.14.5](https://astro.build) with static output
- **UI Components**: [Svelte 5.28.2](https://svelte.dev) islands architecture
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) via @tailwindcss/vite
- **Deployment**: Cloudflare Pages
- **Infrastructure**: Terraform (Infrastructure as Code)
- **CI/CD**: GitHub Actions

## Features

- Multi-language support (English, French)
- E-commerce integration with Stripe
- Reservation/booking system
- Dynamic CMS content via Arky SDK
- Optimized for performance and SEO
- Award-winning design principles (see [CLAUDE.md](./CLAUDE.md))

## Local Development

### Prerequisites

- Node.js (v18 or later)
- npm or pnpm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`:
   ```
   PUBLIC_ENVIRONMENT=dev
   ARKY_TOKEN=your-arky-admin-token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:4322](http://localhost:4322) in your browser

### Available Commands

```bash
npm run dev          # Start dev server (localhost:4322)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Environment Configuration

The website uses environment-based configuration files:

- `config/dev.json` - Development environment
- `config/prod.json` - Production environment

Configuration is selected via the `PUBLIC_ENVIRONMENT` environment variable.

### Development Config
```json
{
  "environment": "dev",
  "apiUrl": "http://localhost:8000",
  "storageUrl": "https://storage.arky.io/dev",
  "siteUrl": "http://localhost:4322",
  "businessId": "4429b3d1-e12f-43d4-8232-62da8ae3da85"
}
```

### Production Config
```json
{
  "environment": "prod",
  "apiUrl": "https://api.arky.io",
  "storageUrl": "https://storage.arky.io/prod",
  "siteUrl": "https://arky.io",
  "businessId": "4429b3d1-e12f-43d4-8232-62da8ae3da85"
}
```

## Deployment

### Infrastructure as Code

The website infrastructure is managed with Terraform in the `deploy/` directory.

### Prerequisites for Deployment

1. Cloudflare account with:
   - Domain configured (arky.io)
   - API token with Pages and DNS permissions
   - Account ID and Zone ID

2. GitHub repository with required secrets (see below)

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ROOT_DOMAIN` | Your domain name | `arky.io` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `your-api-token` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | `your-account-id` |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID for your domain | `your-zone-id` |
| `ARKY_TOKEN` | Arky admin token for production | `arky_prod_admin_token` |

### How to Get Cloudflare Credentials

1. **API Token**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to My Profile → API Tokens
   - Create token with "Edit Cloudflare Workers" and "Zone.DNS Edit" permissions

2. **Account ID**:
   - Go to Cloudflare Dashboard
   - Select your domain
   - Account ID is shown in the right sidebar

3. **Zone ID**:
   - Go to Cloudflare Dashboard
   - Select your domain
   - Zone ID is shown in the right sidebar under "API" section

### Deployment Process

The deployment is fully automated via GitHub Actions:

1. Push code to the `master` branch
2. GitHub Actions workflow triggers automatically
3. Terraform applies infrastructure changes
4. Cloudflare Pages builds and deploys the site
5. Site is live at [arky.io](https://arky.io)

### Manual Terraform Deployment

If you need to run Terraform manually:

1. Navigate to the deploy directory:
   ```bash
   cd deploy
   ```

2. Create `terraform.tfvars` from the template:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Fill in your actual values in `terraform.tfvars`

4. Initialize Terraform:
   ```bash
   terraform init
   ```

5. Plan the changes:
   ```bash
   terraform plan
   ```

6. Apply the changes:
   ```bash
   terraform apply
   ```

**⚠️ IMPORTANT**: Never commit `terraform.tfvars` to git! It contains sensitive credentials.

## Infrastructure Details

### Cloudflare Pages Configuration

- **Project Name**: arky-website
- **Production Branch**: master
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Deployment**: Automatic on push to master

### DNS Configuration

- `arky.io` → CNAME to `arky-website.pages.dev`
- `www.arky.io` → CNAME to `arky.io`
- Both proxied through Cloudflare CDN

### Environment Variables (Production)

Automatically set by Terraform:
- `PUBLIC_ENVIRONMENT=prod`
- `ARKY_TOKEN=[from GitHub Secret]`

## Security

### Sensitive Files (Never Commit)

The following files are excluded via `.gitignore`:

- `.env` - Local environment variables
- `deploy/terraform.tfvars` - Terraform variables with credentials
- `deploy/terraform.tfstate` - Terraform state file
- `deploy/.terraform/` - Terraform working directory

### Best Practices

1. Always use GitHub Secrets for credentials in CI/CD
2. Rotate API tokens regularly
3. Use environment-specific tokens (dev vs prod)
4. Review `.gitignore` before committing new files
5. Never hardcode credentials in source code

## Project Structure

```
arky.io/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Route definitions (with i18n)
│   ├── lib/            # Business logic and utilities
│   │   ├── core/       # API services
│   │   ├── Reservation/# Booking functionality
│   │   ├── EShop/      # E-commerce features
│   │   └── i18n/       # Internationalization
│   ├── assets/         # Images and videos
│   └── styles/         # Global styles
├── config/             # Environment configurations
│   ├── dev.json        # Development config
│   └── prod.json       # Production config
├── deploy/             # Terraform infrastructure
│   ├── main.tf         # Main infrastructure definition
│   ├── variables.tf    # Variable declarations
│   ├── providers.tf    # Provider configuration
│   ├── terraform.tf    # Backend configuration
│   └── terraform.tfvars.example  # Template for variables
├── .github/
│   └── workflows/
│       └── terraform_apply.yaml  # CI/CD workflow
├── public/             # Static assets
├── astro.config.mjs    # Astro configuration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Design Principles

This website follows award-winning design principles. See [CLAUDE.md](./CLAUDE.md) for:

- Performance optimization guidelines
- Accessibility requirements (WCAG AAA)
- Animation and interaction patterns
- Typography and spacing systems
- Color and contrast standards

## Related Services

- **API**: [api.arky.io](https://api.arky.io) - Backend API
- **Admin**: [admin.arky.io](https://admin.arky.io) - Admin dashboard
- **Storage**: Cloudflare R2 (via storage.arky.io)

## Troubleshooting

### Build Fails on Cloudflare Pages

1. Check that all environment variables are set correctly
2. Verify `ARKY_TOKEN` is valid for production
3. Check the build logs in Cloudflare Pages dashboard

### Terraform Apply Fails

1. Verify all required secrets are set in GitHub
2. Check Cloudflare API token permissions
3. Ensure Zone ID matches the domain

### Local Development Issues

1. Clear `.astro` cache: `rm -rf .astro`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check `.env` file has correct values

## Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Test locally with `npm run dev`
4. Submit a pull request

Preview deployments are automatically created for pull requests.

## License

Copyright © 2025 Arky. All rights reserved.

## Support

For issues or questions:
- Open an issue in this repository
- Contact the development team

---

**Built with ❤️ using Astro + Svelte + Tailwind CSS**
