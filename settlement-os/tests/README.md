Run locally from repository root:

```bash
node --test settlement-os/tests/*.test.mjs
node --check settlement-os/app.js
node --check settlement-os/core.mjs
node --check settlement-os/data.mjs
```

Browser smoke-tested with Chromium using an inline test harness because this environment blocks localhost navigation by policy.