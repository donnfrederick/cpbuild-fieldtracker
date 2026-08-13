# API Interface

This directory contains the interfaces used by the API and shared with the frontend. These interfaces help ensure consistency in data structures across both the backend and frontend.

## Folder Structure

- `interfaces/`
    - `{toolName}/`
        - `{endpointName}/`
            - `index.ts` 
                - Export all interfaces in this folder. This allows simplified imports, e.g., `api/inspectionTracker/completedInspections`
            - `{interfaceName}.ts` – Contains interface definitions related to the endpoint.

## Example

- `interfaces`
    - `inspectionTracker`
        - `completedInspections`
            - `index.ts`
            - `completedInspection`