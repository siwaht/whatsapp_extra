# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Optional
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key
```

### 2. Database Setup

Run all migrations in Supabase:
```bash
# Migrations are located in supabase/migrations/
# Apply them in order through Supabase Dashboard or CLI
```

Verify RLS (Row Level Security) is enabled on all tables:
- ✓ All tables have RLS enabled
- ✓ Policies are restrictive by default
- ✓ Users can only access their own data

### 3. Security Configuration

**Database Security:**
- [ ] RLS enabled on all tables
- [ ] Service role key kept secure and never exposed to client
- [ ] CORS policies configured in Supabase
- [ ] API rate limiting configured if needed

**Application Security:**
- [ ] HTTPS enabled
- [ ] Security headers configured (already in next.config.js)
- [ ] Environment variables secured
- [ ] No sensitive data in client-side code

### 4. Performance Optimization

**Already Configured:**
- ✓ React Strict Mode enabled
- ✓ Image optimization with AVIF/WebP
- ✓ Compression enabled
- ✓ Static page generation where possible
- ✓ Error boundaries in place

**Recommended:**
- [ ] CDN configured for static assets
- [ ] Database connection pooling (if using many connections)
- [ ] Caching strategy for frequent queries

### 5. Monitoring & Logging

**Error Tracking:**
- Console errors are logged server-side
- Error boundary catches client-side errors
- Consider integrating: Sentry, LogRocket, or similar

**Analytics:**
- Consider: Vercel Analytics, Google Analytics, or Plausible

**Uptime Monitoring:**
- Consider: UptimeRobot, Pingdom, or similar

## Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add all required variables from .env.example
   - Ensure NEXT_PUBLIC_APP_URL matches your domain

3. **Custom Domain:**
   - Add domain in Project Settings > Domains
   - Configure DNS records as instructed

### Netlify

1. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Install plugin: @netlify/plugin-nextjs (already in package.json)

2. **Environment Variables:**
   - Add all variables in Site Settings > Environment Variables

### Docker

```dockerfile
# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t whatsappx .
docker run -p 3000:3000 --env-file .env.production whatsappx
```

## Post-Deployment Steps

### 1. Create Admin User

Run the setup-admin Edge Function or create manually:
```sql
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@example.com', crypt('your-secure-password', gen_salt('bf')), NOW());
```

Then update their role to admin in the profiles table.

### 2. Test Critical Flows

- [ ] User registration and login
- [ ] Instance creation and connection
- [ ] Message sending and receiving
- [ ] Webhook processing
- [ ] AI agent functionality
- [ ] Knowledge base uploads

### 3. Configure Evolution API

If using Evolution API:
- Set up webhook URL: `https://your-domain.com/api/webhooks`
- Configure webhook events
- Test webhook delivery

### 4. Monitor Initial Traffic

- Check error logs
- Monitor API response times
- Watch database query performance
- Verify webhook processing

## Rollback Plan

If issues occur:

1. **Quick Rollback:**
   ```bash
   # Vercel
   vercel rollback

   # Netlify
   # Use Netlify Dashboard to rollback to previous deployment
   ```

2. **Database Rollback:**
   - Supabase doesn't support automatic migration rollback
   - Manual rollback may be needed
   - Always test migrations on staging first

## Scaling Considerations

### Horizontal Scaling
- Next.js supports horizontal scaling out of the box
- Ensure database can handle increased connections
- Consider Supabase connection pooling

### Database Optimization
- Add indexes for frequently queried columns
- Monitor slow queries in Supabase dashboard
- Consider read replicas for heavy read workloads

### Caching
- Implement Redis for session storage if needed
- Use React Query caching (already configured)
- Consider CDN caching for static assets

## Maintenance

### Regular Tasks
- [ ] Review error logs weekly
- [ ] Monitor database size and performance
- [ ] Update dependencies monthly
- [ ] Review and rotate API keys quarterly
- [ ] Backup database regularly (Supabase does this automatically)

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Run tests
npm test

# Build and test locally
npm run build
```

## Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript errors: `npm run typecheck`
- Verify environment variables are set
- Check Next.js and dependency versions

**Runtime Errors:**
- Check browser console for client errors
- Check server logs for API errors
- Verify Supabase connection
- Check RLS policies

**Performance Issues:**
- Check database query performance
- Monitor API response times
- Check image optimization
- Review bundle size: `npm run build` shows sizes

**Webhook Issues:**
- Verify webhook URL is accessible
- Check webhook signature validation
- Monitor webhook event processing logs
- Ensure NEXT_PUBLIC_APP_URL is correct

## Support

For issues:
1. Check application logs
2. Review Supabase logs
3. Check Evolution API status
4. Review GitHub issues
5. Contact support team

## Security Incident Response

If security issue is discovered:
1. Assess severity and impact
2. Rotate compromised credentials immediately
3. Deploy fixes ASAP
4. Notify affected users if needed
5. Document incident and response
