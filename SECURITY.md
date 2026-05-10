# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | ✅ Active Support  |
| < 1.0   | ❌ No Support      |

## Reporting a Security Vulnerability

**Do not open public issues for security vulnerabilities!**

If you discover a security vulnerability in StackForge, please email **security@example.com** with:

1. **Description** — What is the vulnerability?
2. **Location** — Which file/component is affected?
3. **Reproduction** — Steps to reproduce (if safe to share)
4. **Impact** — What could an attacker do?
5. **Suggested Fix** — Any ideas for fixing it?

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: We'll confirm the vulnerability and assess severity
- **Fix Development**: We'll work on a patch
- **Coordinated Disclosure**: We'll announce once a fix is available

## Security Measures

StackForge implements the following security controls:

### Authentication & Authorization
- JWT-based stateless authentication
- Secure password hashing with bcrypt
- Role-based access control (RBAC)
- Middleware-enforced authorization checks

### Data Protection
- SQL injection prevention via Prisma ORM (parameterized queries)
- Input validation with Zod schemas
- HTTPS enforcement in production
- Secure CORS configuration

### Infrastructure
- Environment-variable-based secrets (never hardcoded)
- Database connection pooling
- Request rate limiting (recommended)
- CSRF tokens for state-changing operations

### Code Quality
- TypeScript for type safety
- Regular dependency updates
- Security audits via `npm audit`

## Security Checklist for Deployment

Before going to production:

- [ ] `JWT_SECRET` set to a strong random value
- [ ] `NODE_ENV=production`
- [ ] Database credentials secure (never hardcoded)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database backups enabled
- [ ] Logs monitored
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] Dependencies up to date (`npm audit`)

## Dependencies & Vulnerability Scanning

We regularly update dependencies and monitor security:

```bash
# Check for known vulnerabilities
npm audit

# Update packages
npm update
npm audit fix  # Auto-fix if safe
```

## Common Vulnerabilities

### SQL Injection
**Protected**: Prisma uses parameterized queries automatically.

### XSS (Cross-Site Scripting)
**Protected**: React escapes content by default; Tailwind classes are static.

### CSRF (Cross-Site Request Forgery)
**Recommend**: Use SameSite cookie attribute and CSRF tokens for state-changing operations.

### Weak Authentication
**Protected**: JWT with secure secrets; password hashing with bcrypt.

### Insecure Dependencies
**Mitigated**: Regular `npm audit` and dependency updates.

## Best Practices for Users

- **Update frequently**: Keep StackForge and dependencies up to date
- **Rotate secrets**: Change `JWT_SECRET` periodically
- **Monitor logs**: Watch for suspicious activity
- **Use HTTPS**: Always use TLS in production
- **Backup data**: Regular database backups
- **Minimal privileges**: Grant users only needed permissions

## Questions?

Email **security@example.com** for security-related questions or concerns.

---

*Last Updated: 2026-05-10*
