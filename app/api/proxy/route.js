import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function checkAuth(request) {
  const auth = request.headers.get('authorization')
  if (!auth) return false
  
  const [scheme, encoded] = auth.split(' ')
  if (scheme !== 'Basic') return false
  
  const [username, password] = Buffer.from(encoded, 'base64').toString().split(':')
  return username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD
}

async function getChromePath() {
  // Priority: Environment variable > Vercel Chromium > Local Chrome
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH
  }
  
  // Try Vercel/Lambda Chromium
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      return await chromium.executablePath()
    } catch (e) {
      console.error('Chromium binary not found:', e)
      throw e
    }
  }
  
  // Fallback to common Chrome locations (local development only)
  const { platform } = process
  const paths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ]
  }
  
  // Only use fs in Node.js environment
  if (typeof require !== 'undefined') {
    try {
      const fs = require('fs')
      for (const path of paths[platform] || paths.linux) {
        if (fs.existsSync(path)) {
          return path
        }
      }
    } catch (e) {
      // fs not available in edge runtime
    }
  }
  
  throw new Error('Chrome executable not found. Please set CHROME_PATH environment variable.')
}

async function fetchPage(targetUrl) {
  const executablePath = await getChromePath()
  const isVercel = process.env.VERCEL === '1'
  
  const browser = await puppeteer.launch({
    args: isVercel ? chromium.args : [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    executablePath,
    headless: true
  })

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  
  const content = await page.content()
  const finalUrl = page.url()
  const origin = new URL(finalUrl).origin
  
  await browser.close()

  const modifiedContent = content
    .replace(/href="\/([^"]*)"/g, `href="/api/proxy?url=${encodeURIComponent(origin)}/$1"`)
    .replace(/href='\/([^']*)'/g, `href='/api/proxy?url=${encodeURIComponent(origin)}/$1'`)
    .replace(/<form([^>]*?)action="([^"]*)"([^>]*?)>/gi, (match, before, action, after) => {
      const fullUrl = action.startsWith('http') ? action : (action.startsWith('/') ? origin + action : origin + '/' + action)
      return `<form${before}action="/api/proxy?url=${encodeURIComponent(fullUrl)}" method="POST"${after}>`
    })
    .replace(/src="\/([^"]*)"/g, `src="/api/resource?url=${encodeURIComponent(origin + '/$1')}"`)
    .replace(/src='\/([^']*)'/g, `src='/api/resource?url=${encodeURIComponent(origin + '/$1')}'`)

  return modifiedContent
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    })
  }

  const url = new URL(request.url)
  let targetUrl = url.searchParams.get('url')
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://scholar.google.com' + (targetUrl.startsWith('/') ? '' : '/') + targetUrl
  }
  
  if (url.search && !targetUrl.includes('?')) {
    const params = new URLSearchParams(url.search)
    params.delete('url')
    if (params.toString()) {
      targetUrl += '?' + params.toString()
    }
  }

  try {
    const content = await fetchPage(targetUrl)
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    })
  }

  const url = new URL(request.url)
  const baseUrl = url.searchParams.get('url')
  
  if (!baseUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  const formData = await request.formData()
  const urlObj = new URL(baseUrl)
  
  for (const [key, value] of formData.entries()) {
    urlObj.searchParams.set(key, value)
  }
  
  const targetUrl = urlObj.toString()
  
  try {
    const content = await fetchPage(targetUrl)
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
