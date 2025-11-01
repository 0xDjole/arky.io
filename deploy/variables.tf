variable "ROOT_DOMAIN" {
  type        = string
  description = "Root domain for the website (e.g., arky.io)"
}

variable "CLOUDFLARE_API_TOKEN" {
  type        = string
  description = "Cloudflare API token with permissions for Pages and DNS"
  sensitive   = true
}

variable "CLOUDFLARE_ZONE_ID" {
  type        = string
  description = "Cloudflare Zone ID for the domain"
}

variable "CLOUDFLARE_ACCOUNT_ID" {
  type        = string
  description = "Cloudflare Account ID"
}

variable "GITHUB_OWNER" {
  type        = string
  description = "GitHub repository owner"
}

variable "GITHUB_REPO" {
  type        = string
  description = "GitHub repository name"
  default     = "arky.io"
}

variable "ARKY_TOKEN" {
  type        = string
  description = "Arky admin token for server-side rendering and build-time CMS content fetching"
  sensitive   = true
}
