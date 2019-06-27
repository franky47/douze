# The Twelve Factors

The [Twelve Factor App manifesto](https://12factor.net/) was written by
Adam Wiggins and others.

## The Original Twelve Factors

### [1. Codebase](https://12factor.net/codebase)

### [2. Dependencies](https://12factor.net/dependencies)

### [3. Configuration](https://12factor.net/config)

Runtime-aware vs static configuration

### [4. Backing Services](https://12factor.net/backing-services)

> Treat backing services as attached resources

Douze has plugins for handling backing services:

- [`douze-sequelize`](https://github.com/franky47/douze-sequelize) for SQL databases

Backing service plugins make good use of Douze's hook system to abstract
the connection to a third party service, error monitoring and logging.
They also provide environment variable configuration for their internal
features, preferred over code as configuration for runtime-aware options.

### [5. Build, Release, Run](https://12factor.net/build-release-run)

### [6. Processes](https://12factor.net/processes)

### [7. Port Binding](https://12factor.net/port-binding)

Douze will expose a HTTP server at the following location:

```
http://${HOST:-0.0.0.0}:${PORT:-3000}
```

For non-Unix speakers, this means the environment variable `HOST` will
define the listening address, with a fallback to `0.0.0.0` if not set,
and the port will be defined by the environement variable `PORT`, or
`3000` if not set.

### [8. Concurrency](https://12factor.net/concurrency)

### [9. Disposability](https://12factor.net/disposability)

### [10. Dev / Prod Parity](https://12factor.net/dev-prod-parity)

### [11. Logs](https://12factor.net/logs)

Logs are produced as JSON, in a newline-delimited stream, produced by
[Pino](https://github.com/pinojs/pino).

Formatting of the logs (filtering, pretty-printing and other forms of
processing) is done off-process.

Douze provides a [prettifier](https://github.com/franky47/douze-prettify-logs)
to account for the fields it adds to the logs.

### [12. Admin Processes](https://12factor.net/admin-processes)

> _Admin code must ship with application code to avoid synchronization issues._

Also because configuration is stored in the environment, which should not
be accessible elsewhere than the production environment for security
reasons.

Douze provides admin processes in the form of [Tasks](./tasks.md).

## The Additional Twelve Factors

### 13. Security

Security must be a first-class citizen of any modern web application,
and thought of as a process rather than a single operation done once
at the start of a project.

Like privacy, it is also a mindset, but because not everybody has the same
sensitivity to it, it is better defined as a process.

- Monitor your dependencies for vulnerabilities
- Monitor your own code for vulnerabilities
- Follow the OWASP best practices
- Redact security-related fields in logs (Douze does that for basic HTTP headers, but you can extend the behaviour to your application's needs)

Douze has a few built-in security features:

- Redaction of log fields and critical environment variables values
- Security headers (provided by [`helmet`](https://github.com/helmetjs/helmet))

### 14. Privacy

Douze protects the privacy of your users by default, and will redact
the source IP and user-agent header from your logs.

For cross-request user tracking, an anonimized identifier is provided.

### 15. Transparency

### 16. Eco-Consciousness

### 17. Documentation

### 18. Automation

### 19. Robustness

### 20. Testing

### 21. Maintainability

### 22. Interoperability

### 23. Cognitive Load & Complexity

### 24. Monitoring
