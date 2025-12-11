# WhatsApp Instance Setup Guide

## Overview
This guide explains how to create and connect WhatsApp instances using the Evolution API integration.

## Prerequisites

Before creating instances, you must:

1. **Configure Evolution API Settings**
   - Go to **Settings > API** tab
   - Enter your Evolution API URL (e.g., `https://your-evolution-api.com`)
   - Enter your Evolution API Key
   - Click Save

## Creating a New Instance

### Step 1: Navigate to Instances Page
- Click on **Instances** in the sidebar
- Click the **New Instance** button

### Step 2: Create Instance
- Enter a unique instance name (e.g., `my-whatsapp-1`)
- Click **Create Instance**

### What Happens:
1. ✅ Creates the instance in Evolution API
2. ✅ Saves the instance to your database
3. ✅ Automatically displays QR code for connection
4. ✅ Configures webhook for receiving messages

### Step 3: Connect via QR Code
- A QR code will appear immediately after creation
- Open WhatsApp on your phone
- Go to **Linked Devices**
- Scan the QR code
- Wait for connection confirmation

## Connecting an Existing Instance

If you already have instances in Evolution API:

1. Click the **Sync** button on the Instances page
2. Your existing instances will be synced from Evolution API
3. Click the **⋮** menu on any disconnected instance
4. Select **Connect**
5. Scan the QR code with WhatsApp

## Auto-Sync Feature

The application automatically syncs instance status when:
- You load the Instances page
- You manually click the Sync button
- This ensures status is always up-to-date

## Troubleshooting

### "Failed to create instance"
**Cause**: Evolution API is not configured or unreachable
**Solution**:
1. Check your Evolution API URL and Key in Settings
2. Ensure your Evolution API server is running
3. Verify network connectivity

### "Failed to generate QR code"
**Cause**: Instance doesn't exist in Evolution API
**Solution**:
1. Delete the instance from the UI
2. Create a new instance (which will create it in Evolution API)
3. The QR code should appear automatically

### "Instance not syncing"
**Cause**: Evolution API credentials are incorrect
**Solution**:
1. Verify your API URL and Key in Settings
2. Click the Sync button manually
3. Check browser console for errors

### QR Code Expired
**Cause**: QR codes expire after 2-3 minutes
**Solution**:
1. Click Connect on the instance again
2. A new QR code will be generated
3. Scan it quickly with WhatsApp

## Instance Status

- **🟢 Connected (open)**: Instance is connected and ready
- **🟡 Connecting**: Instance is connecting to WhatsApp
- **🔴 Disconnected (close)**: Instance needs to be connected

## Best Practices

1. **Use Descriptive Names**: Name instances clearly (e.g., `support-team`, `sales-bot`)
2. **Monitor Status**: Check instance status regularly
3. **Webhook Configuration**: Webhooks are auto-configured on creation
4. **Keep Connected**: If an instance disconnects, reconnect it quickly

## Webhook Events

When you create an instance, the following webhook events are automatically configured:
- `MESSAGES_UPSERT`: New incoming messages
- `MESSAGES_UPDATE`: Message status updates
- `CONNECTION_UPDATE`: Connection status changes
- `QRCODE_UPDATED`: QR code updates

Webhook URL: `{YOUR_APP_URL}/api/webhooks`

## API Endpoints Used

The instance management uses these API endpoints:

- `POST /api/instances` - Create instance in Evolution API
- `POST /api/instances/connect` - Get QR code for connection
- `POST /api/instances/sync` - Sync instances from Evolution API
- `POST /api/instances/restart` - Restart an instance
- `DELETE /api/instances/delete` - Delete instance from Evolution API

## Evolution API Endpoints

Behind the scenes, these Evolution API endpoints are called:

- `POST /instance/create` - Create new instance
- `GET /instance/connect/{name}` - Get QR code
- `GET /instance/fetchInstances` - List all instances
- `PUT /instance/restart/{name}` - Restart instance
- `DELETE /instance/delete/{name}` - Delete instance

## Security Notes

- Evolution API keys are stored securely in your profile
- Webhooks are authenticated via Supabase
- QR codes are generated fresh each time
- Instance data is protected by Row Level Security (RLS)

## Support

If you continue to experience issues:

1. Check the browser console for errors (F12)
2. Verify Evolution API server logs
3. Ensure your Evolution API version is compatible
4. Check that your webhook URL is accessible from Evolution API

## Recent Fixes

### ✅ Fixed: Instance Creation
- **Issue**: Instances were only created in database, not in Evolution API
- **Fix**: Now creates in both Evolution API and database
- **Result**: QR code appears immediately after creation

### ✅ Fixed: Auto-Sync
- **Issue**: Status not updating automatically
- **Fix**: Added auto-sync on page load
- **Result**: Instance status always reflects current state

### ✅ Fixed: QR Code Generation
- **Issue**: Connect button didn't work for new instances
- **Fix**: Proper instance creation flow with immediate QR display
- **Result**: QR code works on first connection attempt
