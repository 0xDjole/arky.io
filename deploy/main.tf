resource "cloudflare_pages_project" "arky_website" {
  account_id        = var.CLOUDFLARE_ACCOUNT_ID
  name              = "arky-website"
  production_branch = "master"

  build_config {
    build_command   = "npm run build"
    destination_dir = "dist"
  }

  source {
    type = "github"
    config {
      owner                         = var.GITHUB_OWNER
      repo_name                     = var.GITHUB_REPO
      production_branch             = "master"
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
      preview_branch_includes       = ["*"]
    }
  }

  deployment_configs {
    production {
      environment_variables = {
        PUBLIC_ENVIRONMENT = "prod"
        ARKY_TOKEN         = var.ARKY_TOKEN
      }
    }
  }
}

resource "cloudflare_pages_domain" "arky_website_domain" {
  account_id   = var.CLOUDFLARE_ACCOUNT_ID
  project_name = cloudflare_pages_project.arky_website.name
  domain       = var.ROOT_DOMAIN
}

resource "cloudflare_record" "arky_website_domain" {
  zone_id = var.CLOUDFLARE_ZONE_ID
  name    = "@"
  content = "${cloudflare_pages_project.arky_website.name}.pages.dev"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

resource "cloudflare_record" "arky_website_www_cname" {
  zone_id = var.CLOUDFLARE_ZONE_ID
  name    = "www"
  content = var.ROOT_DOMAIN
  type    = "CNAME"
  ttl     = 1
  proxied = true
}
