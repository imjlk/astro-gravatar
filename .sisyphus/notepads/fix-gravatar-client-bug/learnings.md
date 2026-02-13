### Bug Fixed: getProfiles Email Mapping\n- Fixed an issue where failed batch requests in  were incorrectly mapped to emails using the total  instead of the batch-specific index.\n- Improved robustness of error handling in batch processing.
### Bug Fixed: getProfiles Email Mapping
- Fixed an issue where failed batch requests in `getProfiles` were incorrectly mapped to emails using the total `results.length` instead of the batch-specific index.
- Improved robustness of error handling in batch processing.
