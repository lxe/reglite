# Reglite - a private npm registry

### Really?

Yea. You can publish to it.

### How?

Stores packages in a folder. Proxies to an actual registry for packages you haven't published.

### No, I mean how do I run this?

```
npm install -g reglite
reglite
```

Now install packages!

```
npm install --registry="http://localhost:3000" supermoon
```

And publish packages!

```
npm publish --registry="http://localhost:3000"
```

## License

ISC
