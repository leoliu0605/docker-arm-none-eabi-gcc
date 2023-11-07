# TODO

After [arm-none-eabi-gcc-action](https://github.com/carlosperate/arm-none-eabi-gcc-action) merged my [PR](https://github.com/carlosperate/arm-none-eabi-gcc-action/pull/48), add the following to GitHub Actions workflow file:

```
curl -o src\gcc.ts https://raw.githubusercontent.com/carlosperate/arm-none-eabi-gcc-action/main/src/gcc.ts
```

Get `gcc.ts` using above command before running `npm start` to make sure the latest version is used.
