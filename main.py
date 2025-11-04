"""
Minimal URL Shortener for Vercel - Testing Version
"""

# Robust Vercel handler for testing
def handler(request, context):
    """Vercel serverless function handler with comprehensive error handling"""
    try:
        # Check if we're in Vercel environment
        import os
        vercel_env = os.getenv('VERCEL_ENV')

        # Get request path
        path = request.get('path', '/')

        # Handle API routes
        if path.startswith('/api/'):
            if path == '/api/version':
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': '{"version": "1.0.0", "status": "ok"}'
                }
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': '{"message": "API endpoint not implemented"}'
            }

        # Handle root path - serve HTML
        if path == '/' or path == '':
            try:
                # Try multiple possible paths for index.html
                possible_paths = ['index.html', './index.html']
                html_content = None
                file_found = None

                for path_option in possible_paths:
                    try:
                        with open(path_option, 'r', encoding='utf-8') as f:
                            html_content = f.read()
                            file_found = path_option
                            break
                    except FileNotFoundError:
                        continue
                    except Exception as file_error:
                        # Log file read errors but continue trying
                        print(f"Error reading {path_option}: {file_error}")
                        continue

                if html_content and file_found:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'text/html',
                            'Cache-Control': 'public, max-age=300'
                        },
                        'body': html_content
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'text/plain'},
                        'body': f'HTML file not found. Tried: {", ".join(possible_paths)}'
                    }

            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'text/plain'},
                    'body': f'File system error: {str(e)}'
                }

        # Handle short URL redirects (would need database)
        # For now, return not found
        if len(path.strip('/')) > 0 and not path.startswith('/api/'):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'text/plain'},
                'body': f'Short URL not found: {path}'
            }

        # Default response for unhandled paths
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'text/plain'},
            'body': f'Path not handled: {path}'
        }

    except Exception as e:
        # Catch-all error handler
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'text/plain'},
            'body': f'Handler error: {str(e)}'
        }

# Local development server - simplified for testing
if __name__ == "__main__":
    print("Local development server not available in minimal mode")
    print("Use the Vercel handler for testing")
