# Reglite - a private NPM registry

### Really?

Yea. You can publish to it.

### How?

Stores packages in a folder. Proxies to an actual registry for packages you haven't published.

### No, I mean how to I run this?

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

### Is this the best?

Yes.

## License

ISC
