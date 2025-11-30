# Test Setup Documentation

## Overview

This project uses AdonisJS with Japa test runner. Tests are automatically isolated using database transactions and a separate test database.

## Test Database

### Automatic Setup (Recommended)

When you start the development environment with `docker-compose -f docker-compose.dev.yml up`, the following happens automatically:

1. **PostgreSQL** creates two databases:
   - `app` - Development database
   - `test` - Test database (created by [postgres-init/01-init-test-db.sh](../../postgres-init/01-init-test-db.sh))

2. **MinIO** creates the `uploads` bucket automatically via the `createbuckets` service

3. **Test runner** automatically runs migrations on the test database before tests start (configured in [tests/bootstrap.ts](./bootstrap.ts))

### Configuration Files

- [.env](./../.env) - Development environment variables (uses `DB_DATABASE=app`)
- [.env.test](./../.env.test) - Test environment variables (uses `DB_DATABASE=test`)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file (note: use the npm script, not direct ace command)
npm test
```

## Test Isolation

Each test is wrapped in a database transaction that is automatically rolled back after the test completes. This is configured using:

```typescript
group.each.setup(() => testUtils.db().withGlobalTransaction())
```

This ensures:
- Tests don't interfere with each other
- No cleanup code is needed
- Tests can run in any order

## Recreating the Test Environment

If you need to recreate the databases from scratch:

```bash
# Stop containers and remove volumes
cd test-app-docker
docker-compose -f docker-compose.dev.yml down
docker volume rm test-app-docker_postgres_volume test-app-docker_minio_volume

# Start fresh
docker-compose -f docker-compose.dev.yml up -d

# Wait for initialization (about 10 seconds)
sleep 10

# Run migrations on development database
cd backend
node ace migration:run

# Seed development database (optional)
node ace db:seed

# Run tests (migrations run automatically for test database)
npm test
```

## Troubleshooting

### Tests fail with "database not found"

The test database hasn't been created. Recreate the postgres volume:
```bash
docker-compose -f docker-compose.dev.yml down
docker volume rm test-app-docker_postgres_volume
docker-compose -f docker-compose.dev.yml up -d
```

### Tests fail with "bucket not found"

The MinIO bucket hasn't been created. Check the `minio-setup` container logs:
```bash
docker logs minio-setup
```

If it failed, restart the services:
```bash
docker-compose -f docker-compose.dev.yml restart minio
docker-compose -f docker-compose.dev.yml up -d createbuckets
```

### Tests see data from other tests

Make sure each test group has the transaction setup:
```typescript
group.each.setup(() => testUtils.db().withGlobalTransaction())
```
