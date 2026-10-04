import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const envDomain = process.env.ALLOWED_DOMAIN || 'localhost';
    const allowedDomains = ['localhost', '127.0.0.1', envDomain];
    const domain = parsedUrl.hostname;
    
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json({ 
        error: 'Domain not allowed', 
        details: `Only ${allowedDomains.join(', ')} domains are permitted for security reasons`
      }, { status: 400 });
    }

    // Protocol validation - only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ 
        error: 'Protocol not allowed', 
        details: 'Only HTTP and HTTPS protocols are permitted'
      }, { status: 400 });
    }

    const result = await visitViaXSSBot(url);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin visited your URL successfully!',
      details: result,
      mode: 'xss-bot-service'
    });

  } catch (error) {
    console.error('Admin visit error:', error);
    return NextResponse.json({ 
      error: 'Failed to visit URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function visitViaXSSBot(url: string) {
  try {
    // Call the xss-bot service
    // Use internal service name if in Kubernetes, otherwise use external URL
    const xssBotUrl = process.env.XSS_BOT_URL || 
                     (process.env.NODE_ENV === 'production' ? 
                      'http://admin-bot.kubectf-challenges.svc.cluster.local' : 
                      'https://admin-bot.chal.secjhu.club');
    
    console.log(`Calling XSS Bot service at ${xssBotUrl}/visit for URL: ${url}`);
    const response = await fetch(`${xssBotUrl}/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url, challenge: 'pretty-chatbot'}),
    });

    if (!response.ok) {
      throw new Error(`XSS Bot service returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      status: 'visited',
      timestamp: new Date().toISOString(),
      url: url,
      xss_bot_response: result,
      note: 'Admin visited page via XSS Bot service.'
    };

  } catch (error) {
    console.error('XSS Bot service error:', error);
    throw new Error(`Failed to call XSS Bot service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}