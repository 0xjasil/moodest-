# Deployment Guide - Moryella Frontend

## Platform Overview

**Current Status**: Frontend 95% complete (24 pages, 0 TypeScript errors)  
**Build Size**: ~107 kB First Load JS  
**Framework**: Next.js 14.2.5  
**Language**: TypeScript  
**Styling**: Tailwind CSS

## Pre-Deployment Checklist

### Code Quality
- [ ] 0 TypeScript errors
- [ ] 0 console warnings in production build
- [ ] All tests passing
- [ ] ESLint configured and passing
- [ ] No console.log statements in production code

### Environment Variables
- [ ] `.env.local` configured locally
- [ ] `.env.production` ready for production
- [ ] NEXT_PUBLIC_API_URL set correctly
- [ ] NEXT_PUBLIC_RAZORPAY_KEY_ID set correctly
- [ ] No sensitive data in .env

### Backend Integration
- [ ] All API endpoints documented (see lib/api.ts)
- [ ] CORS configured on backend
- [ ] JWT token validation working
- [ ] Auto-refresh mechanism tested
- [ ] Error handling in place

### Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSP (Content Security Policy) set
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### Performance
- [ ] Image optimization enabled
- [ ] Code splitting verified
- [ ] Bundle analyzed
- [ ] Lazy loading working
- [ ] CDN configured
- [ ] Caching headers set

## Deployment Platforms

### Option 1: Vercel (Recommended)
**Easiest for Next.js**

#### Steps
1. Push code to GitHub
2. Connect GitHub to Vercel
3. Set environment variables
4. Deploy

#### Configuration
```bash
# vercel.json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.moryella.com",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID": "@razorpay_key"
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

#### Deploy Command
```bash
npm i -g vercel
vercel --prod
```

### Option 2: AWS (Amplify or EC2)
**For enterprise deployments**

#### AWS Amplify
```bash
npm install -g @aws-amplify/cli
amplify init
amplify hosting add
amplify publish
```

#### AWS EC2
```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone and setup
git clone <repo>
cd moryella-frontend
npm install
npm run build

# 4. Use PM2 for process management
npm install -g pm2
pm2 start "npm run start" --name moryella
pm2 save
pm2 startup

# 5. Setup Nginx as reverse proxy
sudo apt install nginx
# Configure /etc/nginx/sites-available/default

# 6. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d moryella.com
```

### Option 3: Docker & Kubernetes
**For container orchestration**

#### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .next ./.next
COPY public ./public
COPY next.config.js ./

EXPOSE 3000

CMD ["npm", "run", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY}
    depends_on:
      - api
  
  api:
    build: ../backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://...
      - JWT_SECRET=${JWT_SECRET}
```

#### Deploy
```bash
docker-compose up -d
```

### Option 4: Google Cloud Run
**Serverless deployment**

```bash
# 1. Create Dockerfile (as above)

# 2. Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/moryella-frontend

# 3. Deploy
gcloud run deploy moryella-frontend \
  --image gcr.io/PROJECT-ID/moryella-frontend \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_API_URL=https://api.moryella.com
```

## Environment Configuration

### Development (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

### Production (.env.production)
```
NEXT_PUBLIC_API_URL=https://api.moryella.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
NODE_ENV=production
```

### Staging (.env.staging)
```
NEXT_PUBLIC_API_URL=https://api-staging.moryella.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

## Build & Deployment Commands

### Production Build
```bash
# Install dependencies
npm install

# Build
npm run build

# Export for static hosting (if using Vercel, skip this)
npm run export

# Start production server
npm run start
```

### Build Size Analysis
```bash
npm run analyze
# Shows bundle size breakdown
```

### Test Before Deployment
```bash
# Run all checks
npm run build
npm run lint
npm test

# Manual testing
npm run dev
# Visit http://localhost:3000
```

## CI/CD Pipeline Setup

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

## Post-Deployment Verification

### Checklist
- [ ] Site loads without errors
- [ ] All pages accessible
- [ ] API calls working
- [ ] Payment gateway responding
- [ ] Search functionality working
- [ ] Login/Register functional
- [ ] Cart operations working
- [ ] Images loading properly
- [ ] Performance acceptable (< 3s LCP)
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] Analytics tracking firing

### Performance Monitoring
```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://moryella.com --view

# WebPageTest
# https://www.webpagetest.org
```

### Error Tracking Setup
```javascript
// Sentry (Error tracking)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Analytics Setup
```javascript
// Google Analytics
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function GoogleAnalytics() {
  const router = useRouter();
  
  useEffect(() => {
    window.gtag?.('config', 'GA_MEASUREMENT_ID', {
      page_path: router.pathname,
    });
  }, [router.pathname]);
  
  return null;
}
```

## Monitoring & Maintenance

### Uptime Monitoring
- StatusPage.io for status dashboard
- Pingdom or UptimeRobot for alerts
- Set up 24/7 monitoring

### Log Management
```bash
# View server logs
pm2 logs moryella

# Or use cloud logging
# AWS CloudWatch
# Google Cloud Logging
# Datadog
```

### Regular Updates
```bash
# Monthly security updates
npm audit
npm audit fix

# Quarterly dependency updates
npm outdated
npm update
```

### Backup Strategy
- Daily database backups
- Weekly full backups to S3
- Test restoration monthly

## Rollback Procedure

### If deployment fails
```bash
# Revert to previous version
git revert HEAD
npm run build
# Redeploy

# Or use deployment platform's rollback
vercel rollback  # Vercel
aws amplify stop && aws amplify start  # AWS
```

## Troubleshooting

### High CPU Usage
- Check for infinite loops
- Optimize database queries
- Enable caching

### Memory Leaks
- Profile with Chrome DevTools
- Check for unmounted listeners
- Use memory profiler

### Slow Page Load
- Run Lighthouse audit
- Optimize images
- Enable compression
- Use CDN

### Database Timeout
- Check connection pooling
- Optimize queries
- Increase timeout limits

## Cost Optimization

### Recommendations
1. **Vercel**: ~$20-100/month based on traffic
2. **AWS Amplify**: Pay-as-you-go (~$10-50/month)
3. **AWS EC2**: t3.micro free tier, then ~$10-30/month
4. **Google Cloud Run**: ~$0.00002500 per request

### Cost Reduction
- Use free tier services
- Compress images (75% size reduction possible)
- Enable caching (CDN)
- Optimize bundle size
- Use lazy loading

## Support & Documentation

- Issue Tracker: GitHub Issues
- Documentation: README.md
- API Docs: lib/api.ts
- Design System: components/
- Deployment: This file

## Contact & Escalation

- Frontend Lead: [contact]
- DevOps Lead: [contact]
- Backend Lead: [contact]
- On-call: [escalation process]
