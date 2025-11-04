"""
Ultra-minimal Vercel handler for testing Python execution
"""

def handler(request, context):
    """Simplest possible Vercel handler"""
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'text/plain'},
        'body': 'Hello from Vercel Python! Handler executed successfully.'
    }

# Local development server - simplified for testing
if __name__ == "__main__":
    print("Local development server not available in minimal mode")
    print("Use the Vercel handler for testing")
