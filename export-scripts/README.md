# ArborQuant Complete Export & Migration Guide

## Overview
This directory contains complete export scripts and setup instructions for migrating the ArborQuant project to a fresh start while preserving all data, logic, and configurations.

## Project Assets Inventory
- **Database**: 51 tables with comprehensive arboricultural data
- **Edge Functions**: 3 serverless functions (OCR, translation, data extraction)
- **Frontend**: 50+ React components with authentication, mapping, and KB management
- **Design System**: Custom ArborQuant forest-green theme with semantic tokens
- **Dependencies**: 28 production packages including Supabase, React, Leaflet, etc.

## Quick Start
1. Run the database export scripts
2. Save all edge functions and configurations
3. Create a new Lovable project
4. Follow the restoration guide

## Files in this directory
- `01-database-export.sql` - Complete database schema and data export
- `02-edge-functions-backup.md` - Edge functions preservation
- `03-component-inventory.md` - Frontend structure documentation
- `04-fresh-setup-guide.md` - Step-by-step restoration process
- `05-config-files/` - All configuration files