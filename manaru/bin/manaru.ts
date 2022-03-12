#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ManaruStack } from '../lib/manaru-stack';

const app = new cdk.App();
new ManaruStack(app, 'ManaruStack');
