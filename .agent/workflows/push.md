---
description: Auto-commit and push all changes to GitHub after every update
---

# Auto Push Workflow

After making any code change to the Techknow website, ALWAYS run these steps automatically:

// turbo-all

1. Stage all changes:
```
git add -A
```

2. Commit with a descriptive message:
```
git commit -m "<descriptive message about the change>"
```

3. Push to GitHub:
```
git push origin master
```

4. Confirm the push was successful by checking the output for `master -> master`.

**Working directory:** `c:\Users\anjan\Desktop\Techknow`

**Important:** Run these commands after EVERY file modification, no matter how small. The user has requested that all changes are automatically deployed.
