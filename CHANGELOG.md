# Changelog

All notable changes to this project will be documented in this file.
Please, document here only changes visible to the client app.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-06-04

### [0 Claude Symlink Configuration](https://github.com/torqlab/strava-api/issues/0)

### Changed

- Updated `.claude` directory symlink configuration for proper Claude Code integration

## [1.3.0] - 2026-06-03

### [55 Query Athlete and GitHub App Authentication](https://github.com/torqlab/torq/issues/55)

### Added

- GitHub App authentication for GitHub MCP integration (replaces PAT-based auth)
- Environment variables for GitHub App credentials in .env configuration

## [1.2.0] - 2026-06-03

### [55 Query Athlete](https://github.com/torqlab/torq/issues/55)

### Added

- Fetch athlete module with `fetchStravaAthlete` function to retrieve authenticated athlete profile data
- `StravaAthlete` TypeScript type definition for athlete response validation
- New API endpoint constant for athlete endpoint

## [1.1.1] - 2026-03-03

### [47 Better Error Handling](https://github.com/torqlab/torq/issues/47)

### Added

- Better error handling to the Strava API Client

## [1.1.0] - 2026-03-03

### [47 Export TypeScript Types for External Use](https://github.com/torqlab/torq/issues/47)

### Added

- Export `StravaApiConfig` and `StravaActivity` TypeScript types from the package index

## [1.0.0] - 2026-02-26

### Added

- Base implementation
