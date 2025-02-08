terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
      version = "~> 0.4" # Or latest version
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

resource "vercel_project" "nextjs_project" {
  name = "Chittchat" 
  framework = "nextjs"
}