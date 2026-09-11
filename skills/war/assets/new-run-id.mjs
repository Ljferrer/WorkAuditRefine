#!/usr/bin/env node
// Lead-side only: fresh run/recovery identity; never evaluate randomness inside Workflow.
import { randomUUID } from 'node:crypto'
process.stdout.write(randomUUID() + '\n')
