# Migration Steps for Cloud Apps Core

This document outlines the changes needed to migrate from the old plugin bridge system to the new Cloud Apps Core system.

## Prerequisites

### Install the New Package

First, install the required package:

```bash
yarn add @jtl-software/cloud-apps-core
```

### Remove the Old Package

After completing the migration, remove the old package:

```bash
yarn remove @jtl-software/platform-plugins-core
```

## Frontend Changes

### Overview of Changes

The migration involves three main pattern changes:
1. **Package and Import**: Switch from `platform-plugins-core` to `cloud-apps-core`
2. **Method Calls**: Add `.method` namespace to all bridge method calls
3. **Event Handling**: Add `.event` namespace to all event subscriptions

### 1. Import Changes

**Before:**
```typescript
import { createPluginBridge, PluginBridge } from '@jtl-software/platform-plugins-core';
```

**After:**
```typescript
import { AppBridge, createAppBridge } from '@jtl-software/cloud-apps-core';
```

### 2. Method Calling

**Before:**
```typescript
bridge.callMethod('methodName', ...args);
```

**After:**
```typescript
bridge.method.call('methodName', ...args);
```

### 3. Event Handling

**Before:**
```typescript
appBridge.subscribe('eventName', (data: EventDataType) => {
  // Handle event data
});
```

**After:**
```typescript
appBridge.event.subscribe('eventName', (data: EventDataType) => {
  // Handle event data
});
```

## Migration Checklist

- [ ] Install the new package: `yarn add @jtl-software/cloud-apps-core`
- [ ] Update import statements to use `AppBridge` and `createAppBridge`
- [ ] Replace `bridge.callMethod()` calls with `bridge.method.call()`
- [ ] Update event subscriptions to use `appBridge.event.subscribe()`
- [ ] Test all functionality after migration
- [ ] Update any TypeScript types if needed
- [ ] Remove the old package: `yarn remove @jtl-software/platform-plugins-core`
