# Getting Started Guide

This guide will help you set up and configure your WhatsApp Instance Manager.

## Prerequisites

Before you begin, make sure you have:

- Docker and Docker Compose installed
- Node.js 18+ installed
- Access to the project's `.env` file

## Step 1: Start the Services

Start all required services using Docker Compose:

```bash
npm run docker:up
```

This will start:
- Evolution API (http://localhost:8080)
- PostgreSQL Database
- Redis Cache
- Next.js Application (http://localhost:3000)

Wait a few minutes for all services to initialize.

## Step 2: Check Service Status

Verify all services are running:

```bash
npm run docker:ps
```

You should see all services with status "Up".

## Step 3: Access the Application

1. Open your browser and navigate to http://localhost:3000
2. If you already have an account, log in. Otherwise, create a new account using the registration page.

## Step 4: Configure Evolution API Connection

This is the most important step! Before you can create WhatsApp instances, you need to configure your Evolution API connection.

### Getting Your API Credentials

Your Evolution API credentials are in the `.env` file:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=evo_api_key_2024_secure_random_32chars_min
```

### Configuring in the Application

1. **Navigate to Settings**
   - Click on your profile icon in the top right
   - Select "Settings" from the menu
   - Or click the "Go to Settings" button on the Instances page

2. **Go to API Tab**
   - Click on the "API" tab in the settings

3. **Enter Your Credentials**
   - **Evolution API URL**: Enter `http://localhost:8080`
   - **Evolution API Key**: Copy the key from your `.env` file

4. **Test the Connection**
   - Click the "Test Connection" button
   - Wait for the test to complete
   - You should see a green success message

5. **Save Configuration**
   - Click "Save Configuration"
   - You should see a "Configuration saved" toast notification

## Step 5: Create Your First WhatsApp Instance

Now that Evolution API is configured, you can create WhatsApp instances:

1. **Navigate to Instances Page**
   - Click "Instances" in the sidebar

2. **Create New Instance**
   - Click the "New Instance" button
   - Enter a name for your instance (e.g., "My WhatsApp")
   - Click "Create Instance"

3. **Scan QR Code**
   - A QR code will appear in a dialog
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices > Link a Device
   - Scan the QR code displayed on your screen

4. **Wait for Connection**
   - The instance will connect automatically
   - Once connected, the status will change to "Connected"

## Step 6: Start Using Your Instance

Once your instance is connected, you can:

- **View Conversations**: Click on an instance to see all conversations
- **Send Messages**: Use the chat interface to send messages
- **Create Broadcasts**: Send messages to multiple contacts
- **Configure AI Agents**: Set up automated responses
- **Manage Contacts**: View and organize your contacts
- **Set Up Webhooks**: Receive real-time notifications

## Troubleshooting

### Issue: "Evolution API Not Configured" Error

**Solution**: Follow Step 4 to configure your Evolution API connection.

### Issue: QR Code Won't Scan

**Solutions**:
- Increase your screen brightness
- Clean your phone's camera
- Try moving closer or further from the screen
- Ensure good lighting
- Refresh and generate a new QR code if it expired

### Issue: Instance Won't Connect

**Solutions**:
1. Check if Evolution API is running: `npm run docker:logs:evolution`
2. Verify your API credentials are correct in Settings
3. Try restarting the Evolution API: `npm run docker:restart:evolution`
4. Check your network connection

### Issue: Cannot Create Instance

**Solutions**:
1. Ensure Evolution API is configured in Settings
2. Test the connection in Settings > API tab
3. Check Docker logs: `npm run docker:logs`
4. Verify all services are running: `npm run docker:ps`

## Useful Commands

### Docker Management

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs from all services
npm run docker:logs

# View Evolution API logs only
npm run docker:logs:evolution

# Restart Evolution API
npm run docker:restart:evolution

# Check service status
npm run docker:ps

# Update Evolution API to latest version
npm run docker:update:evolution

# Clean everything (removes volumes)
npm run docker:clean
```

### Application Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Environment Variables

Key environment variables in `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Evolution API Configuration
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=<your-api-key>

# Database Configuration
POSTGRES_USER=evolution
POSTGRES_PASSWORD=<your-postgres-password>
POSTGRES_DB=evolution

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Best Practices

1. **Change Default Passwords**
   - Update the `POSTGRES_PASSWORD` in `.env`
   - Update the `EVOLUTION_API_KEY` to a secure random string

2. **Keep Credentials Secret**
   - Never commit `.env` file to version control
   - Never share your API keys publicly

3. **Use Strong Passwords**
   - Use passwords with at least 16 characters
   - Include uppercase, lowercase, numbers, and symbols

4. **Regular Updates**
   - Keep Evolution API updated: `npm run docker:update:evolution`
   - Update npm packages regularly
   - Monitor for security advisories

## Next Steps

After completing the basic setup:

1. **Configure AI Agents**: Set up automated responses for common queries
2. **Create Broadcasts**: Send bulk messages to your contacts
3. **Set Up Webhooks**: Integrate with other services
4. **Manage Knowledge Base**: Upload documents for AI-powered responses
5. **Customize Settings**: Configure your profile and preferences

## Getting Help

If you encounter issues:

1. Check the logs: `npm run docker:logs`
2. Verify all services are running: `npm run docker:ps`
3. Review the troubleshooting section above
4. Check Evolution API documentation: https://doc.evolution-api.com/
5. Restart services if needed: `npm run docker:restart`

## Important Notes

- QR codes expire after 30 seconds for security
- WhatsApp may disconnect instances that are inactive for extended periods
- Keep your Evolution API and application updated
- Regularly backup your database
- Monitor your instance status in the dashboard

## Production Deployment

For production deployment, refer to:
- `PRODUCTION_READY.md` - Production deployment guide
- `DEPLOYMENT.md` - Deployment instructions
- `DOCKER_SETUP.md` - Docker configuration details

---

**Congratulations!** You're now ready to start managing WhatsApp instances through the application.
