# Changelog

All notable changes to the `RTK Query - Code Generator` for `Open API` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- New `operationIdTransformer` option controlling how OpenAPI `operationId` values become endpoint names. Accepts `"camelCase"` (the default, matching prior behavior), `"none"` to use the raw `operationId` verbatim, or a custom `(operationId: string) => string` function. `"none"` and custom functions require every operation to declare an `operationId`.
- New `enumStyle` option controlling how enums are emitted: `"union"` (default), `"enum"`, or `"as-const"`. Takes precedence over `useEnumType` when both are set.
- New `exportAllSchemas` option that exports every schema in the document, not only those referenced by an endpoint.
- `resolveOperationName` is now exported.

### Fixed

- Optional request bodies now generate an optional argument.
- `generateEndpoints` return type is narrowed by whether `outputFile` was supplied - `Promise<string>` without it, `Promise<void>` with it.

## 2.2.0 - 2025-12-07

### Added

- `endpointOverrides` entries accept explicit `providesTags` and `invalidatesTags`. These take precedence over the tags generated from the OpenAPI `tags` field, may be set on either a query or a mutation, and apply whether or not the global `tag` option is enabled. An empty array explicitly removes the tags. ([#5135](https://github.com/reduxjs/redux-toolkit/pull/5135))
- New `outputRegexConstants` option that exports a regex constant for each string property declaring a non-empty `pattern`, named `{typeName}{propertyName}Pattern` in camelCase. ([#5146](https://github.com/reduxjs/redux-toolkit/pull/5146))

## 2.1.0 - 2025-10-16

### Added

- New `esmExtensions` option that rewrites the generated `apiFile` import to the extension of its expected compiled output. ([#4743](https://github.com/reduxjs/redux-toolkit/pull/4743))
- New `useUnknown` option that emits `unknown` rather than `any` for empty schemas. ([#4999](https://github.com/reduxjs/redux-toolkit/pull/4999))
- The CLI is exposed through the package `exports` field, so it can be located with `require.resolve('@rtk-query/codegen-openapi/cli')`. ([#4977](https://github.com/reduxjs/redux-toolkit/pull/4977))

### Fixed

- Generated hooks now include `operationNameSuffix` when it is provided. ([#5089](https://github.com/reduxjs/redux-toolkit/pull/5089))
- Query parameters whose value is `0` or an empty string are no longer dropped from the generated request. ([#4782](https://github.com/reduxjs/redux-toolkit/pull/4782))
- Corrected the React Native package exports. ([#4887](https://github.com/reduxjs/redux-toolkit/pull/4887))

## 2.0.0 - 2024-10-14

### Added

- New `includeDefault` option that includes the `default` response type in the generated code.
- New `operationNameSuffix` option appended to generated operation names.
- New `prettierConfigFile` option that overrides the Prettier config used to format the generated code.
- New `httpResolverOptions` option, passed through to `SwaggerParser` when fetching the schema.
- `endpointOverrides` entries accept a `parameterFilter`, which selects which parameters are included in an endpoint. Path parameters cannot be filtered out.

### Changed

- **Breaking:** the `encodeParams` option was split into `encodePathParams` and `encodeQueryParams`.
- **Breaking:** `EndpointOverrides` now requires at least one override key besides `pattern`.
- The package ships both ESM and CJS behind an `exports` field, and the CLI is an ESM file.
- Upgraded to `oazapfts` 6 and Prettier 3.
- Resolved OpenAPI documents are cached per spec, so generating several output files from one schema only fetches it once.

### Fixed

- Operation-level parameters now override path item parameters that share both a name and an `in` value.
- A flattened optional argument is generated as an optional type.

## 1.2.0 - 2023-11-09

This version adds a new `mergeReadWriteOnly` configuration option (default to `false`) that, when set to `true` will not generate separate types for read-only and write-only properties.

## 1.1.3 - 2023-10-11

### Added

- Adds a temporary workaround for [4.9.0 and 4.10.0 generate circular types oazapfts/oazapfts#491](https://github.com/oazapfts/oazapfts/issues/491)

## 1.1.2 - 2023-10-11

### Added

- Support for Read Only Properties in the Open API spec. Previously, this property was ignored.
  - Now if the readOnly property is present and set to `true` in a schema, it will split the type into two types: one with the read only property suffixed as 'Read' and the other without the read only properties, using the same type name as before.
  - This may cause issues if you had your OpenAPI spec properly typed/configured, as it will remove the read onyl types from your existing type. You will need to switch to the new type suffixed as 'Read' to avoid missing property names.

## 1.1.1 - 2023-10-11

### Changed

- Codegen: better handling of duplicate param names ([Codegen: better handling of duplicate param names #3780](https://github.com/reduxjs/redux-toolkit/pull/3780))
  - If a parameter name is both used in a query and a parameter, it will be prefixed with `query`/`param` now to avoid conflicts

## 1.1.0 - 2023-10-11

### Added

- Option of generating real TS enums instead of string unions [Adds the option of generating real TS enums instead of string unions #2854](https://github.com/reduxjs/redux-toolkit/pull/2854)
- Compatibility with TypeScript 5.x versions as the codegen relies on the TypeScript AST for code generation
  - As a result also needs a higher TypeScript version to work with (old version range was 4.1-4.5)
- Changes depenendcy from a temporarily patched old version of `oazapfts` back to the current upstream version
